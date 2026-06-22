# Dashboard Shell Analysis — `next-shadcn-dashboard-starter`

## Files Retrieved

| #   | File                                           | Lines  | Purpose                                                              |
| --- | ---------------------------------------------- | ------ | -------------------------------------------------------------------- |
| 1   | `src/app/[locale]/dashboard/layout.tsx`        | 1-30   | Dashboard root layout (server component)                             |
| 2   | `src/components/layout/app-sidebar.tsx`        | 1-147  | Main sidebar navigation component                                    |
| 3   | `src/components/layout/header.tsx`             | 1-32   | Top header bar                                                       |
| 4   | `src/components/ui/sidebar.tsx`                | 1-420  | shadcn/ui sidebar primitives (provider, sidebar, trigger, etc.)      |
| 5   | `src/config/nav-config.ts`                     | 1-155  | Navigation configuration with RBAC support                           |
| 6   | `src/types/index.ts`                           | 1-40   | TypeScript types: `NavItem`, `NavGroup`, `PermissionCheck`           |
| 7   | `src/hooks/use-nav.ts`                         | 1-127  | RBAC filtering hooks (`useFilteredNavItems`, `useFilteredNavGroups`) |
| 8   | `src/hooks/use-mobile.tsx`                     | 1-19   | `useIsMobile` hook (768px breakpoint)                                |
| 9   | `src/hooks/use-media-query.ts`                 | 1-18   | `useMediaQuery` hook (768px breakpoint)                              |
| 10  | `src/hooks/use-breadcrumbs.tsx`                | 1-34   | Breadcrumb generation from pathname                                  |
| 11  | `src/components/breadcrumbs.tsx`               | 1-34   | Breadcrumb UI component                                              |
| 12  | `src/components/layout/providers.tsx`          | 1-14   | Client providers wrapper (ActiveTheme + Query)                       |
| 13  | `src/components/layout/page-container.tsx`     | 1-79   | Page wrapper with loading, access control, heading                   |
| 14  | `src/components/layout/info-sidebar.tsx`       | 1-62   | Right info sidebar panel                                             |
| 15  | `src/components/ui/infobar.tsx`                | 1-400+ | shadcn/ui infobar primitives (parallel to sidebar)                   |
| 16  | `src/components/themes/theme-provider.tsx`     | 1-5    | `next-themes` ThemeProvider wrapper                                  |
| 17  | `src/components/themes/theme-mode-toggle.tsx`  | 1-48   | Dark/light toggle with ViewTransition                                |
| 18  | `src/components/themes/theme-selector.tsx`     | 1-42   | Active theme dropdown selector                                       |
| 19  | `src/components/themes/active-theme.tsx`       | 1-58   | Active theme context + cookie persistence                            |
| 20  | `src/components/themes/theme.config.ts`        | 1-42   | Theme list (10 themes, default "vercel")                             |
| 21  | `src/components/themes/theme-script.tsx`       | 1-45   | Inline script to prevent FOUC                                        |
| 22  | `src/components/kbar/index.tsx`                | 1-69   | Cmd+K command palette provider                                       |
| 23  | `src/components/kbar/use-theme-switching.tsx`  | 1-46   | KBar theme actions (cycle, toggle, set)                              |
| 24  | `src/components/layout/locale-switcher.tsx`    | 1-85   | Locale switcher (en/id)                                              |
| 25  | `src/components/layout/locale-loading-bar.tsx` | 1-20   | Top loading bar during locale transition                             |
| 26  | `src/components/org-switcher.tsx`              | 1-190  | Organization switcher in sidebar header                              |
| 27  | `src/components/nav-main.tsx`                  | 1-58   | Alternative nav-main component (unused in app-sidebar)               |
| 28  | `src/components/nav-user.tsx`                  | 1-101  | Alternative user nav (unused in app-sidebar)                         |
| 29  | `src/components/nav-projects.tsx`              | 1-86   | Project list component (unused in app-sidebar)                       |
| 30  | `src/components/user-avatar-profile.tsx`       | 1-30   | Avatar + optional name/email                                         |
| 31  | `src/components/search-input.tsx`              | 1-22   | Search button opening KBar                                           |
| 32  | `src/app/layout.tsx`                           | 1-56   | Root layout: ThemeScript + ThemeProvider + Providers                 |
| 33  | `src/app/[locale]/layout.tsx`                  | 1-47   | Locale layout: next-intl provider                                    |

