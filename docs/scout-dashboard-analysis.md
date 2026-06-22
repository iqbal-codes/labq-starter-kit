# Scout Analysis: Porting next-shadcn-dashboard-starter → karir-fit

**Source:** `/Users/efishery/Documents/workspace/projects/next-shadcn-dashboard-starter/`
**Target:** `/Users/efishery/Documents/workspace/projects/karir-fit/`
**Date:** 2026-05-28

---

## Executive Summary

The source project is a **monolithic Next.js 16 app** with full dashboard shell, i18n, Better Auth + organizations, RBAC navigation, and a features-based code organization. The target is a **Turborepo monorepo** with `apps/web`, `apps/server`, and shared packages (`auth`, `db`, `ui`, `env`, `api`, `config`).

**Key adaptations needed:**

1. **Code structure** → Adapt features-based pattern into monorepo package boundaries
2. **Auth** → Add organization plugin + teams to existing Better Auth setup (PostgreSQL, not SQLite)
3. **Dashboard shell** → Port sidebar layout, header, KBar, theme system into `apps/web`
4. **Translations** → Add `next-intl` from scratch (target has zero i18n)

---

## 1. Code Structure Comparison

### Source Structure (monolithic)

```
src/
├── app/
│   ├── [locale]/              ← i18n dynamic segment
│   │   ├── layout.tsx         ← NextIntlClientProvider
│   │   └── dashboard/
│   │       ├── layout.tsx     ← SidebarProvider + AppSidebar + Header + KBar
│   │       ├── overview/      ← Parallel routes (@sales, @area_stats, etc.)
│   │       ├── product/
│   │       ├── users/
│   │       ├── chat/
│   │       └── ...
│   ├── auth/                  ← Outside [locale] (no i18n)
│   ├── api/auth/[...all]/     ← Better Auth handler
│   └── layout.tsx             ← Root: ThemeScript + ThemeProvider + Providers
├── features/                  ← Feature modules
│   ├── products/{api,components,schemas,constants}
│   ├── users/{api,components,schemas}
│   ├── chat/{components,utils}
│   ├── auth/{components}
│   └── ...
├── components/
│   ├── ui/                    ← shadcn/ui primitives (~60 files)
│   ├── layout/                ← App shell (sidebar, header, providers)
│   ├── themes/                ← Theme system (10 CSS themes)
│   └── kbar/                  ← Command palette
├── config/                    ← nav-config, data-table config
├── hooks/                     ← use-nav, use-breadcrumbs, use-mobile, etc.
├── i18n/                      ← routing, request, navigation
├── lib/                       ← auth, db, utils, api-client
├── messages/                  ← en.json, id.json
└── types/                     ← NavItem, NavGroup, PermissionCheck
```

### Target Structure (monorepo)

```
apps/web/src/
├── app/
│   ├── layout.tsx             ← Root layout (basic grid + Header)
│   ├── dashboard/page.tsx     ← Simple dashboard page
│   ├── login/page.tsx         ← Login with sign-in/sign-up toggle
│   └── ai/page.tsx
├── components/
│   ├── layout/page-container.tsx
│   ├── kbar/index.tsx
│   ├── nav-main.tsx           ← Already ported (partial)
│   ├── nav-user.tsx           ← Already ported (partial)
│   ├── breadcrumbs.tsx        ← Already ported
│   ├── sign-in-form.tsx
│   ├── sign-up-form.tsx
│   └── ...
├── hooks/
│   └── use-breadcrumbs.tsx
├── lib/
│   └── auth-client.ts         ← Basic Better Auth client (no org plugin)
└── utils/orpc.ts

packages/
├── auth/src/index.ts          ← Better Auth server (basic, no org plugin)
├── db/src/schema/auth.ts      ← PostgreSQL schema (user, session, account, verification)
├── ui/src/components/         ← shadcn/ui components (shared package)
├── api/                       ← Hono API server
├── env/                       ← Environment variables
└── config/                    ← Shared config (biome, tailwind)
```

### What Already Exists in Target

