# Code Context — apps/server

## Files Retrieved

### Server entry (Hono app)

1. `apps/server/src/index.ts` (lines 1-97) — Main Hono server: mounts CORS, auth handler, ORPC rpc/api handlers, AI endpoint, health check.
2. `apps/server/src/instrument.ts` (lines 1-19) — Sentry init (imported first for instrumentation).
3. `apps/server/src/sentry-utils.ts` (lines 1-62) — Sentry helpers: `captureError`, `captureMessage`, `withSentry`.
4. `apps/server/package.json` — Dependencies: Hono, better-auth, @orpc/server, @ai-sdk/google, Sentry.
5. `apps/server/tsdown.config.ts` — Bundles with `tsdown`, inlines `@admin-template/*` packages.

### API package (routers + context)

6. `packages/api/src/index.ts` (lines 1-18) — ORPC server setup: `publicProcedure` and `protectedProcedure` (session check middleware).
7. `packages/api/src/routers/index.ts` (lines 1-14) — Two procedures: `healthCheck` (public) and `privateData` (protected, returns user).
8. `packages/api/src/context.ts` (lines 1-14) — Context factory: calls `auth.api.getSession()` to load session from request headers.

### Auth package (better-auth)

9. `packages/auth/src/index.ts` (lines 1-50) — `createAuth()` configures better-auth with Drizzle adapter, email/password, social providers (GitHub, Google), email verification via Resend, organization plugin.
10. `packages/auth/package.json` — depends on better-auth 1.6.11, @admin-template/db, @admin-template/email, @admin-template/env.

### Database schema (Drizzle + PostgreSQL)

11. `packages/db/src/schema/auth.ts` (lines 1-200) — All auth tables: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `team`, `teamMember` + relations.
12. `packages/db/src/index.ts` (lines 1-7) — `createDb()` returns a Drizzle client connected to `DATABASE_URL`.
13. `packages/db/drizzle.config.ts` — Drizzle Kit config for PostgreSQL schema generation/migration.
14. `packages/db/package.json` — drizzle-orm, drizzle-kit, pg.

### Environment variables

15. `packages/env/src/server.ts` (lines 1-31) — Server-side env validation (DATABASE*URL, BETTER_AUTH*_, CORS*ORIGIN, social provider client IDs, RESEND*_).
16. `packages/env/src/web.ts` (lines 1-21) — Client-side env (NEXT_PUBLIC_SERVER_URL, PostHog, Sentry).
17. `apps/server/.env` — Local env with dev values.

### Email

18. `packages/email/src/index.ts` — `sendEmail()` and `sendVerificationEmail()` via Resend.
19. `packages/email/src/client.ts` — Resend client init.

### Root monorepo

20. `package.json` — Workspace catalog (better-auth 1.6.11, hono 4.8.2, zod 4.1.13, @orpc/server 1.13.14, etc.), scripts.
21. root `package.json` + `vite.config.ts` — Bun workspace scripts and Vite+ root workflow config.

---

## Key Code

### Auth routes (delegated to better-auth)

```ts
// apps/server/src/index.ts, line 23
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

Better-auth auto-exposes these endpoints under `/api/auth/`:

- `POST /api/auth/sign-in` — email/password login
- `POST /api/auth/sign-up` — email/password register
- `POST /api/auth/sign-out` — logout
- `GET /api/auth/session` — get current session
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`
- `POST /api/auth/send-verification-email`
- Plus social OAuth routes (GitHub, Google) and organization routes

### ORPC API endpoints

```ts
// packages/api/src/routers/index.ts
export const appRouter = {
	healthCheck: publicProcedure.handler(() => "OK"), // any user
	privateData: protectedProcedure.handler(({ context }) => {
		// requires auth
		return { message: "This is private", user: context.session?.user };
	}),
};
```

Served at:

- `/rpc/*` — RPC handler (JSON-RPC style)
- `/api-reference/*` — OpenAPI reference docs (auto-generated)

### AI endpoint

```ts
// apps/server/src/index.ts, lines 58-70
app.post("/ai", async (c) => { ... });  // Gemini 2.5 Flash streaming
```

### Auth config (better-auth)

```ts
// packages/auth/src/index.ts
betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  emailVerification: { sendVerificationEmail: ... },
  socialProviders: { github: {...}, google: {...} },
  plugins: [nextCookies(), organization({ teams: { enabled: true } })],
  trustedOrigins: [env.CORS_ORIGIN],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  advanced: { defaultCookieAttributes: { sameSite: "none", secure: true, httpOnly: true } },
});
```

### Database schema (tables and relations)

**Core auth tables** (better-auth convention):
| Table | Key fields |
|---|---|
| `user` | id, name, email (unique), emailVerified, image, createdAt, updatedAt |
| `session` | id, token (unique), expiresAt, userId → user, ipAddress, userAgent, activeOrganizationId, activeTeamId |
| `account` | id, accountId, providerId, userId → user, accessToken, refreshToken, password, scope |
| `verification` | id, identifier, value, expiresAt |

