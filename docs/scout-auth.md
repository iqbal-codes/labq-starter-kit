# Auth Architecture Report: next-shadcn-dashboard-starter

> **Project root:** `/Users/efishery/Documents/workspace/projects/next-shadcn-dashboard-starter/`
> **Auth library:** Better Auth (v1.6.11)
> **Database:** SQLite via libsql + Drizzle ORM (can swap to Turso in production)
> **Date analyzed:** 2026-05-28

---

## 1. Auth Library Setup

### 1a. Server-side auth instance (`src/lib/auth.ts`)

```ts
// src/lib/auth.ts — lines 1-35
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import * as schema from "./auth-schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "sqlite", schema }),
	emailAndPassword: { enabled: true },
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID ?? "",
			clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		},
	},
	plugins: [
		nextCookies(), // server-side cookie handling
		organization({ teams: { enabled: true } }), // multi-tenant orgs + teams
	],
});
```

Key observations:

- Uses **Better Auth** with Drizzle SQLite adapter
- Email/password auth is **enabled**
- GitHub and Google OAuth providers are **configured but optional** (keys default to `''`)
- Organization plugin with teams enabled provides multi-tenancy out of the box
- `nextCookies()` plugin handles server-side cookie management

### 1b. Database connection (`src/lib/db.ts`)

```ts
// src/lib/db.ts — lines 1-8
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./auth-schema";

const turso = createClient({
	url: process.env.DATABASE_URL ?? "file:./local.db",
});

export const db = drizzle(turso, { schema });
```

- Uses `@libsql/client` — compatible with both local SQLite (`file:./local.db`) and Turso (libsql server)
- Schema is imported from `auth-schema.ts` and passed to Drizzle so queries are typed

### 1c. Client-side auth client (`src/lib/auth-client.ts`)

```ts
// src/lib/auth-client.ts — lines 1-10
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	plugins: [organizationClient()],
});

export const { useSession, signIn, signOut, signUp, useActiveOrganization, useListOrganizations } =
	authClient;
```

- Client-side Better Auth client
- Exports hooks: `useSession`, `useActiveOrganization`, `useListOrganizations`
- Exports actions: `signIn`, `signOut`, `signUp`

### 1d. Database Schema (`src/lib/auth-schema.ts`)

Full Drizzle schema with 9 tables:

| Table          | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `user`         | Core user data (name, email, email_verified, image)                |
| `session`      | Auth sessions (token, expires_at, ip, user_agent, active org/team) |
| `account`      | OAuth/provider accounts + password hash                            |
| `verification` | Email verification codes                                           |
| `organization` | Multi-tenant orgs (name, slug, logo, metadata)                     |
| `member`       | Org membership with role (admin/member)                            |
| `invitation`   | Org invites (email, role, status, inviter)                         |
| `team`         | Teams within orgs                                                  |
| `team_member`  | Team membership with role                                          |

**Migration file:** `drizzle/0000_graceful_the_captain.sql` (initial schema, applied to `local.db`)

---

## 2. Auth Middleware / Route Guard

**There is NO `middleware.ts` at root or `src/` level.** Instead, the app uses a custom proxy at `src/proxy.ts` that acts as the middleware entry point.

### `src/proxy.ts` — The auth gate

```ts
// src/proxy.ts — lines 1-44 (full file)
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const handleI18nRouting = createMiddleware(routing);

const nonI18nRoutes = ["/", "/auth", "/about", "/terms-of-service", "/privacy-policy"];

export default async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Validate session against the database (not just cookie existence)
	const session = await auth.api.getSession({ headers: request.headers });

	// Redirect authenticated users away from auth pages
	if (session && pathname.startsWith("/auth")) {
		return NextResponse.redirect(new URL("/dashboard/overview", request.url));
	}

	// Protect dashboard routes — require session
	if (pathname.startsWith("/dashboard")) {
		if (!session) {
			const signInUrl = new URL("/auth/sign-in", request.url);
			signInUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(signInUrl);
		}
	}

	// Non-i18n routes (root, auth, about, etc.) — pass through directly
	if (isNonI18nRoute(pathname)) {
		return NextResponse.next();
	}

	// All other routes go through i18n routing
	if (!session) {
		const signInUrl = new URL("/auth/sign-in", request.url);
		signInUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(signInUrl);
	}

	return handleI18nRouting(request);
}

export const config = {
	matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
```