---

## Architecture Overview

```
RootLayout (app/layout.tsx)
  ├── ThemeScript (inline script, prevents FOUC)
  ├── NuqsAdapter
  ├── ThemeProvider (next-themes, class strategy)
  │   └── Providers (ActiveThemeProvider + QueryProvider)
  │       ├── NextTopLoader (page transition progress bar)
  │       ├── Toaster (sonner toasts)
  │       └── LocaleLayout (next-intl)
  │           └── DashboardLayout (app/[locale]/dashboard/layout.tsx)
  │               ├── KBar (Cmd+K palette provider)
  │               ├── SidebarProvider (sidebar state + cookie persistence)
  │               │   ├── AppSidebar (collapsible='icon')
  │               │   └── SidebarInset
  │               │       ├── Header
  │               │       │   ├── SidebarTrigger (toggle button)
  │               │       │   ├── Breadcrumbs
  │               │       │   ├── SearchInput (opens KBar)
  │               │       │   ├── LocaleSwitcher
  │               │       │   ├── ThemeModeToggle (dark/light)
  │               │       │   ├── ThemeSelector (active theme)
  │               │       │   └── NotificationCenter
  │               │       ├── LocaleLoadingBar
  │               │       ├── InfobarProvider
  │               │       │   ├── {children} (page content)
  │               │       │   └── InfoSidebar (right)
```

---

## 1. Dashboard Layout Structure

**File:** `src/app/[locale]/dashboard/layout.tsx` (lines 1-30)

Key characteristics:

- **Server component** — uses `cookies()` from `next/headers` to persist sidebar state
- Reads `sidebar_state` cookie to determine `defaultOpen`
- Wraps everything in three nested providers:
  1. `KBar` — command palette
  2. `SidebarProvider` — sidebar state context + cookie sync
  3. `InfobarProvider` — right info sidebar state
- Layout is `SidebarProvider > AppSidebar + SidebarInset(Header + content + InfoSidebar)`

