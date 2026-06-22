# Code Context: Frontend Stack

## Overview

Monorepo with a **Next.js 16** app (`apps/web`) + a **shared UI package** (`packages/ui`) leveraging **shadcn/ui Lyra style** (the newer Base UI-based variant). The UI package is published as `@admin-template/ui` and consumed by the web app.

---

## Files Retrieved

### App Layer (`apps/web/`)

| File                                         | Lines | Purpose                                                                                                                 |
| -------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| `apps/web/package.json`                      | 1-55  | Dependencies: Next.js 16, React 19, TanStack Query/Form, better-auth, next-themes, sonner, lucide-react, AI SDK         |
| `apps/web/src/app/layout.tsx`                | 1-45  | Root layout: Inter font, `<Providers>` wrapper, grid layout `grid-rows-[auto_1fr]` with header + children               |
| `apps/web/src/app/page.tsx`                  | 1-62  | Home page: ORPC health check query, shows API status indicator                                                          |
| `apps/web/src/app/dashboard/page.tsx`        | 1-30  | Dashboard: server-component with `authClient.getSession()`, redirect to `/login` if no session                          |
| `apps/web/src/app/dashboard/dashboard.tsx`   | 1-18  | Client component: ORPC `privateData` query                                                                              |
| `apps/web/src/app/ai/page.tsx`               | 1-75  | AI chat: `useChat` from `@ai-sdk/react`, `Streamdown` for streaming markdown                                            |
| `apps/web/src/app/login/page.tsx`            | 1-20  | Login page: toggle between SignInForm and SignUpForm                                                                    |
| `apps/web/src/components/providers.tsx`      | 1-28  | Client providers: next-themes `ThemeProvider`, `QueryClientProvider`, `TooltipProvider`, `Toaster` (sonner)             |
| `apps/web/src/components/theme-provider.tsx` | 1-16  | Thin wrapper around `next-themes`'s `ThemeProvider`                                                                     |
| `apps/web/src/components/mode-toggle.tsx`    | 1-38  | Dark/light/system toggle via `DropdownMenu` + `useTheme`                                                                |
| `apps/web/src/components/header.tsx`         | 1-30  | Top nav: Home/Dashboard/AI Chat links, `ModeToggle`, `UserMenu`                                                         |
| `apps/web/src/components/user-menu.tsx`      | 1-63  | Auth-aware user dropdown: `authClient.useSession()` → skeleton loading, sign in button, or dropdown with email/sign out |
| `apps/web/src/components/sign-in-form.tsx`   | 1-108 | `@tanstack/react-form` + Zod login form with email/password fields                                                      |
| `apps/web/src/components/sign-up-form.tsx`   | 1-126 | TanStack Form registration with name/email/password                                                                     |
| `apps/web/src/components/loader.tsx`         | 1-8   | Simple spinner using `Loader2` from lucide                                                                              |
| `apps/web/src/index.css`                     | 1-2   | Imports `@admin-template/ui/globals.css` + sources streamdown JS                                                             |
| `apps/web/src/utils/orpc.ts`                 | 1-41  | ORPC client setup: `createORPCClient` + `RPCLink` + `createTanstackQueryUtils`                                          |
| `apps/web/src/lib/auth-client.ts`            | 1-6   | `better-auth/react` client                                                                                              |
| `apps/web/next.config.ts`                    | 1-7   | `typedRoutes: true`, `reactCompiler: true`, transpile shiki                                                             |
| `apps/web/components.json`                   | 1-20  | shadcn config: style `base-lyra`, CSS in packages/ui, aliases pointing to `@admin-template/ui`                               |

### UI Package (`packages/ui/`)

