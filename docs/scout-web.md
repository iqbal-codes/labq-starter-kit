# Code Context: apps/web

## Files Retrieved

1. `apps/web/package.json` (all lines) — dependencies, no test scripts
2. `apps/web/next.config.ts` (all lines) — Next.js 16 config, next-intl, Sentry wrapper
3. `apps/web/.env.example` (all lines) — env vars for the web app
4. `apps/web/proxy.ts` (all lines) — **critical middleware**: session validation, auth redirects, i18n routing
5. `apps/web/src/app/page.tsx` (all lines) — root page: session check → redirect to dashboard or sign-in
6. `apps/web/src/app/layout.tsx` (all lines) — root layout: Geist fonts, Providers, Header
7. `apps/web/src/app/not-found.tsx` (all lines) — 404 page
8. `apps/web/src/app/login/page.tsx` (all lines) — redirects to `/auth/sign-in`
9. `apps/web/src/app/auth/layout.tsx` (all lines) — meta noindex wrapper
10. `apps/web/src/app/auth/page.tsx` (all lines) — redirects to `/auth/sign-in`
11. `apps/web/src/app/auth/sign-in/[[...sign-in]]/page.tsx` (all lines) — renders `<SignInForm />`
12. `apps/web/src/app/auth/sign-up/[[...sign-up]]/page.tsx` (all lines) — renders `<SignUpForm />`
13. `apps/web/src/components/auth/sign-in-form.tsx` (all lines) — full sign-in UI: Google OAuth, email/password via better-auth, TanStack Form
14. `apps/web/src/components/auth/sign-up-form.tsx` (all lines) — full sign-up UI: Google OAuth, email/password via better-auth, TanStack Form
15. `apps/web/src/lib/auth-client.ts` (all lines) — **auth client singleton**: wraps `better-auth/react` with organization plugin
16. `apps/web/src/app/api/auth/[...auth]/route.ts` (all lines) — **API route handler**: delegates to `@labq-modules/auth` via `toNextJsHandler`
17. `apps/web/src/app/[locale]/layout.tsx` (all lines) — locale layout: validates locale, loads i18n messages
18. `apps/web/src/app/[locale]/dashboard/layout.tsx` (all lines) — dashboard layout: sidebar, header, cookie-based sidebar state
19. `apps/web/src/app/[locale]/dashboard/page.tsx` (all lines) — dashboard page: server-side session fetch, ORPC data
20. `apps/web/src/app/[locale]/dashboard/dashboard.tsx` (all lines) — client dashboard component: TanStack Query with ORPC
21. `apps/web/src/app/[locale]/dashboard/overview/page.tsx` (all lines) — overview page with placeholder stats cards
22. `apps/web/src/app/[locale]/dashboard/account/login/page.tsx` (all lines) — login history placeholder page (different page!)
23. `apps/web/src/components/providers.tsx` (all lines) — client providers: PostHog, Theme, TanStack Query, Tooltip, Sonner
24. `apps/web/src/components/header.tsx` (all lines) — global header with nav links, mode toggle, user menu
25. `apps/web/src/utils/orpc.ts` (all lines) — ORPC client setup with TanStack Query integration
26. `apps/web/src/i18n/routing.ts` (all lines) — route definitions with locales `['en', 'id']`
27. `apps/web/src/i18n/navigation.ts` (all lines) — typed navigation primitives (Link, redirect, useRouter, usePathname)
28. `apps/web/src/i18n/request.ts` (all lines) — message loader for next-intl
29. `apps/web/src/types/index.ts` (all lines) — shared types: `AppPathname`, `NavItem`, `NavGroup`, `PermissionCheck`
30. `apps/web/src/types/nav.ts` (all lines) — duplicate nav types (serves legacy usage)
31. `apps/web/src/config/nav-config.ts` (all lines) — sidebar navigation config with RBAC access rules
32. `packages/auth/src/index.ts` (all lines) — **better-auth server setup**: Drizzle adapter, email/password, OAuth (GitHub, Google), organization plugin
33. `packages/env/src/web.ts` (all lines) — client env schema (`NEXT_PUBLIC_*`)
34. `packages/env/src/server.ts` (all lines) — server env schema (DB URL, auth secrets, OAuth keys, Sentry, Resend)
35. `apps/web/components.json` (all lines) — shadcn/ui configuration
36. `apps/web/instrumentation.ts` (all lines) — Sentry instrumentation for server & edge
37. `apps/web/sentry.server.config.ts` (all lines) — Sentry server init
38. `apps/web/sentry.edge.config.ts` (all lines) — Sentry edge init

## Key Code

### Auth Architecture

**Server-side auth** (proxy middleware + API routes):

- `/apps/web/proxy.ts` — middleware that checks session on every request, redirects unauthenticated users to `/login`, and redirects authenticated users away from auth pages
- `/apps/web/src/app/api/auth/[...auth]/route.ts` — catches all better-auth API calls (sign-in, sign-up, session, etc.) and delegates to the shared auth package
- `packages/auth/src/index.ts` — creates a `betterAuth` instance with Drizzle adapter, email/password, Google/GitHub OAuth, organization plugin, and next-cookies integration