```tsx
// Core layout skeleton
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

---

## 2. Sidebar / Navigation Components

### 2a. `AppSidebar` — Main Navigation (`src/components/layout/app-sidebar.tsx`)

- **Client component** (`'use client'`)
- Uses `Sidebar collapsible='icon'` — supports icon-only collapsed state
- Uses `useFilteredNavGroups(navGroups)` for RBAC filtering
- Has three sections:
  1. **`SidebarHeader`** — `OrgSwitcher` (organization selector with dropdown)
  2. **`SidebarContent`** — Iterates `filteredGroups`, each group renders:
     - `SidebarGroupLabel` (optional, hidden when empty string)
     - `SidebarMenu` with items. Two item types:
       - **Leaf items** — `SidebarMenuButton` with icon + Link
       - **Collapsible items** (have `items[]`) — `Collapsible` with `CollapsibleTrigger` + `CollapsibleContent` containing `SidebarMenuSub`
  3. **`SidebarFooter`** — User dropdown with avatar, profile/billing/notifications links, sign out
- Uses `pathname` to highlight active item via `isActive` prop
- Has `SidebarRail` — the narrow hover/click strip that toggles sidebar

### 2b. Sidebar Primitives (`src/components/ui/sidebar.tsx`)

Full shadcn/ui sidebar implementation. Key exports:

| Export              | Purpose                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `SidebarProvider`   | Context provider, manages `open`/`openMobile` state, keyboard shortcut (`⌘B`), cookie persistence (`sidebar_state`) |
| `Sidebar`           | Desktop/mobile responsive container. `collapsible` prop: `'offcanvas' \| 'icon' \| 'none'`                          |
| `SidebarTrigger`    | Button calling `toggleSidebar()`                                                                                    |
| `SidebarRail`       | Narrow toggle strip                                                                                                 |
| `SidebarInset`      | Main content area, adjusts margin when sidebar collapses                                                            |
| `SidebarMenuButton` | Nav item with tooltip support (shows on collapsed sidebar)                                                          |
| `useSidebar`        | Hook for `{ state, open, setOpen, isMobile, toggleSidebar }`                                                        |

**Constants:**

```ts
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SIDEBAR_WIDTH = "16rem"; // ~256px
const SIDEBAR_WIDTH_MOBILE = "18rem"; // ~288px
const SIDEBAR_WIDTH_ICON = "3rem"; // ~48px
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
```

### 2c. Unused / Template Components

- **`nav-main.tsx`** — Alternative nav with `Platform` group + collapsible items (not imported anywhere)
- **`nav-user.tsx`** — User dropdown with avatar/name/email (uses `useSidebar`, not imported)
- **`nav-projects.tsx`** — Project list with context menu actions (uses `useSidebar`, not imported)

These exist from the shadcn/ui template but `AppSidebar` reimplements everything inline.

---

## 3. Navigation Configuration

**File:** `src/config/nav-config.ts` (lines 1-155)

Three nav groups:

### Overview Group (label: `'Overview'`)

| Item       | URL                          | Icon        | Shortcut | Access                 |
| ---------- | ---------------------------- | ----------- | -------- | ---------------------- |
| Dashboard  | `/dashboard/overview`        | `dashboard` | `d d`    | —                      |
| Workspaces | `/dashboard/workspaces`      | `workspace` | —        | —                      |
| Teams      | `/dashboard/workspaces/team` | `teams`     | —        | `{ requireOrg: true }` |
| Product    | `/dashboard/product`         | `product`   | `p p`    | —                      |
| Users      | `/dashboard/users`           | `teams`     | `u u`    | —                      |
| Kanban     | `/dashboard/kanban`          | `kanban`    | `k k`    | —                      |
| Chat       | `/dashboard/chat`            | `chat`      | `c c`    | —                      |

### Elements Group (label: `'Elements'`)

| Item        | URL                         | Icon      | Shortcut | Children                                                  |
| ----------- | --------------------------- | --------- | -------- | --------------------------------------------------------- |
| Forms       | `#`                         | `forms`   | —        | Basic Form, Multi-Step, Sheet & Dialog, Advanced Patterns |
| React Query | `/dashboard/react-query`    | `code`    | —        | —                                                         |
| Icons       | `/dashboard/elements/icons` | `palette` | —        | —                                                         |

### Ungrouped / Account Group (label: `''` — renders no label)

| Item    | URL | Icon      | Children                                                        |
| ------- | --- | --------- | --------------------------------------------------------------- |
| Pro     | `#` | `pro`     | Exclusive                                                       |
| Account | `#` | `account` | Profile, Notifications, Billing (`{ requireOrg: true }`), Login |

### RBAC Support

Each `NavItem` can have an `access` property:

```ts
interface PermissionCheck {
	permission?: string;
	plan?: string;
	feature?: string;
	role?: string;
	requireOrg?: boolean;
}
```

Filtered client-side via `useFilteredNavGroups`/`useFilteredNavItems` in `src/hooks/use-nav.ts`.

---

## 4. Header Components

**File:** `src/components/layout/header.tsx` (lines 1-32)

```tsx
<header className="bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14">
	{/* Left side */}
	<div className="flex items-center gap-2 px-4">
		<SidebarTrigger className="-ml-1" />
		<Separator orientation="vertical" className="mr-2 h-4" />
		<Breadcrumbs />
	</div>

	{/* Right side */}
	<div className="flex items-center gap-2 px-4">
		<div className="hidden md:flex">
			<SearchInput />
		</div>
		<LocaleSwitcher />
		<ThemeModeToggle />
		<div className="hidden sm:block">
			<ThemeSelector />
		</div>
		<NotificationCenter />
	</div>
</header>
```

Key details:

- **Sticky** top header with backdrop blur
- Desktop: `h-14`, smaller screens: `h-16`
- Left: sidebar toggle button + separator + breadcrumbs
- Right: search (hidden below md), locale switcher, theme mode toggle, theme selector (hidden below sm), notifications

