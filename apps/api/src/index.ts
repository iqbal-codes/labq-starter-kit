import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@admin-template/db";
import { customers, services } from "@admin-template/db/schema/business";
import { createContext } from "@admin-template/api/context";
import {
  OPERATIONS_ATTACHMENT_ENTITY_TYPES,
  deleteStoredAttachment,
  getAttachmentBytes,
  listEntityAttachments,
  uploadEntityAttachment,
} from "@admin-template/api/core/operations-media";
import { requirePermission } from "@admin-template/api/core/permissions";
import { appRouter } from "@admin-template/api/routers/index";
import { writeAudit } from "@admin-template/api/core/audit";
import { auth } from "@admin-template/auth";
import { env } from "@admin-template/env/server";
import type { PermissionKey } from "@admin-template/types";
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
import { z } from "zod";
import { sendContactInquiryEmail, resend, FROM_EMAIL } from "@admin-template/email";

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

async function getActiveCustomer(orgId: string, customerId: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, orgId),
        eq(customers.id, customerId),
        isNull(customers.deletedAt),
      ),
    )
    .limit(1);

  if (!customer) {
    throw new AppError("NOT_FOUND", "Customer not found");
  }

  return customer;
}

async function getActiveService(orgId: string, serviceId: string) {
  const [service] = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.organizationId, orgId),
        eq(services.id, serviceId),
        isNull(services.deletedAt),
      ),
    )
    .limit(1);

  if (!service) {
    throw new AppError("NOT_FOUND", "Service not found");
  }

  return service;
}

type MultipartValue = string | File;

function isFileLike(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function" &&
    "name" in value &&
    typeof value.name === "string"
  );
}
function ensureFiles(value: MultipartValue | MultipartValue[] | undefined): File[] {
  if (!value) {
    throw new AppError("VALIDATION_ERROR", "At least one file is required");
  }
  const entries = Array.isArray(value) ? value : [value];
  const files = entries.filter((entry): entry is File => isFileLike(entry));

  if (files.length === 0) {
    throw new AppError("VALIDATION_ERROR", "At least one file is required");
  }

  return files;
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
    origin: (origin) => {
      if (!origin) return env.CORS_ORIGIN;

      const allowedOrigins = [env.CORS_ORIGIN, env.STOREFRONT_SITE_ORIGIN].filter(
        (value): value is string => Boolean(value),
      );

      return allowedOrigins.includes(origin) ? origin : env.CORS_ORIGIN;
    },
    credentials: true,
  }),
);

// Auth routes
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ── Public storefront contact inquiry ─────────────────────────
const contactInquirySchema = z.object({
  org: z.string().trim().min(1, "Organization is required").max(200),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("A valid email is required"),
  company: z.string().trim().max(200).optional(),
  service: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

app.post("/api/storefront/contact", async (c) => {
  try {
    const rawBody = await c.req.text();
    const body = rawBody.length === 0 ? null : JSON.parse(rawBody);
    const parsed = contactInquirySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return c.json({ success: false, error: firstError }, 400);
    }

    const { org, name, email, company, service, message } = parsed.data;
    const recipient = env.CONTACT_EMAIL ?? env.RESEND_FROM_EMAIL ?? null;

    if (!resend || !recipient || !FROM_EMAIL) {
      return c.json(
        {
          success: false,
          error: recipient
            ? "Contact form unavailable right now. Please email us directly."
            : "Contact form unavailable right now. Please try again later.",
          fallbackEmail: recipient,
        },
        503,
      );
    }

    await sendContactInquiryEmail({ org, name, email, company, service, message }, recipient);

    return c.json({
      success: true,
      message: "Inquiry received. We'll be in touch shortly.",
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return c.json({ success: false, error: "Invalid JSON body" }, 400);
    }

    console.error("Contact inquiry error:", err);
    return c.json(
      {
        success: false,
        error: "Failed to send inquiry",
        fallbackEmail: env.CONTACT_EMAIL ?? env.RESEND_FROM_EMAIL ?? null,
      },
      500,
    );
  }
});

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

app.post("/api/operations/customers/:customerId/avatar", async (c) => {
  try {
    const context = await createContext({ context: c });
    if (!context.session?.user) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }
    if (!context.activeOrganization) {
      throw new AppError("ORGANIZATION_REQUIRED", "Active organization is required");
    }

    requirePermission(context, "operations.update" as PermissionKey);

    const orgId = context.activeOrganization.id;
    const customerId = c.req.param("customerId");
    const userId = context.session.user.id;
    await getActiveCustomer(orgId, customerId);

    const parsed = (await c.req.parseBody({ all: true })) as Record<
      string,
      MultipartValue | MultipartValue[]
    >;
    const files = ensureFiles(parsed.avatar ?? parsed.file ?? parsed.files);
    const file = files[0];
    if (!file) {
      throw new AppError("VALIDATION_ERROR", "A single avatar file is required");
    }
    const existing = await listEntityAttachments(
      orgId,
      OPERATIONS_ATTACHMENT_ENTITY_TYPES.customerAvatar,
      customerId,
    );

    for (const attachment of existing) {
      await deleteStoredAttachment({
        organizationId: orgId,
        attachmentId: attachment.id,
        userId,
        entityType: OPERATIONS_ATTACHMENT_ENTITY_TYPES.customerAvatar,
        entityId: customerId,
      });
    }

    const attachment = await uploadEntityAttachment({
      organizationId: orgId,
      entityType: OPERATIONS_ATTACHMENT_ENTITY_TYPES.customerAvatar,
      entityId: customerId,
      userId,
      file,
    });

    await writeAudit({
      organizationId: orgId,
      userId,
      moduleKey: "operations",
      entityType: "customer",
      entityId: customerId,
      action: "uploadAvatar",
      metadata: { attachmentId: attachment.id, fileName: attachment.fileName },
    });

    return c.json({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      downloadUrl: `/api/operations/attachments/${attachment.id}`,
    });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to upload customer avatar",
    );
  }
});