**Organization plugin tables:**
| Table | Key fields |
|---|---|
| `organization` | id, name, slug (unique), logo, metadata |
| `member` | id, organizationId → org, userId → user, role |
| `invitation` | id, organizationId → org, email, role, status, expiresAt, inviterId → user |
| `team` | id, name, organizationId → org |
| `teamMember` | id, teamId → team, userId → user, role |

All tables have drizzle relations defined (e.g., `userRelations`, `sessionRelations`, `organizationRelations`).

### Context (session loading)

```ts
// packages/api/src/context.ts
export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({ headers: context.req.raw.headers });
	return { auth: null, session };
}
```

- Every ORPC request calls `auth.api.getSession()` to hydrate `context.session`.
- `protectedProcedure` (in `packages/api/src/index.ts`) throws `ORPCError("UNAUTHORIZED")` if no user.

### Environment variables (server-side)

| Variable                                    | Type                    | Required        |
| ------------------------------------------- | ----------------------- | --------------- |
| `DATABASE_URL`                              | `z.string().min(1)`     | Yes             |
| `BETTER_AUTH_SECRET`                        | `z.string().min(32)`    | Yes             |
| `BETTER_AUTH_URL`                           | `z.url()`               | Yes             |
| `CORS_ORIGIN`                               | `z.url()`               | Yes             |
| `NODE_ENV`                                  | enum: dev/prod/test     | Defaults to dev |
| `SENTRY_DSN`                                | `z.string().optional()` | No              |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | optional                | No              |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional                | No              |
| `RESEND_API_KEY`                            | `z.string().min(1)`     | Yes             |
| `RESEND_FROM_EMAIL`                         | `z.string().email()`    | Yes             |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    apps/server (Hono)                       │
│                                                             │
│  POST/GET /api/auth/*  ───>  better-auth handler            │
│                                                             │
│  POST /rpc/*            ───>  ORPC RPC handler              │
│  GET  /api-reference/*  ───>  ORPC OpenAPI handler          │
│                                                             │
│  POST /ai               ───>  Gemini 2.5 Flash streaming    │
│                                                             │
│  GET  /                 ───>  health check "OK"             │
└────────────┬────────────────────────────────────────────────┘
             │ calls createContext()
             ▼
┌─────────────────────────────────────────────────────────────┐
│               packages/api (ORPC router)                    │
│  publicProcedure     → healthCheck (unauthenticated)        │
│  protectedProcedure  → privateData (requires session)       │
│                                                             │
│  createContext() → auth.api.getSession()                    │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│               packages/auth (better-auth)                   │
│  - email/password auth                                      │
│  - GitHub / Google OAuth                                    │
│  - email verification (via packages/email/Resend)           │
│  - organizations & teams plugin                             │
│  - Drizzle adapter → PostgreSQL                             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│               packages/db (Drizzle ORM)                     │
│  - Schema: user, session, account, verification             │
│  - Organization plugin: organization, member, invitation,   │
│    team, teamMember                                         │
│  - All relations defined (1:many, many:1)                   │
└─────────────────────────────────────────────────────────────┘
```

**Data flow for API requests:**

1. Request arrives → Hono middleware (CORS, logger)
2. If path starts with `/api/auth/` → delegated to better-auth handler
3. Otherwise → `createContext()` loads session from request headers via `auth.api.getSession()`
4. ORPC `rpcHandler` or `apiHandler` matches the procedure and runs it
5. `protectedProcedure` checks `context.session?.user`, throws 401 if missing

---

## Start Here

Open **`apps/server/src/index.ts`** — it's the single entry point that shows:

- How all routes and handlers are wired
- Where auth is delegated (line 23)
- Where ORPC handlers are mounted (lines 42-56)
- The AI streaming endpoint (lines 58-70)

Then follow into **`packages/auth/src/index.ts`** for the better-auth configuration, and **`packages/api/src/`** for the ORPC procedure definitions and context.

---

## Change Points & Risks

| Concern                               | Details                                                                                                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth routes are implicit              | All `/api/auth/*` routes come from better-auth's internals — there's no explicit route list in the codebase. To find available endpoints, refer to [better-auth docs](https://www.better-auth.com/docs/api-reference). |
| Session hydrated per-request          | Every ORPC request calls `auth.api.getSession()`. This is a DB lookup every time — fine for low traffic, but consider caching for higher loads.                                                                        |
| No migrations yet                     | `packages/db/src/migrations/` doesn't exist (only schema). The project uses `db:push` or `db:generate` + `db:migrate` to manage schema.                                                                                |
| CORS allows credentials               | `sameSite: "none"`, `secure: true` on auth cookies — requires HTTPS in production.                                                                                                                                     |
| AI endpoint is unprotected            | `POST /ai` has no auth check — anyone can call it and consume Gemini credits.                                                                                                                                          |
| Email verification is fire-and-forget | `sendVerificationEmail` is not awaited (prevents timing attacks), but errors are only logged.                                                                                                                          |