**How it works:**

1. Matches all routes except `/api`, `/_next`, `/_vercel`, and static files
2. Validates session server-side via `auth.api.getSession()` (not just cookie check)
3. **Authenticated users** on `/auth/*` routes are redirected to `/dashboard/overview`
4. **Unauthenticated users** on `/dashboard/*` are redirected to `/auth/sign-in?callbackUrl=...`
5. Non-i18n routes (`/`, `/auth`, `/about`, `/terms-of-service`, `/privacy-policy`) bypass i18n
6. All other routes go through `next-intl` i18n routing — **but also require session** (line 41-44)

**⚠️ Note:** Lines 41-44 require a session for ANY route that isn't in `nonI18nRoutes`. This means all locale-prefixed routes (`/en/...`, `/id/...`) are also protected, which may be overly restrictive. Public pages under `/[locale]` may need middleware exceptions added.

---

## 3. Auth Routes (`src/app/auth/`)

### Route structure

```
src/app/auth/
├── layout.tsx                # minimal layout (sets robots: noindex)
├── page.tsx                  # root /auth → redirects to /auth/sign-in
├── sign-in/
│   └── [[...sign-in]]/
│       └── page.tsx          # renders <SignInViewPage />
└── sign-up/
    └── [[...sign-up]]/
        └── page.tsx          # renders <SignUpViewPage />
```

### `auth/layout.tsx`

```tsx
export const metadata: Metadata = {
	robots: { index: false, follow: false },
};
export default function AuthLayout({ children }) {
	return children;
}
```

Minimal layout that prevents search indexing.

### `auth/page.tsx`

```tsx
export default function AuthPage() {
	redirect("/auth/sign-in");
}
```

Root `/auth` simply redirects to sign-in.

### `auth/sign-in/[[...sign-in]]/page.tsx`

```tsx
import SignInViewPage from "@/features/auth/components/sign-in-view";
export default async function Page() {
	return <SignInViewPage />;
}
```

### `auth/sign-up/[[...sign-up]]/page.tsx`

```tsx
import SignUpViewPage from "@/features/auth/components/sign-up-view";
export default async function Page() {
	return <SignUpViewPage />;
}
```

Both use **catch-all optional segments** (`[[...sign-in]]`) — this is likely for future i18n or additional sub-routes.

---

## 4. Auth API Routes (`src/app/api/auth/`)

### `src/app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

- Single catch-all route that delegates all auth API calls to Better Auth
- Handles: sign-in, sign-up, sign-out, session refresh, OAuth callbacks, org management, etc.
- All Better Auth API endpoints are served under `/api/auth/*`

---

## 5. Auth Components (`src/features/auth/components/`)

| Component                | Type   | Purpose                                                                 |
| ------------------------ | ------ | ----------------------------------------------------------------------- |
| `auth-form.tsx`          | Client | Core email/password sign-in & sign-up form                              |
| `sign-in-view.tsx`       | Client | Sign-in page layout with brand + grid background                        |
| `sign-up-view.tsx`       | Client | Sign-up page layout with brand + grid background                        |
| `github-auth-button.tsx` | Client | GitHub OAuth button (stub — `onClick` is no-op)                         |
| `user-auth-form.tsx`     | Client | Alternative email auth form (uses TanStack Form, seems like WIP/legacy) |
| `organization-list.tsx`  | Client | List/create/switch organizations                                        |
| `team-management.tsx`    | Client | Invite members to current org                                           |
| `interactive-grid.tsx`   | Client | Decorative animated grid background                                     |

### `auth-form.tsx` (core form)

