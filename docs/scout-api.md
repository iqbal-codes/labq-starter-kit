# Code Context: API Layer Analysis

## Files Retrieved

1. `apps/server/src/index.ts` (lines 1-96) — Hono server entry point: all routes, middleware, ORPC/OpenAPI handlers, AI endpoint
2. `packages/api/src/index.ts` (lines 1-19) — ORPC procedure definitions (`o`), public and protected procedures
3. `packages/api/src/context.ts` (lines 1-14) — Context factory: extracts session from `better-auth` using Hono request headers
4. `packages/api/src/routers/index.ts` (lines 1-13) — App router with `healthCheck` and `privateData` procedures
5. `packages/auth/src/index.ts` (lines 1-34) — `better-auth` instance creation with Drizzle/DrizzleAdapter, email+password auth
6. `apps/web/src/utils/orpc.ts` (lines 1-31) — ORPC client setup with `RPCLink`, TanStack Query utils
7. `apps/web/src/lib/auth-client.ts` (lines 1-5) — BetterAuth browser client
8. `packages/env/src/server.ts` (lines 1-14) — Server env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`
9. `packages/env/src/web.ts` (lines 1-10) — Web env vars: `NEXT_PUBLIC_SERVER_URL`
10. `apps/web/src/app/dashboard/page.tsx` (lines 1-22) — Server component: session check, redirect, dashboard render
11. `apps/web/src/app/dashboard/dashboard.tsx` (lines 1-10) — Client component: calls `orpc.privateData.queryOptions()`
12. `apps/web/src/app/page.tsx` (lines 1-38) — Home page: calls `orpc.healthCheck.queryOptions()`
13. `apps/web/src/app/ai/page.tsx` (lines 1-72) — AI chat page: calls `POST /ai` via `useChat`
14. `packages/db/src/index.ts` (lines 1-9) — Drizzle DB factory

## Key Code

### 1. Hono Server Structure (`apps/server/src/index.ts`)

```ts
// Hono app with CORS, logger, auth, ORPC RPC + OpenAPI, AI streaming
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Global middleware
app.use(logger());
app.use("/*", cors({ origin: env.CORS_ORIGIN, ... }));

// Auth routes — proxied to better-auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ORPC RPC handler — mounted under /rpc prefix
// ORPC OpenAPI handler — mounted under /api-reference prefix
app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });
  const rpcResult = await rpcHandler.handle(c.req.raw, { prefix: "/rpc", context });
  if (rpcResult.matched) return c.newResponse(rpcResult.response.body, rpcResult.response);
  const apiResult = await apiHandler.handle(c.req.raw, { prefix: "/api-reference", context });
  if (apiResult.matched) return c.newResponse(apiResult.response.body, apiResult.response);
  await next();
});

// AI streaming endpoint
app.post("/ai", async (c) => { ... });