| Component                 | Status            | Notes                                      |
| ------------------------- | ----------------- | ------------------------------------------ |
| `nav-main.tsx`            | ✅ Ported         | Uses `@labq-modules/ui/components/sidebar`    |
| `nav-user.tsx`            | ✅ Ported         | Uses `@labq-modules/ui/components/sidebar`    |
| `breadcrumbs.tsx`         | ✅ Ported         |                                            |
| `page-container.tsx`      | ✅ Ported         |                                            |
| `kbar/index.tsx`          | ✅ Ported         |                                            |
| `sign-in-form.tsx`        | ✅ Exists         | Different from source (uses TanStack Form) |
| `sign-up-form.tsx`        | ✅ Exists         | Different from source                      |
| `theme-provider.tsx`      | ✅ Exists         |                                            |
| `search-input.tsx`        | ✅ Exists         |                                            |
| `user-avatar-profile.tsx` | ✅ Exists         |                                            |
| `sidebar.tsx` (ui)        | ✅ In packages/ui | Shared shadcn sidebar primitives           |

### What Needs to Be Added

| Component               | Priority  | Notes                                                  |
| ----------------------- | --------- | ------------------------------------------------------ |
| `app-sidebar.tsx`       | 🔴 High   | Main sidebar with RBAC, org switcher, user footer      |
| `header.tsx`            | 🔴 High   | Sticky header with breadcrumbs, search, theme toggle   |
| `nav-config.ts`         | 🔴 High   | Navigation configuration with RBAC access rules        |
| `types/index.ts`        | 🔴 High   | NavItem, NavGroup, PermissionCheck types               |
| `use-nav.ts`            | 🔴 High   | RBAC navigation filtering hooks                        |
| `proxy.ts` (middleware) | 🔴 High   | Combined auth + i18n middleware                        |
| `i18n/*`                | 🔴 High   | Full next-intl setup                                   |
| `messages/*.json`       | 🔴 High   | Translation files                                      |
| `locale-switcher.tsx`   | 🟡 Medium | Language switcher component                            |
| `theme-selector.tsx`    | 🟡 Medium | CSS theme selector (10 themes)                         |
| `theme-mode-toggle.tsx` | 🟡 Medium | Dark/light toggle                                      |
| `org-switcher.tsx`      | 🟡 Medium | Organization switcher (needs org plugin)               |
| `info-sidebar.tsx`      | 🟢 Low    | Right info panel (optional)                            |
| `icons.tsx`             | 🟡 Medium | Centralized icon map (source uses @tabler/icons-react) |

---

## 2. Auth Architecture

### Source Auth Setup

```ts
// src/lib/auth.ts
export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "sqlite", schema }),
	emailAndPassword: { enabled: true },
	socialProviders: {
		github: { clientId, clientSecret },
		google: { clientId, clientSecret },
	},
	plugins: [
		nextCookies(),
		organization({ teams: { enabled: true } }), // ← KEY: Multi-tenant orgs
	],
});
```

### Target Auth Setup (current)

```ts
// packages/auth/src/index.ts
export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema }),
	trustedOrigins: [env.CORS_ORIGIN],
	emailAndPassword: { enabled: true },
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	advanced: { defaultCookieAttributes: { sameSite: "none", secure: true, httpOnly: true } },
	plugins: [], // ← NO org plugin
});
```

### Schema Differences

**Source (SQLite):** Has 9 tables — `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `team`, `teamMember`

**Target (PostgreSQL):** Has 4 tables — `user`, `session`, `account`, `verification`

**Missing in target:**

- `organization` table
- `member` table (org membership with role)
- `invitation` table (org invites)
- `team` table (teams within orgs)
- `teamMember` table (team membership)
- `session.activeOrganizationId` column
- `session.activeTeamId` column

### Auth Client Differences

**Source:**

```ts
export const authClient = createAuthClient({
	plugins: [organizationClient()],
});
export const { useSession, signIn, signOut, signUp, useActiveOrganization, useListOrganizations } =
	authClient;
