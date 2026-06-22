import React, { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport, safeValidateUIMessages } from "ai";
import type { UIMessage } from "ai";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@admin-template/ui/components/sheet";
import { Button } from "@admin-template/ui/components/button";
import { Textarea } from "@admin-template/ui/components/textarea";
import {
  SparklesIcon,
  XIcon,
  SendIcon,
  Loader2Icon,
  ArrowDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useIsMobile } from "@admin-template/ui/hooks/use-mobile";
import { useOrganization } from "../../../hooks/use-organization";

interface AssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AssistantHistoryResponse {
  threadId: string;
  messages: UIMessage[];
  total: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function parseAssistantHistoryResponse(value: unknown): Promise<AssistantHistoryResponse> {
  if (!isRecord(value) || typeof value.threadId !== "string") {
    throw new Error("Invalid assistant history response");
  }

  // safeValidateUIMessages requires at least one message; short-circuit for empty history
  const rawMessages = Array.isArray(value.messages) ? value.messages : [];
  if (rawMessages.length === 0) {
    return {
      threadId: value.threadId,
      messages: [],
      total: typeof value.total === "number" ? value.total : 0,
    };
  }
  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: rawMessages,
  });
  if (!validatedMessages.success) {
    throw validatedMessages.error;
  }

  return {
    threadId: value.threadId,
    messages: validatedMessages.data,
    total: typeof value.total === "number" ? value.total : validatedMessages.data.length,
  };
}

