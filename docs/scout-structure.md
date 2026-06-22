# Code Structure Report: next-shadcn-dashboard-starter

**Repo:** `/Users/efishery/Documents/workspace/projects/next-shadcn-dashboard-starter/`
**Stack:** Next.js 16.2.6, React 19.2.4, Tailwind CSS 4, TypeScript 5.7, Drizzle ORM, Better Auth, next-intl, shadcn/ui, TanStack Query, Zustand

---

## 1. Import Aliasing

**File:** `tsconfig.json` — `@/*` maps to `./src/*`

```json
{
	"baseUrl": ".",
	"paths": {
		"@/*": ["./src/*"]
	}
}
```

**`components.json`** (shadcn/ui) defines additional aliases:

- `components` → `@/components`
- `utils` → `@/lib/utils`
- `ui` → `@/components/ui`
- `lib` → `@/lib`
- `hooks` → `@/hooks`

All imports in the codebase use the `@/` prefix (e.g., `import { cn } from '@/lib/utils'`).

---

## 2. App Directory Routing Pattern

### Root Layout (`src/app/layout.tsx`)

- Sets `<html>` with font variables, data-theme, and suppressHydrationWarning
- Contains `<ThemeScript>`, `<NuqsAdapter>` (URL state management), `<ThemeProvider>` (next-themes), `<Providers>` (ActiveTheme + QueryClient), `<NextTopLoader>`, `<Toaster>`
- Reads `active_theme` cookie for theme persistence
- Children render within all these providers

### Static Pages (outside `[locale]`)

- `src/app/page.tsx` — Checks auth session, redirects to `/auth/sign-in` or `/dashboard`
- `src/app/not-found.tsx` — Global 404
- `src/app/global-error.tsx` — Global error boundary
- `src/app/about/page.tsx`, `src/app/privacy-policy/page.tsx`, `src/app/terms-of-service/page.tsx` — Static pages

### Auth Routes (outside `[locale]`)

- `src/app/auth/layout.tsx` — Minimal layout with `robots: noindex`
- `src/app/auth/sign-in/[[...sign-in]]/page.tsx` — Catch-all sign-in
- `src/app/auth/sign-up/[[...sign-up]]/page.tsx` — Catch-all sign-up

### API Routes

- `src/app/api/auth/[...all]/route.ts` — Better Auth handler (catch-all)
- `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts` — Products CRUD
- `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts` — Users CRUD

### `[locale]` Dynamic Segment (i18n)

- **File:** `src/i18n/routing.ts` — Defines locales: `['en', 'id']`, default `'en'`, prefix `'as-needed'`
- **File:** `src/i18n/request.ts` — Loads locale messages from `@/messages/${locale}.json`
- **File:** `src/i18n/navigation.ts` — Re-exports `createNavigation` from `next-intl`

#### `src/app/[locale]/layout.tsx`

- Validates locale against `routing.locales`, calls `notFound()` if invalid
- Calls `setRequestLocale()` (static rendering)
- Fetches messages via `getMessages()`
- Wraps children in `<NextIntlClientProvider>` with locale + messages
- Injects `<script>` tags for `<html lang>` and theme-color meta

#### `src/app/[locale]/dashboard/layout.tsx`

- Reads `sidebar_state` cookie for sidebar persistence
- Wraps content in: `<KBar>` → `<SidebarProvider>` → `<AppSidebar>` + `<SidebarInset>` → `<Header>` + `<LocaleLoadingBar>` + `<InfobarProvider>` + `<InfoSidebar>`
- This layout applies to all dashboard sub-routes

### Dashboard Sub-routes (all under `[locale]/dashboard/`)