| File                                   | Lines       | Purpose                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/package.json`             | 1-65        | Dependencies: Base UI React, TanStack Table/Form/Query, Tabler Icons, cmdk, recharts, date-fns, vaul, react-dropzone, react-number-format, etc.                                                                                                                                                                                                             |
| `packages/ui/src/styles/globals.css`   | 1-99        | **Tailwind v4 entry point**: `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`. Defines all CSS custom properties (light + dark) for colors, sidebar, charts, border radius. `@theme inline` block maps CSS vars to Tailwind theme. `@custom-variant dark (&:is(.dark *))`. Font: `"Inter Variable"`. Base layer styles. |
| `packages/ui/src/lib/utils.ts`         | 1-25        | `cn()` via clsx + tailwind-merge, `formatBytes()`                                                                                                                                                                                                                                                                                                           |
| `packages/ui/src/lib/query-client.ts`  | 1-21        | TanStack QueryClient factory with staleTime 60s, SSR-safe singleton                                                                                                                                                                                                                                                                                         |
| `packages/ui/src/lib/searchparams.ts`  | 1-16        | `nuqs` search params cache (page, perPage, sort, filters)                                                                                                                                                                                                                                                                                                   |
| `packages/ui/src/lib/parsers.ts`       | 1-85        | Zod schemas + nuqs parsers for sorting state and filter state (advanced filter support)                                                                                                                                                                                                                                                                     |
| `packages/ui/src/lib/data-table.ts`    | 1-59        | Common pinning styles, filter operators lookup, default filter operator, valid filters helper                                                                                                                                                                                                                                                               |
| `packages/ui/src/lib/api-client.ts`    | (exists)    | API client utilities                                                                                                                                                                                                                                                                                                                                        |
| `packages/ui/src/config/data-table.ts` | 1-36        | Data table config: operator definitions (text, numeric, date, select, boolean, multiSelect), sort orders, filter variants                                                                                                                                                                                                                                   |
| `packages/ui/src/types/data-table.ts`  | 1-44        | TypeScript types + `@tanstack/react-table` ColumnMeta augmentation                                                                                                                                                                                                                                                                                          |
| `packages/ui/src/components/`          | (60+ files) | All shadcn components (see below)                                                                                                                                                                                                                                                                                                                           |
| `packages/ui/src/hooks/`               | (8 files)   | Custom hooks (see below)                                                                                                                                                                                                                                                                                                                                    |
| `packages/ui/src/components/forms/`    | (13 files)  | TanStack Form integration (see below)                                                                                                                                                                                                                                                                                                                       |
| `packages/ui/docs/forms.md`            | 1-400+      | Comprehensive form system documentation                                                                                                                                                                                                                                                                                                                     |
| `packages/ui/postcss.config.mjs`       | 1-3         | `@tailwindcss/postcss` plugin                                                                                                                                                                                                                                                                                                                               |

---

## Key Code

### 1. Tailwind v4 CSS Architecture (`globals.css`)

Uses **Tailwind CSS v4** via `@import "tailwindcss"` (no more `tailwind.config.js` — it's all CSS-driven).

Key imports:

```css
@import "tailwindcss";
@import "tw-animate-css"; /* animation utilities */
@import "shadcn/tailwind.css"; /* shadcn Lyra preset */
@source "../../../apps/**/*.{ts,tsx}"; /* scans app for class usage */
@source "../**/*.{ts,tsx}";
```

Theme is defined entirely via CSS custom properties with `@theme inline`:

- Font: `--font-sans: "Inter Variable", sans-serif`
- Colors: `--color-primary`, `--color-secondary`, `--color-muted`, `--color-accent`, `--color-destructive`, etc.
- Sidebar colors: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.
- Chart colors: `--chart-1` through `--chart-5`
- Border radius: `--radius` (0.625rem) with `--radius-sm/md/lg/xl/2xl/3xl/4xl` computed from it

Dark mode via `.dark` class override of all CSS vars. Uses OKLCH color space.

### 2. shadcn Style: "base-lyra" (Base UI)

This is the **newer shadcn style** that uses **Base UI** (Radix's successor, `@base-ui/react`) instead of Radix Primitives.

Pattern visible in all components:

- Import from `@base-ui/react/<component>` (e.g., `@base-ui/react/button`, `@base-ui/react/dialog`, `@base-ui/react/menu`)
- Props extend the Base UI primitive's Props type
- `data-slot` attributes on all sub-components (shadcn's slot convention for styling)
- `cn()` for class merging, `cva()` for variants
- `useRender()` + `mergeProps()` from `@base-ui/react` for polymorphic rendering (seen in sidebar, badge, etc.)

Components using Base UI:

- `button.tsx` → `@base-ui/react/button`
- `dialog.tsx` → `@base-ui/react/dialog`
- `dropdown-menu.tsx` → `@base-ui/react/menu`
- `combobox.tsx` → `@base-ui/react` (Combobox)
- `sidebar.tsx` → uses `@base-ui/react/merge-props` + `@base-ui/react/use-render`
- `badge.tsx` → `useRender` + `mergeProps`
- `button-group.tsx` → `useRender` + `mergeProps`

Components using other primitives:

- `command.tsx` → `cmdk`
- `drawer.tsx` → `vaul`
- `carousel.tsx` → `embla-carousel-react`
- `chart.tsx` → `recharts`
- `calendar.tsx` → `react-day-picker`
- `select.tsx` → Base UI `@base-ui/react/select`
- `file-uploader.tsx` → `react-dropzone`

### 3. UI Components Inventory (60+)

Complete list from `packages/ui/src/components/`:

**Layout & Navigation:**

- `sidebar.tsx` (723 lines) — Comprehensive sidebar with Sheet (mobile), collapsible/icon/offcanvas variants, keyboard shortcut (Cmd+B), cookie-persisted state, `SidebarProvider` context, menu items/sub-items, skeleton states, tooltip support
- `breadcrumb.tsx`
- `navigation-menu.tsx`
- `tabs.tsx`
- `menubar.tsx`
- `pagination.tsx`

**Form Controls:**

- `button.tsx`, `button-group.tsx`
- `input.tsx`, `input-group.tsx`, `input-otp.tsx`
- `select.tsx`, `native-select.tsx`
- `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `toggle.tsx`, `toggle-group.tsx`
- `textarea.tsx`, `slider.tsx`
- `combobox.tsx` (297 lines) — Searchable multi-select with tags, clear, trigger
- `file-uploader.tsx` (295 lines) — Dropzone-based file upload with preview
- `field.tsx` (239 lines) — Field layout primitives (FieldSet, Field, FieldLabel, FieldError, FieldGroup, FieldSeparator, etc.)

