import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { createContext } from "@admin-template/api/context";
import { appRouter } from "@admin-template/api/routers/index";
import { auth } from "@admin-template/auth";
import { env } from "@admin-template/env/server";
import { MODULE_KEYS } from "@admin-template/types";
import { AppError } from "@admin-template/api/core/errors";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  type UIMessage,
} from "ai";
import { toAISdkStream } from "@mastra/ai-sdk";
import { RequestContext } from "@mastra/core/request-context";
import { ensureMastraSchemaSeparation, mastra } from "./mastra";

type ChatRequestPart = {
  type: string;
  text?: string;
};

type ChatRequestMessage = {
  id?: string;
  role?: "user" | "assistant" | "system" | "data";
  content?: string;
  parts?: ChatRequestPart[];
};

type PersistedMessageRecord = {
  id: string;
  role: string;
  content: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeUiRole(
  role: string | undefined,
  fallback: UIMessage["role"] = "system",
): UIMessage["role"] {
  if (role === "user" || role === "assistant" || role === "system") {
    return role;
  }

  return fallback;
}

function resolveAssistantThreadId(orgId: string, requestedThreadId?: string) {
  return requestedThreadId || `org_${orgId}_assistant_default`;
}

function extractPromptFromMessage(message: ChatRequestMessage | undefined) {
  if (!message) {
    return "";
  }

  if (message.content) {
    return message.content;
  }

  if (!message.parts) {
    return "";
  }

  for (const part of message.parts) {
    if (part.type === "text" && typeof part.text === "string") {
      return part.text;
    }
  }

  return "";
}

function toOriginalMessages(messages: ChatRequestMessage[] = []): UIMessage[] {
  return messages.map((message) => ({
    id: message.id || `${Date.now()}-${Math.random()}`,
    role: normalizeUiRole(message.role),
    parts: message.parts
      ? message.parts.map((part) =>
          part.type === "text"
            ? { type: "text" as const, text: part.text || "" }
            : { type: "text" as const, text: "" },
        )
      : [{ type: "text" as const, text: message.content || "" }],
  }));
}

function extractStoredMessageText(rawContent: unknown) {
  if (typeof rawContent === "string") {
    try {
      return extractStoredMessageText(JSON.parse(rawContent));
    } catch {
      return rawContent;
    }
  }

  if (!isRecord(rawContent)) {
    return "";
  }

  if (typeof rawContent.content === "string") {
    return rawContent.content;
  }

  if (Array.isArray(rawContent.parts)) {
    const textParts: string[] = [];
    for (const part of rawContent.parts) {
      if (isRecord(part) && part.type === "text" && typeof part.text === "string") {
        textParts.push(part.text);
      }
    }

    if (textParts.length > 0) {
      return textParts.join("\n");
    }
  }

  return "";
}

async function toPersistedUiMessage(message: PersistedMessageRecord): Promise<UIMessage> {
  const fallbackMessage: UIMessage = {
    id: message.id,
    role: normalizeUiRole(message.role, "assistant"),
    parts: [{ type: "text", text: extractStoredMessageText(message.content) }],
  };

  const parsed =
    typeof message.content === "string"
      ? (() => {
          try {
            return JSON.parse(message.content);
          } catch {
            return null;
          }
        })()
      : message.content;

  if (!isRecord(parsed) || !Array.isArray(parsed.parts)) {
    return fallbackMessage;
  }

  const candidate = {
    id: message.id,
    role: normalizeUiRole(message.role, "assistant"),
    parts: parsed.parts,
    ...(parsed.metadata !== undefined ? { metadata: parsed.metadata } : {}),
  };
  const validated = await safeValidateUIMessages<UIMessage>({ messages: [candidate] });
  if (validated.success && validated.data[0]) {
    return validated.data[0];
  }

  return fallbackMessage;
}
const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

// Auth routes
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ── AI Chat Assistant routes ──────────────────────────────────
app.post("/api/ai/chat", async (c) => {
  try {
    const context = await createContext({ context: c });
    if (!context.session?.user) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }
    if (!context.activeOrganization) {
      throw new AppError("ORGANIZATION_REQUIRED", "Active organization is required");
    }

    const { messages, threadId } = (await c.req.json()) as {
      messages?: ChatRequestMessage[];
      threadId?: string;
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Messages array is required", {
        details: { field: "messages", reason: "must be a non-empty array" },
      });
    }

    const orgId = context.activeOrganization.id;
    const userId = context.session.user.id;
    const resolvedThreadId = resolveAssistantThreadId(orgId, threadId);

    // Create RequestContext for Mastra tools
    const requestContext = new RequestContext();
    requestContext.set("userId", userId);
    requestContext.set("orgId", orgId);
    requestContext.set("enabledModules", [...MODULE_KEYS]);
    requestContext.set("permissions", context.permissions);

    const agent = mastra.getAgentById("labq-assistant");
    const lastMessage = messages[messages.length - 1];
    const prompt = extractPromptFromMessage(lastMessage);

    // Stream agent response
    const stream = await agent.stream(prompt, {
      memory: {
        thread: resolvedThreadId,
        resource: userId,
      },
      requestContext,
    });

    const originalMessages = toOriginalMessages(messages);

    const uiMessageStream = createUIMessageStream({
      originalMessages,
      execute: async ({ writer }) => {
        for await (const part of toAISdkStream(stream, { from: "agent", version: "v6" })) {
          writer.write(part);
        }
      },
    });

    return createUIMessageStreamResponse({ stream: uiMessageStream });
  } catch (err: unknown) {
    // Re-throw AppError and known errors; wrap unknowns
    if (err instanceof AppError) throw err;
    throw new AppError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Chat request failed",
    );
  }
});