| Route                                    | File                                                 |
| ---------------------------------------- | ---------------------------------------------------- |
| `/dashboard`                             | `page.tsx` — Auth check + redirect                   |
| `/dashboard/overview`                    | `overview/page.tsx` + `layout.tsx` (parallel routes) |
| `/dashboard/product`                     | `product/page.tsx`                                   |
| `/dashboard/product/[productId]`         | `product/[productId]/page.tsx`                       |
| `/dashboard/users`                       | `users/page.tsx`                                     |
| `/dashboard/chat`                        | `chat/page.tsx`                                      |
| `/dashboard/kanban`                      | `kanban/page.tsx`                                    |
| `/dashboard/workspaces`                  | `workspaces/page.tsx`                                |
| `/dashboard/workspaces/team/[[...rest]]` | Catch-all team route                                 |
| `/dashboard/forms`                       | `forms/page.tsx`                                     |
| `/dashboard/forms/basic`                 | `forms/basic/page.tsx`                               |
| `/dashboard/forms/multi-step`            | `forms/multi-step/page.tsx`                          |
| `/dashboard/forms/sheet-form`            | `forms/sheet-form/page.tsx`                          |
| `/dashboard/forms/advanced`              | `forms/advanced/page.tsx`                            |
| `/dashboard/react-query`                 | `react-query/page.tsx`                               |
| `/dashboard/elements/icons`              | `elements/icons/page.tsx`                            |
| `/dashboard/profile/[[...profile]]`      | Catch-all profile route                              |
| `/dashboard/notifications`               | `notifications/page.tsx`                             |
| `/dashboard/billing`                     | `billing/page.tsx`                                   |
| `/dashboard/exclusive`                   | `exclusive/page.tsx`                                 |

### Parallel Routes (Overview)

`/dashboard/overview/` uses **4 parallel route slots**:

- `@sales/` — Recent sales table
- `@area_stats/` — Area chart
- `@bar_stats/` — Bar chart
- `@pie_stats/` — Pie chart

Each slot has its own `page.tsx`, `loading.tsx`, `error.tsx`, `default.tsx`.

---

## 3. Features Directory Organization

**Location:** `src/features/`

Each feature follows a consistent structure:

```
src/features/<feature-name>/
  api/           — Data access layer
    queries.ts     — TanStack Query options + key factory
    mutations.ts   — TanStack Mutation options
    service.ts     — Data fetching (the only file to replace for real backend)
    types.ts       — API-specific types
  components/    — Feature-specific React components
  schemas/       — Zod schemas for form validation
  constants/     — Feature constants/options
  utils/         — Utilities, stores, helpers
  info-content.ts — Infobar help content (used by the InfoSidebar)
```

### Existing Features:

| Feature             | Sub-directories                                                            |
| ------------------- | -------------------------------------------------------------------------- |
| `products/`         | `api/`, `components/` (product-tables subfolder), `schemas/`, `constants/` |
| `users/`            | `api/`, `components/` (users-table subfolder), `schemas/`                  |
| `chat/`             | `components/`, `utils/` (store, data, types)                               |
| `kanban/`           | `components/`, `utils/` (store, restrict-to-container)                     |
| `overview/`         | `components/` (charts, skeletons)                                          |
| `auth/`             | `components/` (sign-in, sign-up, team, org)                                |
| `forms/`            | `components/` (demo patterns, multi-step, sheet)                           |
| `elements/`         | `components/` (icons view)                                                 |
| `profile/`          | `components/`, `utils/` (form schema)                                      |
| `notifications/`    | `components/`, `utils/` (store)                                            |
| `react-query-demo/` | `api/`, `components/`                                                      |

### Data Flow Pattern (example: products):

```
pages → feature components → queries.ts / mutations.ts
                                      ↓
                                 service.ts (mock → replace for real backend)
                                      ↓
                                 types.ts (API types)
```

The `service.ts` file contains comments explaining how to swap from mock data to:

1. Server Actions + ORM
2. Route Handlers + ORM
3. BFF proxy to external backend
4. Direct external API

---

## 4. Components Directory

**Location:** `src/components/`

### `ui/` — shadcn/ui Primitives (~60+ files)

All standard Radix-based shadcn components: accordion, alert-dialog, avatar, badge, button, calendar, card, chart, checkbox, command, dialog, drawer, dropdown-menu, form-context, input, label, modal, pagination, select, sheet, sidebar (custom app-sidebar implementation), skeleton, spinner, table, tabs, toast/sonner, tooltip, etc.

### `layout/` — App Shell Components