**Overlays:**

- `dialog.tsx`, `alert-dialog.tsx`
- `drawer.tsx` (vaul)
- `sheet.tsx`
- `popover.tsx`, `hover-card.tsx`, `tooltip.tsx`
- `context-menu.tsx`
- `command.tsx` (cmdk command palette)
- `dropdown-menu.tsx`

**Data Display:**

- `table.tsx` (basic), `table/` (advanced data-table with filters, toolbar, column headers, date filter, slider filter, faceted filter, view options, pagination, skeleton)
- `chart.tsx` (373 lines) — Recharts wrapper with ChartConfig, ChartContainer, ChartTooltip, ChartLegend, dynamic CSS variable theming
- `card.tsx`, `badge.tsx`, `avatar.tsx`, `calendar.tsx`, `carousel.tsx`
- `empty.tsx` — Empty state composition
- `skeleton.tsx`, `spinner.tsx`
- `progress.tsx`, `separator.tsx`, `scroll-area.tsx`
- `collapsible.tsx`, `resizable.tsx`
- `accordion.tsx`, `aspect-ratio.tsx`
- `kbd.tsx` — Keyboard shortcut display
- `item.tsx` — Generic list item

**Icons:**

- `icons.tsx` (226 lines) — Re-exports Tabler Icons as `Icons` object (Icons.search, Icons.user, etc.)
- Primary icon library: **Tabler Icons** (`@tabler/icons-react`) via `icons.tsx`
- Secondary: **Lucide React** available in both packages

