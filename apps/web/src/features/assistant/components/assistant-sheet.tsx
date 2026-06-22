import React, { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport, safeValidateUIMessages, type UIMessage } from "ai";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@labq-modules/ui/components/sheet";
import { Button } from "@labq-modules/ui/components/button";
import { Textarea } from "@labq-modules/ui/components/textarea";
import {
  SparklesIcon,
  XIcon,
  SendIcon,
  CheckIcon,
  BanIcon,
  Loader2Icon,
  CalendarIcon,
  ArrowDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useOrganization } from "../../../hooks/use-organization";

interface AssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ToolCallState {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "pending" | "approved" | "declined";
  isLoading?: boolean;
  error?: string | null;
}

interface DataPart {
  type: string;
  data: unknown;
}

interface AssistantHistoryResponse {
  threadId: string;
  messages: UIMessage[];
  total: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatToolArg(value: unknown, fallback = ""): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value == null) {
    return fallback;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
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
  const runIdRef = useRef<string | null>(null);
  const [activeApprovals, setActiveApprovals] = useState<Record<string, ToolCallState>>({});
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
    onData(dataPartUnknown) {
      const dataPart = dataPartUnknown as DataPart;
      if (dataPart && dataPart.type === "x-mastra-run-id" && typeof dataPart.data === "string") {
        runIdRef.current = dataPart.data;
      }
    },
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
  // Scan messages for tool calls needing approval
  useEffect(() => {
    setActiveApprovals((prev) => {
      const newApprovals = { ...prev };
      let updated = false;

      for (const message of messages) {
        if (message.role === "assistant" && message.parts) {
          for (const part of message.parts) {
            if (part.type === "tool-create-crm-activity") {
              const inv = part;
              const toolCallId = inv.toolCallId;
              if (!newApprovals[toolCallId]) {
                newApprovals[toolCallId] = {
                  toolCallId,
                  toolName: "create-crm-activity",
                  args: (inv.input as Record<string, unknown>) || {},
                  state: inv.state === "output-available" ? "approved" : "pending",
                  isLoading: false,
                  error: null,
                };
                updated = true;
              } else if (
                inv.state === "output-available" &&
                newApprovals[toolCallId].state === "pending"
              ) {
                newApprovals[toolCallId].state = "approved";
                newApprovals[toolCallId].isLoading = false;
                newApprovals[toolCallId].error = null;
                updated = true;
              }
            }
          }
        }
      }

      return updated ? newApprovals : prev;
    });
  }, [messages]);

  // Custom stream reader to resume assistant responses
  async function handleResume(toolCallId: string, action: "approve" | "decline") {
    const runId = runIdRef.current;
    if (!runId) return;

    setActiveApprovals((prev) => {
      const existing = prev[toolCallId];
      if (!existing) return prev;
      return {
        ...prev,
        [toolCallId]: {
          ...existing,
          isLoading: true,
          error: null,
        },
      };
    });

    try {
      const mappedMessages = messages.map((m) => {
        const textPart = m.parts.find((p) => p.type === "text");
        let textContent = "";
        if (textPart && "text" in textPart && typeof textPart.text === "string") {
          textContent = textPart.text;
        }
        return {
          id: m.id,
          role: m.role,
          content: textContent,
        };
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId,
          toolCallId,
          messages: mappedMessages,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${action} tool call`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      // Create a placeholder message or append to the existing last assistant message
      let assistantMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg && msg.role === "assistant") {
          assistantMessageIndex = i;
          break;
        }
      }

      let updatedMessages = [...messages];

      if (assistantMessageIndex === -1) {
        // If no assistant message, insert one
        updatedMessages.push({
          id: `resume-${Date.now()}`,
          role: "assistant",
          parts: [{ type: "text", text: "" }],
        });
      }

      const targetIndex =
        assistantMessageIndex === -1 ? updatedMessages.length - 1 : assistantMessageIndex;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          // AI SDK text parts are formatted as 0:"chunk text\n"
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const textValue = JSON.parse(line.substring(2)) as string;
                accumulatedText += textValue;

                // Update the specific message content dynamically
                updatedMessages = updatedMessages.map((m, idx) => {
                  if (idx === targetIndex) {
                    const currentTextPart = m.parts.find((p) => p.type === "text");
                    const currentText =
                      currentTextPart && "text" in currentTextPart ? currentTextPart.text : "";
                    return {
                      ...m,
                      parts: [
                        {
                          type: "text" as const,
                          text: currentText + textValue,
                        },
                        ...m.parts.filter((p) => p.type !== "text"),
                      ],
                    };
                  }
                  return m;
                });
                setMessages(updatedMessages);
              } catch {
                // Ignore parse errors for partial/malformed lines
              }
            }
          }
        }
      }

      // Mark the tool call as resolved only after the stream finishes successfully
      setActiveApprovals((prev) => {
        const existing = prev[toolCallId];
        if (!existing) return prev;
        return {
          ...prev,
          [toolCallId]: {
            ...existing,
            state: action === "approve" ? "approved" : "declined",
            isLoading: false,
            error: null,
          },
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setActiveApprovals((prev) => {
        const existing = prev[toolCallId];
        if (!existing) return prev;
        return {
          ...prev,
          [toolCallId]: {
            ...existing,
            isLoading: false,
            error: message,
          },
        };
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex h-full flex-col border-l border-border bg-background p-0 shadow-2xl w-dvw! sm:w-[500px] sm:max-w-[90vw]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-background">
              <SparklesIcon className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold">LabQ Assistant</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                AI Partner for CRM and Inventory
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
                    Ask me to search CRM contacts, summarize low stock products, or schedule a
                    note/task.
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

                    {/* Render tool invocations needing approval */}
                    {!isUser &&
                      message.parts?.map((part, pIdx) => {
                        if (part.type === "tool-create-crm-activity") {
                          const inv = part;
                          const toolCallId = inv.toolCallId;
                          const approval = activeApprovals[toolCallId];

                          if (approval) {
                            const args = approval.args;
                            const isLoading = approval.isLoading ?? false;
                            const error = approval.error;
                            return (
                              <div
                                key={`${toolCallId}-${pIdx}`}
                                className="mt-2.5 w-full rounded-2xl border border-border bg-card p-3.5"
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className="flex size-6 items-center justify-center rounded-full bg-muted">
                                    <CalendarIcon className="size-3 text-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-xs font-semibold">Schedule activity</h4>
                                    <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
                                      Title: {formatToolArg(args.title)}
                                      <br />
                                      Type: {formatToolArg(args.type, "note")}
                                      {args.details ? (
                                        <>
                                          <br />
                                          Details: {formatToolArg(args.details)}
                                        </>
                                      ) : null}
                                    </p>

                                    {/* Action controls based on approval state */}
                                    {approval.state === "pending" && !error && (
                                      <div className="mt-3 flex gap-2">
                                        <Button
                                          size="xs"
                                          className="rounded-full bg-foreground text-background"
                                          disabled={isLoading}
                                          onClick={() => handleResume(toolCallId, "approve")}
                                        >
                                          {isLoading ? (
                                            <Loader2Icon className="size-3 animate-spin mr-1" />
                                          ) : (
                                            <CheckIcon className="size-3 mr-1" />
                                          )}
                                          Approve
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          className="rounded-full border-border bg-background"
                                          disabled={isLoading}
                                          onClick={() => handleResume(toolCallId, "decline")}
                                        >
                                          <BanIcon className="size-3 mr-1" />
                                          Decline
                                        </Button>
                                      </div>
                                    )}

                                    {error && (
                                      <div
                                        className="mt-2.5 flex flex-col gap-1.5 text-[11px] text-destructive"
                                        role="alert"
                                      >
                                        <span>{error}</span>
                                        <div className="flex gap-2">
                                          <Button
                                            size="xs"
                                            variant="outline"
                                            className="rounded-full border-border bg-background text-foreground"
                                            onClick={() => handleResume(toolCallId, "approve")}
                                          >
                                            Retry
                                          </Button>
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            className="rounded-full text-muted-foreground"
                                            onClick={() => handleResume(toolCallId, "decline")}
                                          >
                                            Decline instead
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {approval.state === "approved" && !error && (
                                      <div
                                        className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"
                                        role="status"
                                        aria-live="polite"
                                      >
                                        <CheckIcon className="size-3.5 text-foreground" />
                                        <span>Activity scheduled successfully</span>
                                      </div>
                                    )}

                                    {approval.state === "declined" && !error && (
                                      <div
                                        className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"
                                        role="status"
                                        aria-live="polite"
                                      >
                                        <BanIcon className="size-3.5 text-muted-foreground" />
                                        <span>Action declined by user</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        }
                        return null;
                      })}
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