app.get("/api/ai/chat/history", async (c) => {
  try {
    const context = await createContext({ context: c });
    if (!context.session?.user) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }
    if (!context.activeOrganization) {
      throw new AppError("ORGANIZATION_REQUIRED", "Active organization is required");
    }

    const requestedThreadId = c.req.query("threadId") || undefined;
    const userId = context.session.user.id;
    const resolvedThreadId = resolveAssistantThreadId(
      context.activeOrganization.id,
      requestedThreadId,
    );
    const agent = mastra.getAgentById("labq-assistant");
    const memory = await agent.getMemory();
    if (!memory) {
      throw new AppError("INTERNAL_ERROR", "Assistant memory is not configured");
    }

    const thread = await memory.getThreadById({ threadId: resolvedThreadId });
    if (!thread) {
      return c.json({ threadId: resolvedThreadId, messages: [], total: 0 });
    }
    if (thread.resourceId !== userId) {
      throw new AppError("NOT_FOUND", "Thread not found");
    }

    // Pagination params: page is 0-indexed, perPage defaults to 20.
    // `all=true` returns the full transcript so the shell can page locally from the newest messages.
    const returnAll = c.req.query("all") === "true";
    const pageParam = Number.parseInt(c.req.query("page") ?? "0", 10);
    const perPageParam = Number.parseInt(c.req.query("perPage") ?? "20", 10);
    const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;
    const perPage =
      Number.isFinite(perPageParam) && perPageParam > 0 ? Math.min(perPageParam, 100) : 20;

    const result = await memory.recall({
      threadId: resolvedThreadId,
      resourceId: userId,
      perPage: false,
      orderBy: { field: "createdAt", direction: "ASC" },
    });

    const total = result.messages.length;
    const sliced = returnAll
      ? result.messages
      : result.messages.slice(page * perPage, page * perPage + perPage);
    const historyMessages = await Promise.all(
      sliced.map((message) => toPersistedUiMessage(message)),
    );

    return c.json({ threadId: resolvedThreadId, messages: historyMessages, total });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to load chat history",
    );
  }
});

app.post("/api/ai/chat/approve", async (c) => {
  try {
    const context = await createContext({ context: c });
    if (!context.session?.user) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }

    const { runId, toolCallId, messages } = (await c.req.json()) as {
      runId?: string;
      toolCallId?: string;
      messages?: ChatRequestMessage[];
    };
    if (!runId) {
      throw new AppError("VALIDATION_ERROR", "runId is required", {
        details: { field: "runId", reason: "required" },
      });
    }

    const agent = mastra.getAgentById("labq-assistant");
    const stream = await agent.approveToolCall({ runId, toolCallId });

    const originalMessages = toOriginalMessages(messages);

    const uiMessageStream = createUIMessageStream({
      originalMessages,
      execute: async ({ writer }) => {
        for await (const part of toAISdkStream(stream, { from: "agent", version: "v6" })) {
          writer.write(part);
        }
      },
    });

    return createUIMessageStreamResponse({ stream: uiMessageStream });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to approve tool call",
    );
  }
});

