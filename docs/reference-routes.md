# Reference Project Routing Structure

**Source:** `next-shadcn-dashboard-starter/src/app`
**Pattern:** Next.js 15 App Router with internationalization (next-intl), Better Auth, and parallel routes

---

## 1. Route Tree (Complete)

```
/                                                  [Root page — session check + redirect]
├── layout.tsx                                     [RootLayout — theme, providers, fonts, toaster]
├── global-error.tsx                               [GlobalError — Sentry capture + NextError fallback]
├── not-found.tsx                                  [NotFound — 404 UI with back/home buttons]
│
├── about/                                         [Static: About page]
│   └── page.tsx                                   [Metadata + About content]
│
├── privacy-policy/                                [Static: Privacy Policy page]
│   └── page.tsx                                   [Metadata + Privacy content]
│
├── terms-of-service/                              [Static: Terms of Service page]
│   └── page.tsx                                   [Metadata + Terms content]
│
├── auth/                                          [Auth route group — no locale prefix]
│   ├── layout.tsx                                 [AuthLayout — noindex meta, passes children through]
│   ├── page.tsx                                   [Redirects to /auth/sign-in]
│   ├── sign-in/[[...sign-in]]/page.tsx            [Catch-all — SignInViewPage (Better Auth)]
│   └── sign-up/[[...sign-up]]/page.tsx            [Catch-all — SignUpViewPage (Better Auth)]
│
├── [locale]/                                      [Locale route group — en | id]
│   ├── layout.tsx                                 [LocaleLayout — validates locale, sets lang, next-intl provider]
│   │
│   └── dashboard/                                 [Protected: requires authentication]
│       ├── layout.tsx                             [DashboardLayout — sidebar, header, kbar, infobar]
│       ├── page.tsx                               [Session check → redirect to /dashboard/overview]
│       │
│       ├── overview/                              [Dashboard home — parallel route slots]
│       │   ├── layout.tsx                         [OverViewLayout — renders @sales, @bar_stats, @area_stats, @pie_stats]
│       │   ├── page.tsx                           [Returns null (layout renders slots)]
│       │   ├── loading.tsx                        [Skeleton UI for the overview page]
│       │   ├── error.tsx                          [Error boundary for overview]
│       │   ├── @sales/
│       │   │   ├── page.tsx                       [Sales chart — async, 3s delay]
│       │   │   ├── loading.tsx                    [RecentSalesSkeleton]
│       │   │   ├── error.tsx                      [SalesError alert]
│       │   │   └── default.tsx                    [null]
│       │   ├── @bar_stats/
│       │   │   ├── page.tsx                       [Bar graph — async, 1s delay]
│       │   │   ├── loading.tsx                    [null]
│       │   │   ├── error.tsx                      [null]
│       │   │   └── default.tsx                    [null]
│       │   ├── @area_stats/
│       │   │   ├── page.tsx                       [Area graph — async, 2s delay]
│       │   │   ├── loading.tsx                    [null]
│       │   │   ├── error.tsx                      [null]
│       │   │   └── default.tsx                    [null]
│       │   └── @pie_stats/
│       │       ├── page.tsx                       [Pie graph — async, 1s delay]
│       │       ├── loading.tsx                    [null]
│       │       ├── error.tsx                      [null]
│       │       └── default.tsx                    [null]
│       │
│       ├── product/
│       │   ├── page.tsx                           [Product listing — React Query + nuqs table]
│       │   └── [productId]/page.tsx               [Product detail/create — prefetch via React Query]
│       │
│       ├── users/
│       │   └── page.tsx                           [User listing — React Query + nuqs table]
│       │
│       ├── kanban/
│       │   └── page.tsx                           [Kanban board view]
│       │
│       ├── chat/
│       │   └── page.tsx                           [Chat interface]
│       │
│       ├── notifications/
│       │   └── page.tsx                           [Notifications page]
│       │
│       ├── billing/
│       │   └── page.tsx                           [Billing & plans — org-gated via useSession]
│       │
│       ├── forms/
│       │   ├── page.tsx                           [Redirects to /dashboard/forms/basic]
│       │   ├── basic/page.tsx                     [Basic form — all field types demo]
│       │   ├── advanced/page.tsx                  [Advanced form patterns]
│       │   ├── multi-step/page.tsx                [Multi-step wizard form]
│       │   └── sheet-form/page.tsx                [Sheet/dialog form patterns]
│       │
│       ├── elements/icons/
│       │   └── page.tsx                           [Icons gallery]
│       │
│       ├── exclusive/
│       │   └── page.tsx                           [Exclusive area — pro-plan gated]
│       │
│       ├── profile/[[...profile]]/
│       │   └── page.tsx                           [User profile — optional catch-all]
│       │
│       ├── react-query/
│       │   └── page.tsx                           [React Query demo — server prefetch + hydration]
│       │
│       └── workspaces/
│           ├── page.tsx                           [Organization list/switcher]
│           └── team/[[...rest]]/page.tsx          [Team management — optional catch-all]
│
└── api/
    ├── auth/[...all]/route.ts                    [Better Auth handler — POST + GET proxied to better-auth]
    ├── products/
    │   ├── route.ts                               [GET list + POST create — mock data]
    │   └── [id]/route.ts                          [GET + PUT + DELETE single product — mock data]
    └── users/
        ├── route.ts                               [GET list + POST create — mock data]
        └── [id]/route.ts                          [PUT + DELETE single user — mock data]
```