```tsx
// Key flow:
const handleSubmit = async (e) => {
	if (mode === "signin") {
		const result = await signIn.email({
			email,
			password,
			callbackURL: "/dashboard/overview",
		});
	} else {
		const result = await signUp.email({
			name,
			email,
			password,
			callbackURL: "/dashboard/overview",
		});
	}
};
```

- Handles both sign-in and sign-up based on `mode` prop
- Uses `signIn.email()` and `signUp.email()` from Better Auth client
- Redirects to `/dashboard/overview` on success
- Shows inline error messages from Better Auth's error object
- Password minimum length: 8

### `github-auth-button.tsx`

- Stub component — `onClick` is `() => void 0` (no-op)
- Needs to be wired up to `authClient.signIn.social({ provider: 'github' })`

---

## 6. Dashboard Integration

### How auth is used in the dashboard layout

The dashboard layout (`src/app/[locale]/dashboard/layout.tsx`) does **not** directly check auth. Auth is handled at two levels:

1. **Middleware-level** (`src/proxy.ts`): Redirects unauthenticated users away from `/dashboard`
2. **Component-level** (client-side): Various components use `useSession()` from Better Auth

### Auth consumers in the dashboard:

| Component       | File                                            | What it does with auth                                                                                |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `AppSidebar`    | `src/components/layout/app-sidebar.tsx`         | Uses `useSession()` to get user info, shows user avatar in sidebar footer, provides sign-out dropdown |
| `UserNav`       | `src/components/layout/user-nav.tsx`            | User avatar dropdown with profile link and sign-out                                                   |
| `OrgSwitcher`   | `src/components/org-switcher.tsx`               | Shows active org, allows switching orgs, links to workspace creation                                  |
| `NavUser`       | `src/components/nav-user.tsx`                   | Sidebar footer user display (receives user as prop)                                                   |
| `BillingPage`   | `src/app/[locale]/dashboard/billing/page.tsx`   | Checks `session?.session?.activeOrganizationId`, shows fallback if no org selected                    |
| `ExclusivePage` | `src/app/[locale]/dashboard/exclusive/page.tsx` | Checks session for user name, has pro-plan gating (hardcoded to true for now)                         |

### Sign-out flow (from `user-nav.tsx` and `app-sidebar.tsx`):

```tsx
signOut({
	fetchOptions: { onSuccess: () => router.push("/auth/sign-in") },
});
```

### Session usage pattern:

```tsx
const { data: session, isPending } = useSession();
const user = session?.user ?? null; // { id, name, email, image }
const activeOrgId = session?.session?.activeOrganizationId;
```

---

## 7. Environment Variables

| Variable                      | Required | Purpose                                                                      |
| ----------------------------- | -------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`                | Yes      | SQLite database path (`file:./local.db` for local, Turso URL for production) |
| `BETTER_AUTH_SECRET`          | Yes      | Secret key for encrypting sessions (generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL`             | Yes      | Base URL of the app (`http://localhost:3000` for dev)                        |
| `GITHUB_CLIENT_ID`            | No\*     | GitHub OAuth client ID                                                       |
| `GITHUB_CLIENT_SECRET`        | No\*     | GitHub OAuth client secret                                                   |
| `GOOGLE_CLIENT_ID`            | No\*     | Google OAuth client ID                                                       |
| `GOOGLE_CLIENT_SECRET`        | No\*     | Google OAuth client secret                                                   |
| `BUILD_STANDALONE`            | No       | Set to `"true"` for Docker/VPS deployments                                   |
| `NEXT_PUBLIC_SENTRY_DSN`      | No       | Sentry error tracking DSN                                                    |
| `NEXT_PUBLIC_SENTRY_ORG`      | No       | Sentry org slug                                                              |
| `NEXT_PUBLIC_SENTRY_PROJECT`  | No       | Sentry project name                                                          |
| `SENTRY_AUTH_TOKEN`           | No       | Sentry auth token for source maps                                            |
| `NEXT_PUBLIC_SENTRY_DISABLED` | No       | Set to `"true"` to disable Sentry                                            |

