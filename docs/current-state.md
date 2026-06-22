# Current Project State — SaaS Starter Kit

> Generated: 2026-05-28

---

## 1. Authentication System

**Library:** [Better Auth](https://better-auth.com) v1.6.11 (workspace catalog)

### Server Config — `packages/auth/src/index.ts`

```typescript
// Core setup
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

// Database: Drizzle ORM (PostgreSQL adapter)
database: drizzleAdapter(db, { provider: "pg", schema: schema })

// Features enabled:
- Email/Password auth (enabled: true)
- Email verification (via Resend, sendVerificationEmail handler)
- OAuth: GitHub + Google (optional, empty string fallbacks)
- Organization/Teams plugin (organization({ teams: { enabled: true } }))
- Next.js cookies (nextCookies() plugin)
- Cookie attributes: sameSite: "none", secure: true, httpOnly: true
```

### Client Config — `apps/web/src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL, // http://localhost:3000
	plugins: [organizationClient()],
});

// Exported hooks: useSession, signIn, signOut, signUp, useActiveOrganization, useListOrganizations
```

### Auth Endpoints

- Server (Hono) mounts Better Auth handler at `POST/GET /api/auth/*` via `auth.handler(c.req.raw)`
- Routes handled: `/api/auth/*` (sign-in, sign-up, session, etc.)

### Required Environment Variables

| Variable                  | Status                         |
| ------------------------- | ------------------------------ |
| `BETTER_AUTH_SECRET`      | ✅ Set (dev value)             |
| `BETTER_AUTH_URL`         | ✅ Set (http://localhost:3000) |
| `CORS_ORIGIN`             | ✅ Set (http://localhost:3001) |
| `GITHUB_CLIENT_ID/SECRET` | ⚠️ Optional (empty defaults)   |
| `GOOGLE_CLIENT_ID/SECRET` | ⚠️ Optional (empty defaults)   |
| `RESEND_API_KEY`          | ✅ Set                         |
| `RESEND_FROM_EMAIL`       | ✅ Set                         |

### Auth Flow Summary

1. User hits `/login` → SignUpForm or SignInForm component
2. Form submits to `authClient.signIn.email()` or `authClient.signUp.email()`
3. POST goes to `http://localhost:3000/api/auth/*` (the Hono server)
4. `auth.handler()` processes it via Better Auth
5. On success → redirect to `/dashboard` (middleware also handles auth redirects)
6. Middleware validates session on every request via `auth.api.getSession()`

---

## 2. Database / ORM

**ORM:** Drizzle ORM (node-postgres driver)
**Database:** PostgreSQL (shared local Docker container `postgres-local` — `postgresql://postgres:postgres@localhost:5432/admin_app_template_dev`)

### Connection — `packages/db/src/index.ts`

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
export function createDb() {
	return drizzle(env.DATABASE_URL, { schema });
}
```

### Schema — `packages/db/src/schema/auth.ts`

**Core Auth Tables:**
| Table | Key Columns |
|---|---|
| `user` | id, name, email (unique), emailVerified, image, createdAt, updatedAt |
| `session` | id, expiresAt, token, userId (FK→user), activeOrganizationId, activeTeamId |
| `account` | id, accountId, providerId, userId (FK→user), password, OAuth tokens |
| `verification` | id, identifier, value, expiresAt |

**Organization Plugin Tables:**
| Table | Key Columns |
|---|---|
| `organization` | id, name, slug (unique), logo, createdAt, metadata |
| `member` | id, organizationId (FK→org), userId (FK→user), role (default 'member') |
| `invitation` | id, organizationId, email, role, status (default 'pending'), expiresAt, inviterId |
| `team` | id, name, organizationId (FK→org) |
| `team_member` | id, teamId (FK→team), userId (FK→user), role (default 'member') |

**Relations:** 7 relation exports (userRelations, sessionRelations, accountRelations, organizationRelations, memberRelations, invitationRelations, teamRelations, teamMemberRelations)

### Drizzle Config — `packages/db/drizzle.config.ts`

- Schema: `./src/schema`
- Output: `./src/migrations`
- Dialect: PostgreSQL
- Commands: `db:push`, `db:studio`, `db:generate`, `db:migrate` via workspace scripts driven by Vite+

### Seed/Init

- Docker Compose at root for PostgreSQL
- Script: `./scripts/db-setup.sh start && bun run db:migrate`

---

## 3. App Structure & Routes

### Monorepo Layout (Bun workspaces + Vite+)

```
karir-fit/
├── apps/
│   ├── web/          # Next.js 16 — frontend app (port 3001)
│   └── server/       # Hono + Bun — backend API server (port 3000)
├── packages/
│   ├── api/          # tRPC-like API via @orpc/server — procedures & context
│   ├── auth/         # Better Auth server config
│   ├── config/       # Shared TypeScript config
│   ├── db/           # Drizzle schema & connection
│   ├── email/        # Resend email client
│   ├── env/          # Zod-validated env vars (server.ts, web.ts)
│   └── ui/           # Shared shadcn/ui components
```

### Web App Routes (`apps/web/src/app/`)

| Route        | File                   | Type             | Status                                            |
| ------------ | ---------------------- | ---------------- | ------------------------------------------------- |
| `/`          | `page.tsx`             | Client component | ✅ Home page with API health check                |
| `/login`     | `login/page.tsx`       | Client component | ✅ Sign In / Sign Up toggle                       |
| `/dashboard` | `dashboard/page.tsx`   | Server component | ✅ Protected, redirects to `/login` if no session |
| `/dashboard` | `dashboard/layout.tsx` | Server component | ✅ Sidebar shell layout                           |

### Dashboard Layout Structure

```
dashboard/layout.tsx (server)
├── SidebarProvider
│   ├── AppSidebar (client) — nav from config + RBAC filtering
│   └── SidebarInset
│       ├── Header (client) — sidebar toggle, breadcrumbs, search
│       └── {children} (page content)
```

**Dashboard Nav Config** (`src/config/nav-config.ts`):

- 3 groups: Overview, Elements, Account
- 16+ routes configured (see nav-config.ts for full list)
- RBAC via `access.requireOrg`, `access.role` on nav items

### Server App Routes (`apps/server/src/index.ts`)

| Route                  | Handler          | Description           |
| ---------------------- | ---------------- | --------------------- |
| `POST/GET /api/auth/*` | `auth.handler()` | Better Auth endpoints |
| `POST /rpc/*`          | `rpcHandler`     | @orpc RPC procedures  |
| `GET /api-reference/*` | `apiHandler`     | OpenAPI reference     |
| `POST /ai`             | Custom handler   | Gemini AI streaming   |
| `GET /`                | Returns "OK"     | Health check          |
| `/sentry-tunnel`       | Sentry tunnel    | Route for Sentry      |

### API Procedures (`packages/api/src/routers/index.ts`)

```typescript
export const appRouter = {
	healthCheck: publicProcedure.handler(() => "OK"),
	privateData: protectedProcedure.handler(({ context }) => ({
		message: "This is private",
		user: context.session?.user,
	})),
};
```

### Middleware Stack

1. **Hono middleware:** `logger()`, `cors()`, then `rpcHandler`, then `apiHandler`, then fallthrough
2. **Next.js middleware** (`apps/web/src/middleware.ts`): delegates to `proxy.ts`
3. **Proxy middleware** (`apps/web/src/proxy.ts`):
   - Validates session on every request
   - Protects `/dashboard/*` — redirects to `/login?callbackUrl=...`
   - Redirects authenticated users away from `/auth/*` and `/login` → `/dashboard/overview`
   - i18n routing for all other routes (en/id with `as-needed` prefix)

### i18n Setup

- Library: next-intl v4.12.0
- Locales: `en`, `id` (Indonesian)
- Routing: `localePrefix: "as-needed"` — clean URLs
- Messages: `src/messages/en.json` and `id.json` (10 namespaces each, ~150 keys)
- Navigation: typed helpers via `createNavigation(routing)`
- Config: `next.config.ts` wraps with `createNextIntlPlugin("./src/i18n/request.ts")`

---

## 4. Middleware

### `apps/web/src/middleware.ts`

Simple re-export:

```typescript
export { default, config } from "./proxy";
```

### `apps/web/src/proxy.ts` — Combined Auth + i18n Middleware

```typescript
// Key behaviors:
// 1. Session validation via auth.api.getSession() on every request
// 2. Auth pages (/auth, /login) → redirect authenticated users to /dashboard/overview
// 3. Dashboard routes → require session, redirect to /login?callbackUrl
// 4. Non-i18n routes (/, /auth, /login, /about, /terms-of-service, /privacy-policy) → pass through
// 5. All other routes → i18n routing via next-intl createMiddleware

export const config = {
	matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
```

---

## 5. Navigation Types

### Primary Types — `apps/web/src/types/index.ts`

```typescript
interface PermissionCheck {
	permission?: string;
	plan?: string;
	feature?: string;
	role?: string;
	requireOrg?: boolean;
}

interface NavItem {
	title: string;
	url: string;
	disabled?: boolean;
	external?: boolean;
	shortcut?: [string, string];
	icon?: string;
	label?: string;
	description?: string;
	isActive?: boolean;
	items?: NavItem[];
	access?: PermissionCheck;
}

interface NavGroup {
	label: string;
	items: NavItem[];
}
```

### Legacy Types — `apps/web/src/types/nav.ts`

```typescript
interface NavItem {
	title: string;
	href: string;
	icon: string;
	badge?: string;
	items?: NavItem[];
}

interface NavGroup {
	title: string;
	items: NavItem[];
}
```

### RBAC Hooks — `apps/web/src/hooks/use-nav.ts`

- `useFilteredNavItems(items, activeOrgRole?)` — filters NavItem[] by access rules
- `useFilteredNavGroups(groups, activeOrgRole?)` — filters NavGroup[]
- Uses `useSession()` and `useActiveOrganization()` from auth client

---

## 6. Better Auth Best Practices (from Skill File)

The skill at `.agents/skills/better-auth-best-practices/SKILL.md` covers:

| Area               | Coverage                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| Setup workflow     | Install → env vars → auth.ts → route handler → migrate → verify                         |
| Config options     | database, trustedOrigins, emailAndPassword, plugins, socialProviders                    |
| Session management | secondaryStorage (Redis/KV), cookieCache strategies (compact/jwt/jwe), expiry/updateAge |
| User & Account     | modelName, fields, accountLinking, additionalFields, changeEmail, deleteUser            |
| Security           | advanced.useSecureCookies, CSRF, origin checks, rate limiting, IP headers               |
| Hooks              | endpoint hooks (before/after), database hooks, hook context                             |
| Plugins            | twoFactor, organization, passkey, magicLink, emailOtp, username, admin, apiKey, etc.    |
| Client             | better-auth/react, signUp/signIn/signOut, useSession                                    |
| Type safety        | `typeof auth.$Infer.Session`                                                            |
| Gotchas            | modelName vs tableName, re-run CLI after plugins, stateless mode, cookie cache limits   |

---

## 7. Infrastructure Summary

| Component          | Technology                                | Status                        |
| ------------------ | ----------------------------------------- | ----------------------------- |
| Frontend framework | Next.js 16                                | ✅ Installed & configured     |
| Backend framework  | Hono on Bun                               | ✅ Running at :3000           |
| API layer          | @orpc/server + @orpc/openapi              | ✅ Procedures defined         |
| Database           | PostgreSQL (Docker) + Drizzle ORM         | ✅ Schema defined             |
| Auth               | Better Auth 1.6.11                        | ✅ Server + client configured |
| i18n               | next-intl 4.12                            | ✅ en + id locales            |
| UI library         | shadcn/ui (via @admin-template/ui)             | ✅ Components in use          |
| Email              | Resend                                    | ✅ Integration in auth        |
| Analytics          | PostHog                                   | ✅ Provider component         |
| Error tracking     | Sentry                                    | ✅ Server + web configured    |
| State management   | TanStack React Query v5                   | ✅ Configured                 |
| AI SDK             | @ai-sdk/google (Gemini), @ai-sdk/devtools | ✅ Streaming endpoint         |
| Forms              | TanStack React Form                       | ✅ Auth forms built           |
| Styling            | Tailwind CSS v4                           | ✅ Configured                 |

---

## 8. Key Files Reference

| Purpose            | Path                                                | Status                                  |
| ------------------ | --------------------------------------------------- | --------------------------------------- |
| Auth server config | `packages/auth/src/index.ts`                        | ✅ Complete                             |
| Auth client config | `apps/web/src/lib/auth-client.ts`                   | ✅ Complete                             |
| Database schema    | `packages/db/src/schema/auth.ts`                    | ✅ Complete (with org/team tables)      |
| DB connection      | `packages/db/src/index.ts`                          | ✅ Complete                             |
| API procedures     | `packages/api/src/routers/index.ts`                 | ✅ Basic (health + privateData)         |
| API context        | `packages/api/src/context.ts`                       | ✅ Auth context included                |
| API base           | `packages/api/src/index.ts`                         | ✅ publicProcedure + protectedProcedure |
| Server (Hono)      | `apps/server/src/index.ts`                          | ✅ Complete                             |
| Next.js middleware | `apps/web/src/proxy.ts`                             | ✅ Auth + i18n                          |
| Dashboard layout   | `apps/web/src/app/dashboard/layout.tsx`             | ✅ Sidebar shell                        |
| Dashboard page     | `apps/web/src/app/dashboard/page.tsx`               | ✅ Protected route                      |
| Login page         | `apps/web/src/app/login/page.tsx`                   | ✅ Sign in/up toggle                    |
| Home page          | `apps/web/src/app/page.tsx`                         | ✅ Health check UI                      |
| Nav config         | `apps/web/src/config/nav-config.ts`                 | ✅ 16+ routes defined                   |
| Nav types          | `apps/web/src/types/index.ts`                       | ✅ With RBAC support                    |
| Nav types (legacy) | `apps/web/src/types/nav.ts`                         | ⚠️ Duplicate (older version)            |
| RBAC hooks         | `apps/web/src/hooks/use-nav.ts`                     | ✅ Filtering by org/role                |
| App sidebar        | `apps/web/src/components/layout/app-sidebar.tsx`    | ✅ Working sidebar                      |
| Dashboard header   | `apps/web/src/components/layout/header.tsx`         | ✅ Sticky header                        |
| Page container     | `apps/web/src/components/layout/page-container.tsx` | ✅ With loading/access states           |
| i18n routing       | `apps/web/src/i18n/routing.ts`                      | ✅ en/id configured                     |
| i18n navigation    | `apps/web/src/i18n/navigation.ts`                   | ✅ Typed Link/redirect                  |
| i18n request       | `apps/web/src/i18n/request.ts`                      | ✅ Dynamic message loading              |
| Env (server)       | `packages/env/src/server.ts`                        | ✅ All server vars                      |
| Env (web)          | `packages/env/src/web.ts`                           | ✅ All public vars                      |
| ORPC client utils  | `apps/web/src/utils/orpc.ts`                        | ✅ Query client + link                  |
| Providers          | `apps/web/src/components/providers.tsx`             | ✅ PostHog + Theme + Query              |
| Next config        | `apps/web/next.config.ts`                           | ✅ Intl + Sentry + React Compiler       |
| Root package.json  | `package.json`                                      | ✅ Bun workspaces + Vite+ commands      |
| Docker compose     | `docker-compose.yml`                                | ✅ PostgreSQL                           |
| Drizzle config     | `packages/db/drizzle.config.ts`                     | ✅ PostgreSQL                           |

|

## 9. Open Risks & Gaps

1. **OAuth env vars** — GitHub/Google client IDs and secrets are defined in schema but empty in `.env`
2. **No migrations generated** — Auth schema + org tables defined but `db:migrate` likely not run yet
3. **Legacy nav types** — `src/types/nav.ts` duplicates `src/types/index.ts` with different shapes
4. **No admin role support** — Protected routes check only `requireOrg`, no `admin` permission checks implemented
5. **No actual dashboard pages** — Only `/dashboard/page.tsx` (basic), all nav routes in config need pages
6. **No seed data** — No seeds for testing auth flows or org team setup
7. **Auth proxy lacks type safety** — The `auth.api.getSession()` call uses `any` response type
8. **i18n not fully integrated** — Messages exist but auth forms don't use translation keys