app.post("/api/ai/chat/decline", async (c) => {
  try {
    const context = await createContext({ context: c });
    if (!context.session?.user) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }

    const { runId, toolCallId, messages } = (await c.req.json()) as {
      runId?: string;
      toolCallId?: string;
      messages?: ChatRequestMessage[];
    };
    if (!runId) {
      throw new AppError("VALIDATION_ERROR", "runId is required", {
        details: { field: "runId", reason: "required" },
      });
    }

    const agent = mastra.getAgentById("labq-assistant");
    const stream = await agent.declineToolCall({ runId, toolCallId });

    const originalMessages = toOriginalMessages(messages);

    const uiMessageStream = createUIMessageStream({
      originalMessages,
      execute: async ({ writer }) => {
        for await (const part of toAISdkStream(stream, { from: "agent", version: "v6" })) {
          writer.write(part);
        }
      },
    });

    return createUIMessageStreamResponse({ stream: uiMessageStream });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to decline tool call",
    );
  }
});

// oRPC handlers
const apiHandler = new OpenAPIHandler(appRouter);

const rpcHandler = new RPCHandler(appRouter);

/** Log error details from oRPC response bodies for non-2xx statuses. */
async function logOrcpError(c: any, response: Response) {
  if (response.status < 400) return;
  try {
    const cloned = response.clone();
    const body = (await cloned.json()) as any;
    const method = c.req.method;
    const path = c.req.path;

    console.error(`[ERROR] ${method} ${path} ${response.status}`);

    // oRPC wraps errors in { json: { code, message, data } }
    const err = body?.json ?? body;

    if (err) {
      const code = err.code ?? "UNKNOWN";
      const message = err.message ?? "Unknown error";
      console.error(`  code: ${code}`);
      console.error(`  message: ${message}`);

      // oRPC validation errors have data.issues
      if (err.data?.issues?.length) {
        for (const issue of err.data.issues) {
          const field = issue.path?.join(".") ?? "(root)";
          console.error(`  → ${field}: ${issue.message}`);
        }
      } else if (err.data) {
        console.error(`  data: ${JSON.stringify(err.data)}`);
      }
    } else {
      console.error(`  (empty response body)`);
    }
  } catch {
    console.error(`  (could not read response body)`);
  }
}

app.use("/rpc/*", async (c, next) => {
  const context = await createContext({ context: c });
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    context,
    prefix: "/rpc",
  });

  if (matched) {
    await logOrcpError(c, response);
    return response;
  }

  await next();
});

app.use("/api/*", async (c, next) => {
  const context = await createContext({ context: c });
  const { matched, response } = await apiHandler.handle(c.req.raw, {
    context,
    prefix: "/api",
  });

  if (matched) {
    await logOrcpError(c, response);
    return response;
  }

  await next();
});

app.get("/", (c) => c.text("OK"));

app.onError((err, c) => {
  const method = c.req.method;
  const path = c.req.path;

  // AppError: known error codes with structured response
  if (err instanceof AppError) {
    console.error(`[ERROR] ${method} ${path} ${err.statusCode}`);
    console.error(`  code: ${err.code}`);
    console.error(`  message: ${err.message}`);
    if (err.details) {
      console.error(`  details: ${JSON.stringify(err.details)}`);
    }
    if (process.env.NODE_ENV !== "production") {
      console.error(`  stack: ${err.stack}`);
    }
    return c.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.statusCode as any,
    );
  }

  // HTTPException from Hono
  if (err instanceof Error && "status" in err && "getResponse" in err) {
    const status = (err as any).status ?? 500;
    console.error(`[ERROR] ${method} ${path} ${status}`);
    console.error(`  message: ${err.message}`);
    if (process.env.NODE_ENV !== "production") {
      console.error(`  stack: ${err.stack}`);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message } }, status);
  }

  // Unknown error: generic 500
  console.error(`[ERROR] ${method} ${path} 500`);
  console.error(`  message: ${err.message ?? "Unknown error"}`);
  if (process.env.NODE_ENV !== "production" && err.stack) {
    console.error(`  stack: ${err.stack}`);
  }
  return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } }, 500);
});

export default app;

await ensureMastraSchemaSeparation();

serve(
  {
    fetch: app.fetch,
    port: 4000,
  },
  (info) => {
    console.log(`API server running on http://localhost:${info.port}`);
  },
);