| File                     | Role                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `app-sidebar.tsx`        | Main sidebar navigation (collapsible, grouped, RBAC-filtered) |
| `header.tsx`             | Top header bar                                                |
| `providers.tsx`          | Client providers wrapper (ActiveTheme + QueryProvider)        |
| `query-provider.tsx`     | TanStack Query provider                                       |
| `page-container.tsx`     | Layout wrapper for page content                               |
| `info-sidebar.tsx`       | Right sidebar for contextual help                             |
| `locale-loading-bar.tsx` | Loading indicator during locale switch                        |
| `locale-switcher.tsx`    | Language switcher (en/id)                                     |
| `user-nav.tsx`           | User dropdown navigation                                      |
| `cta-github.tsx`         | GitHub CTA button                                             |

### `themes/` — Theme System

| File                    | Role                                            |
| ----------------------- | ----------------------------------------------- |
| `theme.config.ts`       | Theme definitions (DEFAULT_THEME, THEMES array) |
| `theme-provider.tsx`    | next-themes ThemeProvider wrapper               |
| `theme-script.tsx`      | Inline script for theme-color meta              |
| `theme-mode-toggle.tsx` | Light/dark/system toggle                        |
| `theme-selector.tsx`    | Theme picker UI                                 |
| `active-theme.tsx`      | Active theme context provider                   |
| `font.config.ts`        | Font variable setup                             |

### `kbar/` — Command Palette (Cmd+K)

`index.tsx`, `result-item.tsx`, `render-result.tsx`, `use-theme-switching.tsx`

### Other Top-Level Components

| File                      | Role                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `icons.tsx`               | Centralized icon map (Icons object using @tabler/icons-react) |
| `breadcrumbs.tsx`         | Breadcrumb navigation                                         |
| `file-uploader.tsx`       | File upload with react-dropzone                               |
| `form-card-skeleton.tsx`  | Loading skeleton for forms                                    |
| `github-stars-button.tsx` | GitHub star count button                                      |
| `nav-main.tsx`            | Main navigation                                               |
| `nav-projects.tsx`        | Projects navigation                                           |
| `nav-user.tsx`            | User navigation                                               |
| `org-switcher.tsx`        | Organization switcher (Better Auth)                           |
| `search-input.tsx`        | Search input                                                  |
| `user-avatar-profile.tsx` | User avatar with info                                         |

---

## 5. Lib Directory

**Location:** `src/lib/`

| File                      | Role                                                           |
| ------------------------- | -------------------------------------------------------------- |
| `utils.ts`                | `cn()` helper (clsx + tailwind-merge), `formatBytes()`         |
| `auth.ts`                 | Better Auth server instance setup                              |
| `auth-client.ts`          | Better Auth client (createAuthClient with organization plugin) |
| `auth-schema.ts`          | Drizzle schema for Better Auth tables                          |
| `db.ts`                   | Drizzle ORM client (libSQL/Turso or local SQLite)              |
| `api-client.ts`           | Generic fetch wrapper for `/api/*` endpoints                   |
| `query-client.ts`         | TanStack Query Client singleton                                |
| `data-table.ts`           | Data table utilities                                           |
| `parsers.ts`              | Search params / filter parsing with nuqs                       |
| `searchparams.ts`         | Search params helpers                                          |
| `format.ts`               | Formatting utilities                                           |
| `date-fns.ts`             | Date utilities (re-exports from date-fns)                      |
| `compose-refs.ts`         | React ref composition utility                                  |
| `locale.ts`               | Locale utilities                                               |
| `locale-loading-store.ts` | Zustand store for locale loading state                         |

---

## 6. Hooks Directory

**Location:** `src/hooks/`

| File                         | Role                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `use-breadcrumbs.tsx`        | Breadcrumb generation hook                                            |
| `use-callback-ref.tsx`       | Stable callback ref                                                   |
| `use-controllable-state.tsx` | Controlled/uncontrolled state pattern                                 |
| `use-data-table.ts`          | Data table state management (sorting, filtering, pagination via nuqs) |
| `use-debounce.tsx`           | Debounced value                                                       |
| `use-debounced-callback.ts`  | Debounced callback                                                    |
| `use-media-query.ts`         | Responsive media query                                                |
| `use-mobile.tsx`             | Mobile detection                                                      |
| `use-nav.ts`                 | RBAC navigation filtering (`useFilteredNavGroups`)                    |
| `use-stepper.tsx`            | Multi-step form stepper state                                         |