---

## 2. Layout Hierarchy

```
RootLayout (src/app/layout.tsx)
  ├── Sets <html>, fonts, data-theme
  ├── ThemeScript + ThemeProvider (class-based dark/light/system)
  ├── NuqsAdapter (URL search params state)
  ├── Providers (query client, auth, sentry, posthog)
  ├── NextTopLoader (app-level loading bar)
  ├── Sonner Toaster (notifications)
  │
  ├── [Root page] → session check → redirects to /auth/sign-in or /dashboard
  │
  ├── [Static pages: about, privacy-policy, terms-of-service]
  │   └── No special layout wraps them (inherits RootLayout only)
  │
  ├── AuthLayout (src/app/auth/layout.tsx)
  │   ├── Sets robots: noindex
  │   ├── Passthrough (renders children directly)
  │   │
  │   ├── /auth → redirects to /auth/sign-in
  │   ├── /auth/sign-in → SignInViewPage
  │   └── /auth/sign-up → SignUpViewPage
  │
  ├── LocaleLayout (src/app/[locale]/layout.tsx)
  │   ├── Validates locale (en|id), otherwise 404
  │   ├── Sets <html lang> via client script
  │   ├── Sets theme-color meta via client script
  │   ├── NextIntlClientProvider (i18n messages)
  │   │
  │   └── DashboardLayout (src/app/[locale]/dashboard/layout.tsx)
  │       ├── KBar provider (command palette)
  │       ├── SidebarProvider (persisted state via cookie)
  │       ├── AppSidebar (navigation)
  │       ├── SidebarInset
  │       │   ├── Header (top bar)
  │       │   ├── LocaleLoadingBar
  │       │   └── InfobarProvider
  │       │       ├── {children}
  │       │       └── InfoSidebar (right panel)
  │       │
  │       └── Dashboard pages...
```

---

## 3. Component Imports Per Page