**Client-side auth**:

- `apps/web/src/lib/auth-client.ts` — single `authClient` singleton created via `createAuthClient` from better-auth/react with the organization plugin

**Auth routes**:

- `/login` → server redirects to `/auth/sign-in`
- `/auth/sign-in` → renders `<SignInForm />`
- `/auth/sign-up` → renders `<SignUpForm />`
- `/auth/` → redirects to `/auth/sign-in`

**Sign-in flow** (`/apps/web/src/components/auth/sign-in-form.tsx`):

```
Email/password: authClient.signIn.email({ email, password })
                 → onSuccess: router.push("/dashboard")
                 → onError: toast.error()
Google OAuth:   authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })
```

### Middleware Flow (`proxy.ts`)

```
Request → session check via auth.api.getSession()
  ├─ Authenticated + /auth/** or /login/** → redirect to /dashboard/overview
  ├─ Unauthenticated + /dashboard/** → redirect to /login?callbackUrl=...
  └─ All other routes → i18n routing via next-intl
```

### Navigation & Routing

- Dual routing system: non-i18n routes (/, /auth/\*, /login, /about, etc.) bypass the `[locale]` segment
- Locale-prefixed routes live under `/apps/web/src/app/[locale]/`
- `en` and `id` locales supported with `as-needed` prefix mode
- Sidebar nav defined in `src/config/nav-config.ts` with RBAC access rules (`requireOrg`, `role`, `permission`, `plan`, `feature`)

### Data Fetching

- ORPC client (`src/utils/orpc.ts`) connects to the Hono API backend at `NEXT_PUBLIC_SERVER_URL/rpc`
- TanStack Query is the client-side data management layer
- Query cache errors display Sonner toast with retry action

## Architecture

```
┌──────────────────────────────────────────────┐
│               apps/web (Next.js 16)          │
│                                                │
│  proxy.ts (middleware)                         │
│   ├─ Session check via @labq-modules/auth  │
│   ├─ Auth protection + redirects               │
│   └─ i18n routing (next-intl)                  │
│                                                │
│  /api/auth/[...auth] → @labq-modules/auth  │
│     (better-auth handler)                      │
│                                                │
│  Root layout → Providers stack:                │
│   PostHog → Theme → QueryClient → Tooltip      │
│                                                │
│  Pages:                                        │
│   / (root) → session check → redirect          │
│   /login → redirect to /auth/sign-in           │
│   /auth/sign-in → SignInForm                   │
│   /auth/sign-up → SignUpForm                   │
│   /dashboard/** → protected routes             │
│   /[locale]/dashboard/** → i18n dashboard      │
├──────────────────────────────────────────────┤
│                 packages                       │
│  @labq-modules/auth   (better-auth setup)  │
│  @labq-modules/env    (env schemas)         │
│  @labq-modules/ui     (shadcn components)   │
│  @labq-modules/api    (Hono backend)        │
│  @labq-modules/db     (Drizzle ORM)         │
│  @labq-modules/email  (Resend)              │
│  @labq-modules/config (shared config)       │
└──────────────────────────────────────────────┘
```

## Test Setup

**No test infrastructure exists.** There are:

- No test files (`*.test.*`, `*.spec.*`) anywhere in the entire monorepo
- No test dependencies in `apps/web/package.json` (no vitest, jest, playwright, cypress)
- No test configuration files (`vitest.config.*`, `jest.config.*`)
- The `.gitignore` has a `/coverage` entry, suggesting tests were once expected
- No `test` script in `apps/web/package.json`

## Start Here

Open `apps/web/proxy.ts` — this is the central middleware that controls all routing logic (auth protection, session validation, i18n routing). Every change to auth flows or page access starts here.

Then read `apps/web/src/lib/auth-client.ts` for the client side and `packages/auth/src/index.ts` for the server-side better-auth configuration.

## Constraints, Risks & Open Questions

1. **No test coverage at all** — any changes need tests built from scratch
2. **Duplicate routing paths** — `/login` and `/auth/sign-in` both lead to the same form; `/auth/` redirects to `/auth/sign-in`; `/dashboard/account/login` is actually a "Login History" placeholder, not a sign-in page
3. **Env setup bottleneck** — the auth package requires `BETTER_AUTH_SECRET` (min 32 chars), `BETTER_AUTH_URL`, `CORS_ORIGIN`, `DATABASE_URL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` — all must be set in the root `.env`
4. **OAuth keys** — GitHub and Google client ID/secret are optional (empty string fallback), but email/password requires them for social login buttons
5. **React Compiler disabled** — disabled in `next.config.ts` because it breaks TanStack Form's `useFieldContext`
6. **Organization plugin enabled** — auth supports organizations/teams, but multiple auth routes are behind `requireOrg` RBAC access checks
7. **Cookie security** — `sameSite: "none"`, `secure: true` on auth cookies — requires HTTPS in production