```

**Target (current):**

```ts
export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
});
// No organization client plugin, no useActiveOrganization
```

### Middleware Differences

**Source:** `src/proxy.ts` — Combined auth + i18n middleware

- Validates session via `auth.api.getSession()`
- Guards `/dashboard` routes
- Redirects authenticated users away from `/auth`
- Routes through `next-intl/middleware` for i18n

**Target:** No middleware file found. Auth checks are in page components (server-side `authClient.getSession()`).

### What Needs to Change for Auth

1. **Add organization tables to PostgreSQL schema** (`packages/db/src/schema/auth.ts`)
   - Add `organization`, `member`, `invitation`, `team`, `teamMember` tables
   - Add `activeOrganizationId`, `activeTeamId` to `session` table
   - Generate and run migration

2. **Add organization plugin to auth server** (`packages/auth/src/index.ts`)
   - Import `organization` from `better-auth/plugins`
   - Import `nextCookies` from `better-auth/next-js`
   - Add both to plugins array

3. **Add organization client plugin** (`apps/web/src/lib/auth-client.ts`)
   - Import `organizationClient` from `better-auth/client/plugins`
   - Export `useActiveOrganization`, `useListOrganizations`

4. **Create middleware** (`apps/web/src/proxy.ts` or `apps/web/middleware.ts`)
   - Combined auth guard + i18n routing
   - Or keep separate: auth middleware + i18n middleware

---

## 3. Dashboard Shell

### Source Dashboard Layout

```tsx
// src/app/[locale]/dashboard/layout.tsx
export default async function DashboardLayout({ children }) {
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
	return (
		<KBar>
			<SidebarProvider defaultOpen={defaultOpen}>
				<AppSidebar />
				<SidebarInset>
					<Header />
					<LocaleLoadingBar />
					<InfobarProvider defaultOpen={false}>
						{children}
						<InfoSidebar side="right" />
					</InfobarProvider>
				</SidebarInset>
			</SidebarProvider>
		</KBar>
	);
}
```

### Provider Nesting (source)

```
RootLayout (html, body, ThemeScript, NuqsAdapter, ThemeProvider)
  └─ Providers (ActiveThemeProvider → QueryProvider)
       └─ [locale]/layout.tsx (NextIntlClientProvider)
            └─ dashboard/layout.tsx (KBar → SidebarProvider → InfobarProvider)
                 └─ page content
```

### Target Current Layout

```tsx
// apps/web/src/app/layout.tsx
<html lang="en" suppressHydrationWarning>
	<body>
		<Providers>
			<div className="grid grid-rows-[auto_1fr] h-svh">
				<Header />
				{children}
			</div>
		</Providers>
	</body>