_\*Optional if not using the social provider._

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    src/proxy.ts                          │
│  (Custom Next.js middleware — validates session via     │
│   auth.api.getSession(), guards /dashboard, redirects  │
│   from /auth if authenticated, handles i18n routing)    │
└──────────┬──────────────────────────────────┬────────────┘
           │                                  │
    ┌──────▼──────┐                  ┌────────▼────────┐
    │  Auth Pages  │                  │ Dashboard Pages │
    │  /auth/...   │                  │ /dashboard/...  │
    │  (public)    │                  │ (protected)     │
    └──────┬──────┘                  └────────┬────────┘
           │                                  │
    ┌──────▼──────┐                  ┌────────▼────────┐
    │ AuthForm    │                  │ useSession()    │
    │ (client)    │                  │ signOut()       │
    │ signIn /    │                  │ OrgSwitcher     │
    │ signUp      │                  │ UserNav         │
    └──────┬──────┘                  │ AppSidebar      │
           │                         └────────┬────────┘
           │                                  │
    ┌──────▼──────────────────────────────────▼────────┐
    │              Better Auth Client                    │
    │              src/lib/auth-client.ts                │
    │  createAuthClient({ plugins: [organizationClient] })│
    └────────────────────┬───────────────────────────────┘
                         │
    ┌────────────────────▼───────────────────────────────┐
    │           Better Auth Server (src/lib/auth.ts)      │
    │  betterAuth({                                       │
    │    database: drizzleAdapter(db, sqlite),            │
    │    emailAndPassword, socialProviders,               │
    │    plugins: [nextCookies(), organization()]         │
    │  })                                                 │
    └──────────┬──────────────────────────┬───────────────┘
               │                          │
    ┌──────────▼──────────┐    ┌──────────▼──────────────┐
    │    API Routes        │    │  Drizzle ORM + libsql    │
    │  /api/auth/[...all]  │    │  src/lib/db.ts           │
    │  toNextJsHandler()   │    │  schema: auth-schema.ts  │
    └─────────────────────┘    └─────────────────────────┘
                                     │
                            ┌────────▼────────┐
                            │   SQLite / Turso │
                            │   local.db       │
                            └─────────────────┘
```

**Data flow:**

1. Request arrives → `proxy.ts` validates session via `auth.api.getSession()`
2. If `/auth/*` + authenticated → redirect to dashboard
3. If `/dashboard/*` + not authenticated → redirect to sign-in
4. All other routes → i18n routing (also requires session currently)
5. Client-side components use `useSession()` hook for reactive auth state
6. Auth mutations (sign-in, sign-up, sign-out) go through Better Auth client → `/api/auth/*` API

---

## Key Observations & Risks

1. **No top-level middleware.ts** — The proxy is in `src/proxy.ts`. It's registered via `next.config.ts` or a custom server setup? Double-check how Next.js picks this up. If it's not referenced from `next.config.ts`, it may not run automatically.

2. **Overly broad route protection** — Lines 41-44 of `proxy.ts` require a session for ALL non-`nonI18nRoutes` paths, including locale-prefixed public pages. This would make pages like `/en/about` inaccessible without login.

3. **GitHub OAuth button is a stub** — The `github-auth-button.tsx` has `onClick={() => void 0}` and doesn't actually trigger OAuth login.

4. **No server-side session checks in dashboard layout** — The dashboard layout relies entirely on the middleware for protection. Client-side components use `useSession()` which is reactive but doesn't enforce authorization.

5. **Pro plan gating is hardcoded** — `exclusive/page.tsx` has `const isPro = true` as a placeholder.

6. **Middleware validates session server-side** — This is good security practice (not just checking cookie presence), but every page request hits the database.

---

## Files Another Agent Should Open First

1. **`src/proxy.ts`** — The middleware/gate; most critical file for understanding request flow
2. **`src/lib/auth.ts`** — Server auth configuration (Better Auth setup)
3. **`src/lib/auth-client.ts`** — Client auth hooks
4. **`src/features/auth/components/auth-form.tsx`** — Core auth form implementation
5. **`src/app/api/auth/[...all]/route.ts`** — Auth API endpoint