### Supporting header components:

| Component            | File                                                        | Role                                                              |
| -------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| `Breadcrumbs`        | `src/components/breadcrumbs.tsx`                            | Renders breadcrumb trail from `useBreadcrumbs`                    |
| `useBreadcrumbs`     | `src/hooks/use-breadcrumbs.tsx`                             | Generates breadcrumbs from pathname (with custom mapping support) |
| `SearchInput`        | `src/components/search-input.tsx`                           | Button labeled "Search..." that opens KBar (`⌘K`)                 |
| `LocaleSwitcher`     | `src/components/layout/locale-switcher.tsx`                 | Dropdown for `en`/`id` locale switching with loading bar          |
| `ThemeModeToggle`    | `src/components/themes/theme-mode-toggle.tsx`               | Toggles dark/light mode with ViewTransition API                   |
| `ThemeSelector`      | `src/components/themes/theme-selector.tsx`                  | Dropdown to select active CSS theme (10 options)                  |
| `NotificationCenter` | `src/features/notifications/components/notification-center` | Notifications bell                                                |
| `CtaGithub`          | `src/components/layout/cta-github.tsx`                      | GitHub link button                                                |

---

## 5. Theme Switching

The project has a **dual theme system**: a dark/light mode toggle AND a set of visual theme presets.

### Layer 1: Dark/Light Mode (`next-themes`)

- **Provider:** `src/components/themes/theme-provider.tsx` — wraps `next-themes`'s `ThemeProvider`
- **Root config:** `app/layout.tsx` sets `attribute='class'`, `defaultTheme='system'`, `enableSystem`
- **Toggle:** `ThemeModeToggle` — toggles `resolvedTheme` between `dark`/`light`. On supporting browsers, uses `document.startViewTransition()` for a smooth crossfade. Keyboard shortcut: `D D`
- **FOUC prevention:** `ThemeScript` — inline script in `<head>` that reads `localStorage.theme` and applies class before paint

### Layer 2: Active Theme Presets (CSS variables)

- **Context:** `ActiveThemeProvider` (`src/components/themes/active-theme.tsx`) — stores `activeTheme` string, sets `data-theme` attribute on `<html>`, persists in `active_theme` cookie (1 year)
- **Selector:** `ThemeSelector` — dropdown of 10 themes (default: "vercel")
- **CSS approach:** Each theme defines CSS variable overrides. The `data-theme` attribute drives custom property values.
- **KBar integration:** `useThemeSwitching` registers actions for Cycle Theme (`T T`), Toggle Dark/Light (`D D`), Set Light, Set Dark

### Theme List (`theme.config.ts`)

```
claude, neobrutualism, supabase, vercel (default), mono,
notebook, light-green, zen, astro-vista, whatsapp
```

---

## 6. Sidebar Collapse/Expand Behavior

### How it works:

1. **State management:** `SidebarProvider` manages `open` boolean state, exposed via `useSidebar()`
   - `state` derived: `'expanded'` when `open === true`, `'collapsed'` when `false`
   - On desktop, state is persisted in `sidebar_state` cookie (7-day expiry)
   - On mobile, a separate `openMobile` state drives a Sheet overlay