| Route                            | Component Import                                                                  | Key Features                                                |
| -------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `/`                              | inline session check                                                              | Checks `auth.api.getSession`, redirects based on auth state |
| `/auth/sign-in`                  | `SignInViewPage` from `@/features/auth/components/sign-in-view`                   | Better Auth sign-in                                         |
| `/auth/sign-up`                  | `SignUpViewPage` from `@/features/auth/components/sign-up-view`                   | Better Auth sign-up                                         |
| `/dashboard/overview`            | Parallel routes: `@sales`, `@bar_stats`, `@area_stats`, `@pie_stats`              | Async with artificial delays, per-slot loading/error        |
| `/dashboard/product`             | `ProductListingPage` from `@/features/products/components/product-listing`        | React Query + nuqs table                                    |
| `/dashboard/product/[productId]` | `ProductViewPage` from `@/features/products/components/product-view-page`         | Server prefetch via `prefetchQuery`, `HydrationBoundary`    |
| `/dashboard/users`               | `UserListingPage` from `@/features/users/components/user-listing`                 | React Query + nuqs table                                    |
| `/dashboard/kanban`              | `KanbanViewPage` from `@/features/kanban/components/kanban-view-page`             | Kanban board                                                |
| `/dashboard/chat`                | `ChatViewPage` from `@/features/chat/components/chat-view-page`                   | Chat interface                                              |
| `/dashboard/notifications`       | `NotificationsPage` from `@/features/notifications/components/notifications-page` | Notifications list                                          |
| `/dashboard/billing`             | Inline (client component)                                                         | Uses `useSession` hook, gated by `activeOrganizationId`     |
| `/dashboard/forms/basic`         | `DemoForm` from `@/components/forms/demo-form`                                    | All field types                                             |
| `/dashboard/forms/advanced`      | `AdvancedFormPatterns` from `@/features/forms/components/advanced-form-patterns`  | Async validation, dynamic rows                              |
| `/dashboard/forms/multi-step`    | `FormsShowcasePage` from `@/features/forms/components/forms-showcase-page`        | Wizard pattern                                              |
| `/dashboard/forms/sheet-form`    | `SheetFormDemo` from `@/features/forms/components/sheet-form-demo`                | Sheet/dialog forms                                          |
| `/dashboard/elements/icons`      | `IconsViewPage` from `@/features/elements/components/icons-view-page`             | Icon gallery                                                |
| `/dashboard/exclusive`           | Inline (client component)                                                         | Uses `useSession`, gated by `isPro` (TODO: Stripe)          |
| `/dashboard/profile`             | `ProfileViewPage` from `@/features/profile/components/profile-view-page`          | User profile                                                |
| `/dashboard/react-query`         | `PokemonInfo` from `@/features/react-query-demo/components/pokemon-info`          | Server prefetch + Suspense                                  |
| `/dashboard/workspaces`          | `OrganizationList` from `@/features/auth/components/organization-list`            | Better Auth orgs                                            |
| `/dashboard/workspaces/team`     | `TeamManagement` from `@/features/auth/components/team-management`                | Team members, roles                                         |

---

## 4. API Routes

| Endpoint             | Methods                   | Implementation                                                                                 |
| -------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `/api/auth/[...all]` | GET, POST                 | Proxied to `better-auth` via `toNextJsHandler(auth)`                                           |
| `/api/products`      | GET (list), POST (create) | Mock data via `fakeProducts` — supports `page`, `limit`, `categories`, `search`, `sort` params |
| `/api/products/[id]` | GET, PUT, DELETE          | Mock data via `fakeProducts` — returns 404 if not found                                        |
| `/api/users`         | GET (list), POST (create) | Mock data via `fakeUsers` — supports `page`, `limit`, `roles`, `search`, `sort` params         |
| `/api/users/[id]`    | PUT, DELETE               | Mock data via `fakeUsers` — returns 404 if not found                                           |

**Pattern note:** API routes are documented with inline comments for three patterns:

1. Mock (current) — in-memory fake data
2. Fullstack ORM — replace with Drizzle/Prisma queries
3. BFF proxy — replace with `fetch()` to external backend

---

## 5. Internationalization

| File                     | Purpose                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `src/i18n/routing.ts`    | Defines `locales: ['en', 'id']`, `defaultLocale: 'en'`, `localePrefix: 'as-needed'` |
| `src/i18n/navigation.ts` | Creates `Link`, `redirect`, `usePathname`, `useRouter` with i18n awareness          |
| `src/i18n/request.ts`    | Provides per-request locale detection and message loading                           |
| `next.config.ts`         | Wraps config with `createNextIntlPlugin('./src/i18n/request.ts')`                   |

**Locale routing behavior:**

- `localePrefix: 'as-needed'` → default locale (`en`) requires no prefix, `id` requires `/id/...`
- `[locale]` is a catch-all dynamic segment but validated inside `LocaleLayout`
- If locale is not `en` or `id`, the layout calls `notFound()`
- `setRequestLocale()` enables static rendering per locale

---

## 6. Route Protection and Auth Patterns

### 6.1 Server-side session checks

Pages that check `auth.api.getSession()` and redirect:

- `src/app/page.tsx` — Root: redirects to `/auth/sign-in` if no session, `/dashboard` if authenticated
- `src/app/[locale]/dashboard/page.tsx` — Dashboard root: same redirect pattern

### 6.2 Client-side session checks

Pages that use `useSession()` from `@/lib/auth-client`:

- `billing/page.tsx` — checks `session?.session?.activeOrganizationId`
- `exclusive/page.tsx` — checks `isPro` flag (TODO: integrate with Stripe)

### 6.3 Auth routes