**Utility:**

- `sonner.tsx` — Toast wrapper with theme-aware styling, custom icons
- `direction.tsx` — RTL/LTR direction context
- `label.tsx`

### 4. Form System (TanStack Form + shadcn)

A well-documented, three-layer form architecture:

**Layer 1: Field Components** (`forms/fields/*`)

- Base fields: `text-field.tsx`, `textarea-field.tsx`, `select-field.tsx`, `checkbox-field.tsx`, `switch-field.tsx`, `radio-group-field.tsx`, `slider-field.tsx`, `file-upload-field.tsx`, `number-field.tsx`
- Each exports both a raw `<XxxField>` (render-prop compatible) and a composed `<FormXxxField>` (flat API)

**Layer 2: Form Context** (`forms/form-context.tsx`)

- Creates TanStack Form contexts (`fieldContext`, `formContext`, `useFieldContext`, `useFormContext`)
- Enhanced `useFieldContext()` with accessibility IDs (`formItemId`, `formDescriptionId`, `formMessageId`)
- `createFormField()` — wraps any field component into a flat `FormXxxField` that handles `form.Field` wiring internally
- `FieldConfig`, `FieldValidatorConfig`, `FieldListenerConfig` types
- `FormFieldSet`, `FormField`, `FormFieldError`, `FormErrors` structural components
- `scrollToFirstError()` utility
- `typedField()` — narrows `name` prop to `DeepKeys<TValues>` for type-safety

**Layer 3: TanStack Form Hook** (`forms/tanstack-form.tsx`)

- `useAppForm()` — pre-wired `createFormHook()` with all field and form components
- `useFormFields<TValues>()` — returns composed fields with type-safe `name` props
- `withForm()` HOC, `withFieldGroup()` HOC
- `Form`, `SubmitButton`, `StepButton` form-level components

**Usage patterns:**

1. **Flat pattern** (recommended): `form.FormTextField`, `form.FormSelectField` etc.
2. **AppField pattern**: `form.AppField` with render-prop for custom inputs
3. **Array fields** via `mode='array'` on AppField

**Validation:** Field-level (onChange/onBlur/onSubmit sync + async), form-level (Zod superRefine), linked validation (onChangeListenTo)

**Multi-step forms:** `useFormStepper` hook in `hooks/use-stepper.tsx`

### 5. Data Table System

Full-featured client-side data table built on `@tanstack/react-table`:

- **`useDataTable` hook** (`hooks/use-data-table.ts`) — Integrates with `nuqs` for URL-persisted state (page, perPage, sorting, column filters), debounced filter updates, pagination, faceted filtering
- **Server-side patterns** via `searchParams.ts` (nuqs server utils) + `parsers.ts` (Zod schemas for sort/filter parsing)
- **Table UI components** (`components/table/`): `data-table.tsx`, `data-table-toolbar.tsx`, `data-table-pagination.tsx`, `data-table-column-header.tsx`, `data-table-faceted-filter.tsx`, `data-table-date-filter.tsx`, `data-table-slider-filter.tsx`, `data-table-view-options.tsx`, `data-table-skeleton.tsx`
- **Config** (`config/data-table.ts`): Operator definitions for text, numeric, date, select, boolean, multiSelect filters
- **Types** (`types/data-table.ts`): `ExtendedColumnFilter`, `ExtendedColumnSort`, `DataTableRowAction`, `Option` — augments `ColumnMeta` with label, variant, options, icon, range
- **Utilities** (`lib/data-table.ts`): `getCommonPinningStyles()`, `getFilterOperators()`, `getValidFilters()`

### 6. Theming & Dark Mode