2. **Collapse triggers:**
   - **SidebarTrigger button** (header's hamburger icon) — calls `toggleSidebar()`
   - **SidebarRail** — a narrow interactive strip at sidebar edge
   - **Keyboard shortcut** — `⌘B` toggles sidebar
   - For mobile: the sidebar becomes a Sheet (slide-over), triggered by the same button

3. **Visual mechanism:**
   - `Sidebar` component uses `data-state={state}` and `data-collapsible` attributes
   - When collapsed, CSS transitions `width` from `--sidebar-width` (16rem) to `--sidebar-width-icon` (3rem)
   - A sibling `sidebar-gap` div handles the layout shift (pushes content)
   - Icons remain visible, text is hidden via `group-data-[collapsible=icon]` selectors
   - Tooltips appear on hover for collapsed nav items

4. **Mobile behavior:**
   - At viewport < 768px (`useIsMobile` hook), sidebar renders as a `Sheet` component
   - `openMobile`/`setOpenMobile` controls the Sheet visibility
   - Mobile width is 18rem vs desktop 16rem

### Key CSS pattern for collapse:

```css
/* Sidebar wrapper transitions width */
.group-data-[collapsible=icon]:w-(--sidebar-width-icon)

/* Labels hidden when collapsed */
.group-data-[collapsible=icon]:opacity-0

/* Sub-menus hidden when collapsed */
.group-data-[collapsible=icon]:hidden

/* Content overflow hidden when collapsed */
.group-data-[collapsible=icon]:overflow-hidden
```

---

## 7. Layout-Related Hooks

| Hook                     | File                                     | Purpose                                                                                |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `useSidebar()`           | `src/components/ui/sidebar.tsx`          | Returns `{ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }` |
| `useIsMobile()`          | `src/hooks/use-mobile.tsx`               | Returns `boolean` — true if viewport < 768px                                           |
| `useMediaQuery()`        | `src/hooks/use-media-query.ts`           | Returns `{ isOpen }` — duplicate-ish of `useIsMobile` but returns object               |
| `useFilteredNavItems()`  | `src/hooks/use-nav.ts`                   | RBAC filter for `NavItem[]`, uses `useSession` + `useActiveOrganization`               |
| `useFilteredNavGroups()` | `src/hooks/use-nav.ts`                   | RBAC filter for `NavGroup[]`, calls `useFilteredNavItems`                              |
| `useBreadcrumbs()`       | `src/hooks/use-breadcrumbs.tsx`          | Generates `{ title, link }[]` from pathname                                            |
| `useThemeConfig()`       | `src/components/themes/active-theme.tsx` | Returns `{ activeTheme, setActiveTheme }`                                              |
| `useInfobar()`           | `src/components/ui/infobar.tsx`          | Returns `{ state, open, setOpen, content, setContent, ... }` for the right info panel  |

---

## Data Flow Summary

```
Cookie (sidebar_state)
    |
    v
DashboardLayout (server) reads cookie → defaultOpen
    |
    v
SidebarProvider (client) manages open state
    ├── syncs changes back to cookie via document.cookie
    ├── provides context to all sidebar children
    └── keyboard shortcut ⌘B toggles open
        |
        v
AppSidebar renders from nav-config.ts
    ├── useFilteredNavGroups applies RBAC filtering (client-side)
    ├── OrgSwitcher in header (reads useActiveOrganization)
    └── User dropdown in footer (reads useSession)
```

---

## Files Likely to Need Changes (for porting)

1. **`src/app/[locale]/dashboard/layout.tsx`** — Replace cookie reading with the target app's auth/session strategy
2. **`src/components/layout/app-sidebar.tsx`** — Will need path adaptation (`@/i18n/navigation` → target router)
3. **`src/config/nav-config.ts`** — Straightforward config to copy/modify (no framework deps)
4. **`src/components/ui/sidebar.tsx`** — Self-contained shadcn/ui component, portable
5. **`src/components/layout/header.tsx`** — Port with adjusted theme/locale components
6. **`src/hooks/use-nav.ts`** — RBAC logic depends on Better Auth; will need adaptation
7. **`src/hooks/use-mobile.tsx`** — Simple hook, easy to port

---

## Constraints & Risks

- **RBAC filtering is client-side only** (UX convenience, not security). Server-side checks needed for real security.
- **OrgSwitcher** depends on Better Auth's `authClient.organization` API — needs equivalent in target app
- **i18n routing** (`@/i18n/navigation`) — the dashboard layout uses `next-intl` locale-based routing; porting to a non-i18n app would simplify this
- **Theme system** is elaborate (dark/light + 10 CSS variable themes + ViewTransition + KBar) — could be simplified if not needed
- **Infobar/InfoSidebar** is a parallel sidebar system on the right side — not all apps need this
- **KBar** (Cmd+K) is tightly integrated with navigation config and themes — provides search + keyboard navigation