</html>
```

### What Needs to Change for Dashboard Shell

1. **Create `apps/web/src/app/dashboard/layout.tsx`**
   - Wrap with `KBar`, `SidebarProvider`, `AppSidebar`, `SidebarInset`
   - Read `sidebar_state` cookie for persistence
   - Move `Header` inside `SidebarInset`

2. **Create `apps/web/src/components/layout/app-sidebar.tsx`**
   - Port from source, adapt imports:
     - `@/components/ui/sidebar` → `@labq-modules/ui/components/sidebar`
     - `@/lib/auth-client` → `@/lib/auth-client` (same)
     - `@/i18n/navigation` → `next/navigation` (if no i18n) or `@/i18n/navigation`
     - `@/components/icons` → create local `icons.tsx` or use `lucide-react`

3. **Create `apps/web/src/components/layout/header.tsx`**
   - Sticky header with backdrop blur
   - Left: SidebarTrigger + Separator + Breadcrumbs
   - Right: SearchInput + LocaleSwitcher + ThemeModeToggle + ThemeSelector

4. **Create `apps/web/src/config/nav-config.ts`**
   - Navigation groups with RBAC access rules
   - Adapt URLs from `/dashboard/*` pattern

5. **Create `apps/web/src/types/index.ts`**
   - NavItem, NavGroup, PermissionCheck interfaces

6. **Create `apps/web/src/hooks/use-nav.ts`**
   - useFilteredNavItems, useFilteredNavGroups hooks
   - Depends on auth client with org plugin

7. **Update `apps/web/src/app/layout.tsx`**
   - Add ThemeScript, NuqsAdapter
   - Restructure provider nesting

---

## 4. Translations (i18n)

### Source i18n Setup

- **Library:** `next-intl` v4.12.0
- **Locales:** `en` (English), `id` (Indonesian)
- **Strategy:** `localePrefix: 'as-needed'` (default locale has no prefix)
- **Middleware:** Combined with auth in `src/proxy.ts`
- **Usage:** `useTranslations('Namespace')` in client components

### Source i18n Files

```
src/i18n/
├── routing.ts      ← defineRouting({ locales: ['en', 'id'], defaultLocale: 'en' })
├── request.ts      ← getRequestConfig → loads messages JSON per locale
├── navigation.ts   ← createNavigation(routing) → Link, redirect, usePathname, useRouter
└── global.d.ts     ← Type augmentation for next-intl
```

### Source Translation Structure (en.json)

```
├── Nav           → 24 keys (sidebar/menu labels)
├── Common        → 19 keys (generic UI strings with {count} placeholders)
├── Auth          → signIn.* + signUp.* (auth form labels)
├── PageTitles    → 15 keys (page title/description pairs)
├── Table         → 10 keys (column headers, search placeholders)
├── Notifications → 5 keys
├── Organizations → 9 keys
├── Billing       → 10 keys
├── Errors        → 5 keys
├── Product       → 6 keys (CRUD actions)
├── User          → 8 keys (CRUD actions)
└── Kanban        → 9 keys
```

### What Needs to Change for i18n

1. **Install `next-intl`** in `apps/web`

   ```bash
   bun add -F web next-intl
   ```

2. **Create i18n config files** in `apps/web/src/i18n/`
   - `routing.ts` — define locales and prefix strategy
   - `request.ts` — load messages per locale
   - `navigation.ts` — locale-aware navigation helpers
   - `global.d.ts` — type augmentation

3. **Create translation files** in `apps/web/src/messages/`
   - `en.json` — English translations (copy from source, adapt keys)
   - `id.json` — Indonesian translations

4. **Update `next.config.ts`** to use `createNextIntlPlugin`

5. **Create locale layout** at `apps/web/src/app/[locale]/layout.tsx`
   - Validate locale, load messages, wrap with `NextIntlClientProvider`

6. **Move dashboard under `[locale]`**
   - `apps/web/src/app/[locale]/dashboard/...`

7. **Create middleware** to handle i18n routing + auth

8. **Create `LocaleSwitcher`** component

9. **Replace hardcoded strings** in existing components with `useTranslations()`

---

## 5. Implementation Roadmap

### Phase 1: Foundation (no breaking changes)

1. Add `next-intl` dependency to `apps/web`
2. Create `apps/web/src/i18n/` config files
3. Create `apps/web/src/messages/en.json` and `id.json`
4. Create `apps/web/src/types/index.ts` (NavItem, NavGroup, PermissionCheck)
5. Create `apps/web/src/config/nav-config.ts`

### Phase 2: Auth Enhancement

1. Add organization tables to `packages/db/src/schema/auth.ts`
2. Generate and run migration
3. Add `organization` plugin to `packages/auth/src/index.ts`
4. Add `organizationClient` to `apps/web/src/lib/auth-client.ts`
5. Export `useActiveOrganization`, `useListOrganizations`

### Phase 3: Dashboard Shell

1. Create `apps/web/src/components/layout/app-sidebar.tsx`
2. Create `apps/web/src/components/layout/header.tsx`
3. Create `apps/web/src/hooks/use-nav.ts`
4. Create `apps/web/src/components/icons.tsx` (or adapt to use lucide-react)
5. Create `apps/web/src/components/org-switcher.tsx`
6. Update `apps/web/src/app/layout.tsx` (provider nesting)
7. Create `apps/web/src/app/dashboard/layout.tsx` (sidebar shell)

### Phase 4: i18n Integration

1. Update `apps/web/next.config.ts` with `createNextIntlPlugin`
2. Create `apps/web/src/app/[locale]/layout.tsx`
3. Move dashboard routes under `[locale]`
4. Create middleware (`apps/web/src/proxy.ts`)
5. Create `apps/web/src/components/layout/locale-switcher.tsx`
6. Replace hardcoded strings with `useTranslations()`

### Phase 5: Polish

1. Add theme system (theme-selector, theme-mode-toggle, CSS themes)
2. Add locale loading bar
3. Port remaining features as needed

---

## 6. Key Risks & Constraints

| #   | Risk                                                                                                | Mitigation                                                                                    |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | **Database mismatch** — Source uses SQLite, target uses PostgreSQL                                  | Schema types differ (`integer` vs `timestamp`). Use PostgreSQL types when porting org tables. |
| 2   | **Import path changes** — Source uses `@/components/ui/*`, target uses `@labq-modules/ui/components/*` | Map all imports during porting.                                                               |
| 3   | **Icon library** — Source uses `@tabler/icons-react`, target uses `lucide-react`                    | Create an icon mapping or switch to lucide-react consistently.                                |
| 4   | **Route structure** — Source puts dashboard under `[locale]`, target has flat `/dashboard`          | Need to restructure routes, which affects existing links.                                     |
| 5   | **Auth page i18n** — Source auth pages are outside `[locale]` (hardcoded English)                   | Decide if auth pages should be translated.                                                    |
| 6   | **Middleware** — Source combines auth + i18n in one proxy. Target has no middleware.                | Need to create middleware that handles both.                                                  |
| 7   | **Existing components** — Target already has nav-main, nav-user, breadcrumbs                        | May need to replace or adapt rather than create fresh.                                        |