- **next-themes** for theme management (light/dark/system)
- `ThemeProvider` wraps `NextThemesProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- `ModeToggle` component uses `DropdownMenu` to switch between Light/Dark/System
- Dark mode CSS: `.dark` class overrides all CSS custom properties on `<html>`
- **Sonner toasts** auto-theme via `next-themes` with custom icons per variant
- **Charts** use dynamic CSS variable injection via `ChartStyle` component (generates `--color-${key}` per theme)

### 7. API / RPC Integration

- **ORPC** (`@orpc/client`, `@orpc/server`, `@orpc/tanstack-query`) — type-safe RPC framework
- `orpc.ts` creates client with `RPCLink` pointing to `NEXT_PUBLIC_SERVER_URL/rpc`
- `createTanstackQueryUtils(client)` produces typed query hooks like `orpc.healthCheck.queryOptions()`
- TanStack Query with global error toast handler (`QueryCache.onError`)

### 8. Authentication

- **better-auth** (via `@admin-template/auth`) — `authClient` in `lib/auth-client.ts`
- `authClient.useSession()` React hook for session state
- Server-side `authClient.getSession()` in dashboard page (renders conditionally)
- Sign-in and sign-up forms call `authClient.signIn.email()` / `authClient.signUp.email()`

### 9. Other Notable Dependencies

| Lib                              | Usage                                                                  |
| -------------------------------- | ---------------------------------------------------------------------- |
| `@tanstack/react-query`          | Data fetching via ORPC                                                 |
| `@tanstack/react-form`           | Form state management                                                  |
| `@tanstack/react-table`          | Data tables                                                            |
| `@tanstack/react-query-devtools` | Dev mode only                                                          |
| `zod`                            | Validation for forms, URL params                                       |
| `clsx` + `tailwind-merge`        | Class merging                                                          |
| `class-variance-authority` (cva) | Component variant APIs                                                 |
| `date-fns`                       | Date formatting                                                        |
| `nuqs`                           | URL query state (page, sorting, filters)                               |
| `next-intl`                      | Internationalization (available but not heavily used yet in app pages) |
| `recharts`                       | Charts                                                                 |
| `vaul`                           | Drawer (mobile-friendly)                                               |
| `cmdk`                           | Command palette                                                        |
| `embla-carousel-react`           | Carousel                                                               |
| `lucide-react`                   | Secondary icons (used alongside Tabler)                                |
| `@tabler/icons-react`            | Primary icon set (via `icons.tsx`)                                     |
| `@radix-ui/react-icons`          | Available but less used                                                |
| `streamdown`                     | Streaming markdown rendering (AI chat)                                 |
| `@ai-sdk/react`                  | AI chat SDK                                                            |
| `input-otp`                      | OTP input                                                              |
| `react-number-format`            | Numeric field formatting                                               |
| `react-resizable-panels`         | Split panels                                                           |
| `tw-animate-css`                 | Tailwind CSS animation utilities                                       |

### 10. App Page Structure

```
/ (Home)          → Server component, displays health check status
/dashboard        → Protected (auth redirect), shows user name + private data
/login            → SignInForm ↔ SignUpForm toggle
/ai               → AI chat interface with streaming markdown
```

Layout: `grid-rows-[auto_1fr] h-svh` (header on top, content fills remaining height)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  apps/web (Next.js 16, React 19, TypeScript)                        │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ Pages        │  │ Components   │  │ Lib / Utils               │  │
│  │ (app router) │  │ - providers  │  │ - auth-client (better-auth)│  │
│  │ - /          │  │ - theme-prov │  │ - orpc (ORPC + TanStack Q)│  │
│  │ - /dashboard │  │ - mode-toggle│  └───────────────────────────┘  │
│  │ - /login     │  │ - header     │                                 │
│  │ - /ai        │  │ - user-menu  │                                 │
│  └─────────────┘  │ - sign-in/up │                                 │
│                   └──────────────┘                                 │
│                                                                     │
│  Imports @admin-template/ui for all components                    │
│  Imports @admin-template/env for config                           │
│  Imports @admin-template/api for types/RPC                        │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  packages/ui (shadcn Lyra, Base UI, Tailwind v4)                    │
│                                                                     │
│  styles/globals.css  ←── Tailwind v4 + shadcn preset + CSS vars    │
│                                                                     │
│  components/         60+ shadcn components (all Base UI-based)     │
│    ├── forms/        TanStack Form integration (9 field types)     │
│    └── table/        Advanced data-table with filters, sorting     │
│                                                                     │
│  hooks/              8 hooks (use-mobile, use-data-table,          │
│                       use-stepper, use-debounce, etc.)             │
│                                                                     │
│  lib/                Utilities (cn, query-client, data-table,      │
│                      parsers, searchparams)                        │
│                                                                     │
│  config/             Data table operator config                    │
│  types/              Data table TypeScript types                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Page (Server/Client) → Component → ORPC Client → RPCLink → Server /rpc
                                                                  ↓
                                                      TanStack Query Cache
                                                                  ↓
                                                     React re-render
```