---

## 7. Config Directory

**Location:** `src/config/`

| File            | Role                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| `nav-config.ts` | Navigation configuration (sidebar groups + items with RBAC access rules) |
| `data-table.ts` | Data table filter/sort operator definitions                              |
| `infoconfig.ts` | Infobar content definitions for contextual help sidebars                 |

---

## 8. Other Key Directories

| Directory                         | Contents                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/types/`                      | `index.ts` (NavItem, NavGroup, PermissionCheck types), `data-table.ts` (extended table types) |
| `src/constants/`                  | `mock-api.ts`, `mock-api-users.ts` — Fake data generators for demo/prototyping                |
| `src/i18n/`                       | `routing.ts`, `request.ts`, `navigation.ts`, `global.d.ts` — next-intl configuration          |
| `src/styles/`                     | `globals.css` (Tailwind entry), `theme.css`, `themes/*.css` (12 CSS theme variants)           |
| `src/test/`                       | Test utilities                                                                                |
| `src/__tests__/`                  | Test files                                                                                    |
| `drizzle/`                        | SQL migration files (Drizzle Kit)                                                             |
| `messages/`                       | JSON translation files (empty currently — `en.json`, `id.json` expected)                      |
| `public/`                         | Static assets                                                                                 |
| `scripts/`                        | Build/dev scripts                                                                             |
| `docs/`                           | Documentation                                                                                 |
| `reusable-components/`            | Reusable component library                                                                    |
| `.github/`                        | CI/CD workflows                                                                               |
| `.claude/`                        | AI assistant instructions                                                                     |
| `context-build/`, `graphify-out/` | Code context/graph generation output                                                          |

---

## 9. Architecture Summary

### Provider Nesting (top-down)

```
RootLayout (html, body, ThemeScript, NuqsAdapter, ThemeProvider)
  └─ Providers (ActiveThemeProvider → QueryProvider)
       └─ [locale]/layout.tsx (NextIntlClientProvider)
            └─ dashboard/layout.tsx (KBar → SidebarProvider → InfobarProvider)
                 └─ page content
```

### Route Hierarchy

```
/app                          → Redirect to /auth/sign-in or /dashboard
/app/auth/*                   → Auth pages (no i18n wrapper)
/app/[locale]/                → i18n layout (locale validation + messages)
/app/[locale]/dashboard/      → Dashboard shell (sidebar + header + KBar)
/app/[locale]/dashboard/*     → Feature pages
/app/api/*                    → API route handlers
/app/api/auth/[...all]        → Better Auth handler
```

### Auth Flow

- **Server:** `auth.api.getSession()` in root page.tsx and dashboard page.tsx
- **Client:** `useSession()`, `signIn()`, `signOut()` from `@/lib/auth-client`
- **RBAC:** Navigation items in `nav-config.ts` have `access` property for permission/plan/role/org checks; filtered client-side by `useFilteredNavGroups()`

### Data Layer

- **ORM:** Drizzle (libSQL/Turso provider, local SQLite fallback)
- **Server State:** TanStack Query with query/mutation options in feature `api/` directories
- **Client State:** Zustand stores in feature `utils/` directories
- **URL State:** nuqs for search params, filters, pagination
- **Mock Layer:** `src/constants/mock-api.ts` — swap by editing `service.ts` in each feature

### Component Architecture

- **Page components** in `src/app/[locale]/dashboard/*/page.tsx` — thin, typically just render a feature view component
- **Feature view components** in `src/features/*/components/` — compose UI primitives
- **UI primitives** in `src/components/ui/` — shadcn/ui-styled Radix components
- **Layout components** in `src/components/layout/` — app shell (sidebar, header, providers)
- **Theme components** in `src/components/themes/` — CSS variable-based theme switching (12 themes)

---

## 10. Start Here

To begin working on this codebase, open:

**`src/app/[locale]/dashboard/layout.tsx`** — The dashboard shell. It shows the overall provider nesting, sidebar structure, header, KBar command palette, and how pages get composed. From here, trace into `src/components/layout/app-sidebar.tsx` for navigation, `src/config/nav-config.ts` for nav items, and then into any `src/features/*/` directory to see a feature's full data flow.