function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3"
      role="status"
      aria-label="Assistant is typing"
    >
      <style>{`
				@keyframes typing-dot {
					0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
					30% { transform: translateY(-4px); opacity: 1; }
				}
				@media (prefers-reduced-motion: reduce) {
					@keyframes typing-dot {
						0%, 100% { opacity: 1; }
					}
				}
			`}</style>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block size-[5px] rounded-full bg-muted-foreground"
          style={{
            animation: `typing-dot 1.2s ease-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export function AssistantSheet({ open, onOpenChange }: AssistantSheetProps) {
  const { organization, isLoading: isOrganizationLoading } = useOrganization();
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [scrollViewport, setScrollViewport] = useState<HTMLDivElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PER_PAGE = 20;
  const allMessagesRef = useRef<UIMessage[]>([]);
  const [displayedMessages, setDisplayedMessages] = useState<UIMessage[]>([]);

  const { messages, sendMessage, status, setMessages } = useChat<UIMessage>({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_API_URL}/api/ai/chat`,
      credentials: "include",
    }),
  });

  // Fetch chat history with TanStack Query
  const historyQueryKey = useMemo(
    () => ["assistant-history", organization?.id] as const,
    [organization?.id],
  );

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: historyQueryKey,
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat/history?all=true`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to load assistant history (${response.status})`);
      }
      return parseAssistantHistoryResponse(await response.json());
    },
    enabled: open && !isOrganizationLoading && !!organization?.id,
    staleTime: 30_000,
  });

  // Sync history data into displayed messages and useChat state
  useEffect(() => {
    if (!historyData || !organization?.id) return;

    allMessagesRef.current = historyData.messages;
    setTotalMessages(historyData.total);

    // Show the last PER_PAGE messages initially (most recent)
    const startIdx = Math.max(0, historyData.messages.length - PER_PAGE);
    const initialMessages = historyData.messages.slice(startIdx);
    setDisplayedMessages(initialMessages);
    setMessages(initialMessages);
  }, [historyData, organization?.id, setMessages, PER_PAGE]);

  // Clear state when organization changes (skip initial mount)
  const prevOrgIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevOrgIdRef.current !== undefined && prevOrgIdRef.current !== organization?.id) {
      allMessagesRef.current = [];
      setDisplayedMessages([]);
      setTotalMessages(0);
      setMessages([]);
    }
    prevOrgIdRef.current = organization?.id;
  }, [organization?.id, setMessages]);

  const isHydratingHistory = isHistoryLoading;
  const isStreaming = status === "streaming" || status === "submitted";
  const isChatBusy = isStreaming || isHydratingHistory;
  const lastMessage = messages[messages.length - 1];
  const showStandaloneTypingIndicator = isStreaming && lastMessage?.role !== "assistant";
  // Native scroll container; state-backed ref handles the sheet portal mounting asynchronously.
  const findViewport = (): HTMLDivElement | null => scrollViewport;

  // Track scroll position to determine if user is near bottom
  useEffect(() => {
    if (!open || !scrollViewport) return;

    const viewport = scrollViewport;
    const handleScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setIsNearBottom(distanceFromBottom < 100);
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [open, scrollViewport]);

  // Auto-scroll to bottom when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (!isNearBottom) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [messages, isNearBottom]);

  // Scroll to bottom when streaming starts
  useEffect(() => {
    if (isStreaming) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      messagesEndRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      setIsNearBottom(true);
    }
  }, [isStreaming]);

  // Scroll to bottom function (for the button)
  const scrollToBottom = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    setIsNearBottom(true);
  };

  // Load earlier messages from the full set
  const loadEarlierMessages = () => {
    const allMessages = allMessagesRef.current;
    if (allMessages.length === 0) return;

    setIsLoadingMore(true);

    // Find the index of the first displayed message in the full set
    const firstDisplayedId = displayedMessages[0]?.id;
    const firstIdx = allMessages.findIndex((m) => m.id === firstDisplayedId);
    if (firstIdx <= 0) {
      setIsLoadingMore(false);
      return;
    }

    // Calculate how many more to show (next batch of PER_PAGE)
    const newStartIdx = Math.max(0, firstIdx - PER_PAGE);
    const newMessages = allMessages.slice(newStartIdx);

    // Remember scroll position relative to the first message
    const viewport = findViewport();
    const scrollHeightBefore = viewport?.scrollHeight ?? 0;
    const scrollTopBefore = viewport?.scrollTop ?? 0;

    setDisplayedMessages(newMessages);
    setMessages(newMessages);

    // After render, adjust scroll to keep the user's position stable
    requestAnimationFrame(() => {
      if (viewport) {
        const scrollHeightAfter = viewport.scrollHeight;
        const heightDiff = scrollHeightAfter - scrollHeightBefore;
        viewport.scrollTop = scrollTopBefore + heightDiff;
        const distanceFromBottom =
          viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
        setIsNearBottom(distanceFromBottom < 100);
      }
      setIsLoadingMore(false);
    });
  };

  const hasMoreMessages = displayedMessages.length < totalMessages;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        showCloseButton={false}
        className={`flex flex-col border-l border-border bg-background p-0 shadow-2xl ${isMobile ? "h-[70dvh] w-full border-t" : "h-full w-dvw! sm:w-[500px] sm:max-w-[90vw]"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-background">
              <SparklesIcon className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold">Admin Template Assistant</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                AI partner for this internal-tools scaffold
              </SheetDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close assistant"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Chat Transcript Area */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={setScrollViewport}
            data-testid="assistant-transcript"
            className="h-full overflow-x-hidden overflow-y-auto overscroll-contain p-4"
          >
            <div className="flex flex-col gap-4">
              {isHydratingHistory ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Loading conversation…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <SparklesIcon className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold">How can I help you today?</h3>
                  <p className="max-w-[280px] text-xs text-muted-foreground">
                    Ask me about the current workspace, permissions, enabled modules, or how to
                    adapt this scaffold for a new admin app.
                  </p>
                </div>
              ) : null}
              {/* Load earlier messages button */}
              {hasMoreMessages && !isHydratingHistory && (
                <div className="flex justify-center py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs text-muted-foreground gap-1.5"
                    disabled={isLoadingMore}
                    onClick={loadEarlierMessages}
                  >
                    {isLoadingMore ? (
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      <ChevronUpIcon className="size-3" />
                    )}
                    {isLoadingMore
                      ? "Loading…"
                      : `Load earlier (${totalMessages - displayedMessages.length} more)`}
                  </Button>
                </div>
              )}

              {messages.map((message) => {
                const isUser = message.role === "user";
                const textParts = message.parts.filter((part) => part.type === "text");
                const hasTextContent = textParts.some((part) => part.text.length > 0);
                const showTypingInBubble =
                  !isUser &&
                  status === "streaming" &&
                  message.id === lastMessage?.id &&
                  !hasTextContent;

                return (
                  <div
                    key={message.id}
                    className={`flex flex-col gap-1.5 max-w-[85%] ${
                      isUser ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {isUser ? "You" : "Assistant"}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed min-w-0 break-words ${
                        isUser
                          ? "bg-foreground text-background rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      }`}
                    >
                      {showTypingInBubble ? (
                        <TypingIndicator />
                      ) : (
                        textParts.map((part, pIdx) => (
                          <span key={`${message.id}-text-${pIdx}`}>{part.text}</span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
              {showStandaloneTypingIndicator && (
                <div className="flex flex-col gap-1.5 self-start items-start">
                  <span className="text-xs font-medium text-muted-foreground">Assistant</span>
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {/* Scroll to bottom button */}
          {!isNearBottom && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background shadow-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Scroll to bottom"
            >
              <ArrowDownIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Composer Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!inputValue.trim() || isChatBusy) return;
            void sendMessage({ text: inputValue });
            setInputValue("");
          }}
          className="border-t border-border bg-background p-4"
        >
          <div className="relative flex items-center">
            <Textarea
              value={inputValue}
              placeholder={isHydratingHistory ? "Loading conversation..." : "Type a message..."}
              onChange={(e) => setInputValue(e.target.value)}
              className="min-h-[44px] w-full resize-none rounded-3xl border border-border bg-muted/55 py-2.5 pr-12 pl-4 text-sm leading-normal focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:outline-none"
              disabled={isChatBusy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (inputValue.trim() && !isChatBusy) {
                    const form = e.currentTarget.form;
                    if (form) {
                      form.dispatchEvent(
                        new Event("submit", {
                          cancelable: true,
                          bubbles: true,
                        }),
                      );
                    }
                  }
                }
              }}
            />
            <Button
              type="submit"
              size="icon-sm"
              className="absolute right-2 rounded-full bg-foreground text-background"
              disabled={!inputValue.trim() || isChatBusy}
            >
              {isStreaming ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
