import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { createContext } from "@labq-modules/api/context";
import { appRouter } from "@labq-modules/api/routers/index";
import { auth } from "@labq-modules/auth";
import { env } from "@labq-modules/env/server";
import { getS3Client, S3_BUCKET } from "@labq-modules/api/core/s3";
import {
  assertActiveContact,
  getActiveContactAttachment,
  insertContactAttachmentRecord,
  buildAttachmentStorageKey,
} from "@labq-modules/api/core/attachments";
import { writeAudit } from "@labq-modules/api/core/audit";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

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
    console.log("[AI Chat] Request context user ID:", context.session?.user?.id);
    console.log("[AI Chat] Request context org ID:", context.activeOrganization?.id);
    if (!context.session?.user) {
      console.log("[AI Chat] Unauthorized - session user missing");
      return c.json({ error: "Unauthorized" }, 401);
    }
    if (!context.activeOrganization) {
      console.log("[AI Chat] Organization required");
      return c.json({ error: "Organization required" }, 400);
    }

    const { messages, threadId } = (await c.req.json()) as {
      messages?: ChatRequestMessage[];
      threadId?: string;
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: "Messages array is required" }, 400);
    }

    const orgId = context.activeOrganization.id;
    const userId = context.session.user.id;
    const resolvedThreadId = resolveAssistantThreadId(orgId, threadId);


    // Create RequestContext for Mastra tools
    const requestContext = new RequestContext();
    requestContext.set("userId", userId);
    requestContext.set("orgId", orgId);
    requestContext.set("enabledModules", ["crm"]);
    requestContext.set("permissions", context.permissions);

    const agent = mastra.getAgentById("labq-assistant");
    const lastMessage = messages[messages.length - 1];
    const prompt = extractPromptFromMessage(lastMessage);
    console.log("[AI Chat] Incoming messages:", JSON.stringify(messages, null, 2));
    console.log("[AI Chat] Resolved prompt:", prompt);

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
    console.error("[AI Chat] Uncaught error in route:", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.get("/api/ai/chat/history", async (c) => {
  try {
    const context = await createContext({ context: c });
    if (!context.session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    if (!context.activeOrganization) {
      return c.json({ error: "Organization required" }, 400);
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
      throw new Error("Assistant memory is not configured");
    }

    const thread = await memory.getThreadById({ threadId: resolvedThreadId });
    if (!thread) {
      return c.json({ threadId: resolvedThreadId, messages: [], total: 0 });
    }
    if (thread.resourceId !== userId) {
      return c.json({ error: "Thread not found" }, 404);
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
    console.error("[AI Chat History] Uncaught error in route:", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

app.post("/api/ai/chat/approve", async (c) => {
  const context = await createContext({ context: c });
  if (!context.session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { runId, toolCallId, messages } = (await c.req.json()) as {
    runId?: string;
    toolCallId?: string;
    messages?: ChatRequestMessage[];
  };
  if (!runId) {
    return c.json({ error: "runId is required" }, 400);
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
});

app.post("/api/ai/chat/decline", async (c) => {
  const context = await createContext({ context: c });
  if (!context.session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { runId, toolCallId, messages } = (await c.req.json()) as {
    runId?: string;
    toolCallId?: string;
    messages?: ChatRequestMessage[];
  };
  if (!runId) {
    return c.json({ error: "runId is required" }, 400);
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
});

// ── Contact attachment routes (binary transport) ──────────────

app.post("/api/crm/contacts/:contactId/attachments", async (c) => {
  const context = await createContext({ context: c });
  if (!context.session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!context.activeOrganization) {
    return c.json({ error: "Organization required" }, 403);
  }

  const permissions = context.permissions ?? [];
  if (!permissions.includes("crm.create")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const orgId = context.activeOrganization.id;
  const userId = context.session.user.id;
  const contactId = c.req.param("contactId");

  try {
    await assertActiveContact(orgId, contactId);
  } catch {
    return c.json({ error: "Contact not found" }, 404);
  }

  const formData = await c.req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'Expected multipart field "file"' }, 400);
  }

  if (file.size > env.S3_MAX_UPLOAD_BYTES) {
    return c.json(
      { error: `File exceeds ${Math.round(env.S3_MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit` },
      413,
    );
  }

  const allowedTypes = env.S3_ALLOWED_MIME_TYPES.split(",").map((t) => t.trim());
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "File type not allowed" }, 400);
  }

  const storageKey = buildAttachmentStorageKey(orgId, "crm_contact", contactId, file.name);
  const body = Buffer.from(await file.arrayBuffer());

  try {
    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: storageKey,
        Body: body,
        ContentType: file.type,
      }),
    );
  } catch (err) {
    console.error("S3 upload failed:", err);
    return c.json({ error: "File upload failed" }, 500);
  }

  try {
    const row = await insertContactAttachmentRecord({
      organizationId: orgId,
      contactId,
      storageKey,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      userId,
    });

    await writeAudit({
      organizationId: orgId,
      userId,
      moduleKey: "crm",
      entityType: "contact",
      entityId: contactId,
      action: "attachment.upload",
      metadata: { attachmentId: row.id, fileName: file.name, sizeBytes: file.size, storageKey },
    });

    return c.json(
      {
        id: row.id,
        entityId: row.entityId,
        entityType: row.entityType,
        fileName: row.fileName,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        uploadedByName: context.session.user.name,
        createdAt: row.createdAt.toISOString(),
      },
      201,
    );
  } catch (metadataErr) {
    console.error("Metadata insert failed after upload:", metadataErr);
    try {
      const s3 = getS3Client();
      await s3.send(
        new PutObjectCommand({ Bucket: S3_BUCKET, Key: storageKey, Body: Buffer.alloc(0) }),
      );
    } catch {
      // Best-effort cleanup
    }
    return c.json({ error: "Attachment upload failed" }, 500);
  }
});

app.get("/api/crm/attachments/:attachmentId/download", async (c) => {
  const context = await createContext({ context: c });
  if (!context.session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!context.activeOrganization) {
    return c.json({ error: "Organization required" }, 403);
  }

  const permissions = context.permissions ?? [];
  if (!permissions.includes("crm.view")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const orgId = context.activeOrganization.id;
  const attachmentId = c.req.param("attachmentId");

  let attachment;
  try {
    attachment = await getActiveContactAttachment(orgId, attachmentId);
  } catch {
    return c.json({ error: "Attachment not found" }, 404);
  }

  try {
    const s3 = getS3Client();
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: attachment.storageKey,
      }),
    );

    if (!response.Body) {
      return c.json({ error: "Attachment file not found" }, 404);
    }

    const webStream = response.Body.transformToWebStream();
    const contentDisposition = `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`;

    return new Response(webStream, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": attachment.sizeBytes.toString(),
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "NoSuchKey") {
      return c.json({ error: "Attachment file not found" }, 404);
    }
    throw err;
  }
});

// oRPC handlers
const apiHandler = new OpenAPIHandler(appRouter);

const rpcHandler = new RPCHandler(appRouter);

app.use("/rpc/*", async (c, next) => {
  const context = await createContext({ context: c });
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    context,
    prefix: "/rpc",
  });

  if (matched) {
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
    return response;
  }

  await next();
});

app.get("/", (c) => c.text("OK"));

app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
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