- `auth/layout.tsx` — sets `robots: { index: false, follow: false }`
- `auth/page.tsx` — redirects to `/auth/sign-in`
- `auth/sign-in/[[...sign-in]]/page.tsx` — catch-all optional segment handles Better Auth sign-in flows
- `auth/sign-up/[[...sign-up]]/page.tsx` — same pattern for sign-up

### 6.4 Middleware

- **No `middleware.ts` file exists in the project.**
- i18n locale routing is handled entirely by `next-intl`'s plugin (`createNextIntlPlugin` in `next.config.ts`)
- Route protection is done per-page via server-side session checks or client-side `useSession` hooks

### 6.5 Dashboard layout protection

- The `DashboardLayout` doesn't check auth itself — individual pages or the dashboard `page.tsx` do
- This means layout-level redirect on auth failure is NOT implemented; it's page-level

---

## 7. Key File Structure Conventions

| Pattern            | Example                                                    | Purpose                                                  |
| ------------------ | ---------------------------------------------------------- | -------------------------------------------------------- |
| Catch-all optional | `[[...sign-in]]/page.tsx`                                  | Better Auth handles its own routing within the catch-all |
| Catch-all optional | `[[...profile]]/page.tsx`                                  | Profile view (future extensibility)                      |
| Catch-all optional | `[[...rest]]/page.tsx`                                     | Team management under workspaces                         |
| Dynamic segment    | `[productId]/page.tsx`                                     | Product detail page                                      |
| Parallel routes    | `@sales/`, `@bar_stats/`, etc.                             | Independent async data loading in overview               |
| Route groups       | `(auth)` would be equivalent but they use explicit `auth/` | No route grouping used for layouts                       |

---

## 8. Data Flow Patterns

```
User hits /dashboard/product
  → DashboardLayout renders (sidebar, header, kbar)
    → product/page.tsx
      → searchParamsCache.parse(searchParams)  [nuqs parses URL params]
      → PageContainer wraps title + description
        → ProductListingPage (client component)
          → uses useQuery from react-query
            → fetches from /api/products?page=1&limit=10
              → fakeProducts.getProducts() [mock data layer]

User hits /dashboard/product/5
  → DashboardLayout renders
    → product/[productId]/page.tsx
      → Server: prefetchQuery(productByIdOptions(5))
      → HydrationBoundary wraps
        → ProductViewPage (client component)
          → uses pre-filled cache from server

User hits /dashboard/overview
  → DashboardLayout renders
    → OverViewLayout renders
      → @sales/page.tsx (async, 3s delay)
      → @bar_stats/page.tsx (async, 1s delay)
      → @area_stats/page.tsx (async, 2s delay)
      → @pie_stats/page.tsx (async, 1s delay)
    → Each slot streams independently with its own loading/error states
```

---

## 9. Auth Data Flow

```
App startup:
  1. RootLayout → Providers (auth provider setup)
  2. Page load → checks cookies for session

Sign-in:
  /auth/sign-in → SignInViewPage → authClient.signIn()
    → POST /api/auth/[...all] (better-auth handler)
      → Better Auth validates credentials
        → Creates session, sets cookies, redirects to /dashboard

Session check (server):
  auth.api.getSession({ headers: await headers() })
    → Reads better-auth cookie from request headers
    → Returns session or null

Session check (client):
  useSession() from @/lib/auth-client
    → Uses better-auth/react client
    → Returns { data, isPending, error }
```

---

## 10. Key Observations for Porting

1. **Route protection is page-level, not layout-level.** The dashboard layout does not enforce auth — each page (or the dashboard root page) must check the session.

2. **Parallel routes in overview** are the most complex pattern — they independently stream data with per-slot loading/error/default states.

3. **The `[locale]` group wraps all dashboard routes.** Non-dashboard routes (auth, about, privacy-policy, terms-of-service) sit outside the locale group.

4. **Auth routes also sit outside the locale group** — sign-in/sign-up are not localized.

5. **Mock data layer** (`fakeProducts`, `fakeUsers`) lives in `@/constants/mock-api*` and supports pagination, search, sort, and filtering.

6. **React Query patterns** use server prefetch + `HydrationBoundary` for product detail and react-query demo pages.

7. **nuqs** is used for type-safe URL search params on listing pages (products, users).

8. **PageContainer** is a reusable wrapper component used across most dashboard pages — provides consistent layout with title, description, info sidebar trigger, and optional header actions.