// Health check
app.get("/", (c) => c.text("OK"));
```

Routes:
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST, GET | `/api/auth/*` | `better-auth` handler | N/A (handled by better-auth) |
| POST, GET | `/rpc/*` | ORPC `RPCHandler` | Per-procedure (public/protected) |
| GET | `/api-reference/*` | ORPC `OpenAPIHandler` | Per-procedure |
| POST | `/ai` | AI streaming (Gemini 2.5 Flash) | None |
| GET | `/` | Simple health "OK" | None |

### 2. ORPC Layer (`packages/api/`)

**Procedure factory** (`packages/api/src/index.ts`):

```ts
export const o = os.$context<Context>(); // base typed procedure
export const publicProcedure = o;
export const protectedProcedure = publicProcedure.use(requireAuth);
```

- `requireAuth` middleware throws `ORPCError("UNAUTHORIZED")` if `context.session?.user` is falsy.

**Context** (`packages/api/src/context.ts`):

```ts
export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({ headers: context.req.raw.headers });
	return { auth: null, session };
}
```

**Routers** (`packages/api/src/routers/index.ts`):

```ts
export const appRouter = {
	healthCheck: publicProcedure.handler(() => "OK"),
	privateData: protectedProcedure.handler(({ context }) => ({
		message: "This is private",
		user: context.session?.user,
	})),
};
```

Currently only 2 procedures. No sub-routers, no nested routers.

### 3. Web Client Integration (`apps/web/src/utils/orpc.ts`)

- Uses `RPCLink` pointing to `${env.NEXT_PUBLIC_SERVER_URL}/rpc`
- Creates a TanStack Query util (`createTanstackQueryUtils`) used via `useQuery(orpc.healthCheck.queryOptions())`
- Server-side rendering support: passes `next/headers` in `headers()` async
- Credentials: `"include"` for cookie-based auth

### 4. Auth Flow

- **Server**: `better-auth` instance with Drizzle adapter (PostgreSQL), email+password, cookie-based sessions
- **Web**: `createAuthClient` from `better-auth/react` + direct `authClient.signIn.email()` / `authClient.signUp.email()` calls from client components
- Dashboard page checks session in a **server component** via `authClient.getSession({ fetchOptions: { headers: await headers() } })`, then renders client component

### 5. AI Endpoint

- `POST /ai` — accepts `{ messages: [...] }`, uses `@ai-sdk/google` with Gemini 2.5 Flash + dev tools middleware
- Consumed from `apps/web/src/app/ai/page.tsx` via `useChat({ transport: new DefaultChatTransport({ api: `${NEXT_PUBLIC_SERVER_URL}/ai` }) })`

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Web (Next.js)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Auth Client  │  │ ORPC Client  │  │ useChat    │  │
│  │ (better-auth)│  │ (RPCLink)    │  │ (AI SDK)   │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                │          │
│         │  /api/auth/*    │  /rpc/*        │  /ai     │
│         └────────┬────────┴────┬───────────┘          │
└──────────────────┼─────────────┼──────────────────────┘
                   │             │
┌──────────────────┼─────────────┼──────────────────────┐
│           Server (Hono - port 3000)                    │
│  ┌───────────────┴──────┐  ┌──┴──────────────┐       │
│  │ better-auth handler   │  │ rpcHandler      │       │
│  │  (db via drizzle)     │  │ (ORPC)          │       │
│  └───────────────────────┘  └──┬──────────────┘       │
│                                │                      │
│                     ┌──────────┴──────────┐           │
│                     │   packages/api       │           │
│                     │  context.ts          │           │
│                     │  index.ts (procs)    │           │
│                     │  routers/index.ts    │           │
│                     └─────────────────────┘           │
│                                                        │
│  ┌──────────────────────────────────────────┐          │
│  │            packages/auth                  │          │
│  │   better-auth + Drizzle adapter (PG)     │          │
│  └──────────────────────────────────────────┘          │
│  ┌──────────────────────────────────────────┐          │
│  │            packages/db                    │          │
│  │   drizzle-orm + node-postgres            │          │
│  └──────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Auth**: Web → `authClient.signIn.email()` → `POST /api/auth/*` → better-auth → Drizzle/PostgreSQL → session cookie
2. **RPC**: Web → `orpc.privateData.queryOptions()` → `POST /rpc/privateData` (with cookie) → ORPC → `createContext` (validate session) → `protectedProcedure` → response
3. **AI**: Web → `useChat()` → `POST /ai` → Gemini 2.5 Flash → streaming response

## Start Here

The file to open first is **`apps/server/src/index.ts`** — it is the single entry point for all API routing, middleware (CORS, logger), ORPC handler registration, and the AI endpoint. Every request path is defined here.

Then read **`packages/api/src/index.ts`** and **`packages/api/src/context.ts`** to understand the procedure system and auth context injection.

## Key Observations & Risks

1. **No rate limiting** — no rate limit middleware exists anywhere. The `/*` wildcard catch-all on the ORPC/OpenAPI handler means all routes are equally exposed.
2. **No server actions or Next.js API routes** — the web app does not use Next.js `route.ts` handlers or `"use server"` actions. All API logic is centralized in the standalone Hono server.
3. **Cookie sharing** — server runs on port 3000, web on port 3001. CORS is configured but `sameSite: "none"` + `secure: true` cookies require HTTPS in production.
4. **AI endpoint is public** — `POST /ai` has no auth middleware and no rate limiting.
5. **ORPC router is minimal** — only 2 procedures (`healthCheck`, `privateData`). The architecture supports adding many more procedures in `packages/api/src/routers/`.
6. **OpenAPI reference** — the `OpenAPIHandler` at `/api-reference` generates OpenAPI docs automatically using `ZodToJsonSchemaConverter`. This is useful but currently has no access control.
7. **Error handling** — `onError` interceptors on both RPC and OpenAPI handlers only `console.error`. No structured error responses or error codes.