- **Auth flow:** `better-auth` handles sessions server-side; `authClient.useSession()` on client
- **Forms:** TanStack Form → field validation (Zod) → `authClient.signIn/signUp` or ORPC mutations
- **AI Chat:** `useChat` from `@ai-sdk/react` → `DefaultChatTransport` → `NEXT_PUBLIC_SERVER_URL/ai`

---

## Design System Patterns

1. **Consistent radius:** All components use `rounded-none` (sharp corners, `--radius` only for dialog/popover). This is the Lyra "no rounded corners" aesthetic.

2. **Data-slot attributes:** Every component uses `data-slot="component-name"` for targeted styling, enabling the shadcn slot-based CSS convention.

3. **CVA variants:** All stateful components define variants via `class-variance-authority` with `defaultVariants`.

4. **Composition pattern:** Base UI primitives wrapped by shadcn components = app-facing API. The app code never imports from `@base-ui/react` directly.

5. **Re-exported icons:** Tabler icons centralized in `icons.tsx` as `Icons` object (tree-shakable, consistent access pattern).

6. **Typed forms:** `useFormFields<TValues>()` provides compile-time field name safety.

7. **URL state:** Tables use `nuqs` to persist page/sort/filter in URL query params (shareable, back-button friendly).

8. **Dark mode via class:** CSS custom properties swapped under `.dark` class, managed by `next-themes`.

---

## Start Here

1. **`packages/ui/src/styles/globals.css`** — The single source of truth for all theming, colors, and the Tailwind v4 config. Understand this first to know what CSS variables and design tokens are available.

2. **`packages/ui/src/components/button.tsx`** — Representative example of the Lyra/Base UI pattern used across all 60+ components.

3. **`packages/ui/src/components/forms/tanstack-form.tsx`** — The form system entry point; most new features will involve forms.

4. **`apps/web/src/app/layout.tsx`** — Root layout showing how the app wires providers, fonts, and grid structure.

5. **`packages/ui/components.json`** — shadcn configuration showing component aliases and style choices.

---

## Risks & Constraints

- **Tailwind v4** — requires `@tailwindcss/postcss` plugin; no legacy `tailwind.config.js` support. All customization is in `globals.css` via `@theme` and `@config`.
- **Base UI** is newer than Radix Primitives; fewer community examples and potential API instability.
- **Monorepo CSS source scanning** (`@source "../../../apps/**/*.{ts,tsx}"`) — Tailwind v4 dynamically scans for class usage; adding new packages requires updating `@source` directives.
- **Forms** require `@tanstack/react-form` v1, which has a different API than v0.
- **Icons** from two libraries (Tabler + Lucide) could cause inconsistency; use `icons.tsx` exports preferentially.