app.post("/api/operations/services/:serviceId/photos", async (c) => {
  try {
    const context = await createContext({ context: c });
    if (!context.session?.user) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }
    if (!context.activeOrganization) {
      throw new AppError("ORGANIZATION_REQUIRED", "Active organization is required");
    }

    requirePermission(context, "operations.update" as PermissionKey);

    const orgId = context.activeOrganization.id;
    const serviceId = c.req.param("serviceId");
    const userId = context.session.user.id;
    await getActiveService(orgId, serviceId);

    const parsed = (await c.req.parseBody({ all: true })) as Record<
      string,
      MultipartValue | MultipartValue[]
    >;
    const files = ensureFiles(parsed.photos ?? parsed.file ?? parsed.files);

    const uploaded = [];
    for (const file of files) {
      const attachment = await uploadEntityAttachment({
        organizationId: orgId,
        entityType: OPERATIONS_ATTACHMENT_ENTITY_TYPES.servicePhoto,
        entityId: serviceId,
        userId,
        file,
      });
      uploaded.push(attachment);
    }

    await writeAudit({
      organizationId: orgId,
      userId,
      moduleKey: "operations",
      entityType: "service",
      entityId: serviceId,
      action: "uploadPhotos",
      metadata: {
        attachmentIds: uploaded.map((attachment) => attachment.id),
        count: uploaded.length,
      },
    });

    return c.json(
      uploaded.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        downloadUrl: `/api/operations/attachments/${attachment.id}`,
      })),
    );
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to upload service photos",
    );
  }
});

app.get("/api/operations/attachments/:attachmentId", async (c) => {
  try {
    const context = await createContext({ context: c });
    if (!context.session?.user) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }
    if (!context.activeOrganization) {
      throw new AppError("ORGANIZATION_REQUIRED", "Active organization is required");
    }

    requirePermission(context, "operations.view" as PermissionKey);

    const orgId = context.activeOrganization.id;
    const { attachment, bytes } = await getAttachmentBytes(orgId, c.req.param("attachmentId"));
    const isOperationsAttachment = Object.values(OPERATIONS_ATTACHMENT_ENTITY_TYPES).includes(
      attachment.entityType as (typeof OPERATIONS_ATTACHMENT_ENTITY_TYPES)[keyof typeof OPERATIONS_ATTACHMENT_ENTITY_TYPES],
    );

    if (!isOperationsAttachment) {
      throw new AppError("NOT_FOUND", "Attachment not found");
    }

    return c.body(bytes, 200, {
      "Content-Type": attachment.mimeType,
      "Content-Length": bytes.length.toString(),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
      "Cache-Control": "private, max-age=60",
    });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "INTERNAL_ERROR",
      err instanceof Error ? err.message : "Failed to download attachment",
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
