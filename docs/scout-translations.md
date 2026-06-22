# Context: i18n / Translation System

**Project:** `next-shadcn-dashboard-starter`
**Library:** `next-intl` v4.12.0 (with `createNextIntlPlugin`, `createMiddleware`, `createNavigation`)
**Locales:** `en` (English), `id` (Indonesian)
**Default locale:** `en`
**Locale prefix strategy:** `as-needed` — default locale has no prefix in URL; other locales get `/<locale>/` prefix

---

## 1. Files Retrieved

| #   | File                                           | Lines   | Purpose                                                                                                                                                             |
| --- | ---------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/i18n/routing.ts`                          | 1–6     | Defines locale list, default, and prefix strategy                                                                                                                   |
| 2   | `src/i18n/request.ts`                          | 1–13    | Loads messages JSON per locale (used by `next-intl/plugin`)                                                                                                         |
| 3   | `src/i18n/navigation.ts`                       | 1–6     | Exports `Link`, `redirect`, `usePathname`, `useRouter`                                                                                                              |
| 4   | `src/i18n/global.d.ts`                         | 1–8     | Type augmentation for `next-intl` with `en.json` shape                                                                                                              |
| 5   | `src/messages/en.json`                         | 1–end   | English translations (9 top-level namespaces)                                                                                                                       |
| 6   | `src/messages/id.json`                         | 1–end   | Indonesian translations (same structure as en.json)                                                                                                                 |
| 7   | `src/proxy.ts`                                 | 1–50    | Combined auth + i18n middleware                                                                                                                                     |
| 8   | `next.config.ts`                               | 1–63    | Wraps Next config with `createNextIntlPlugin`                                                                                                                       |
| 9   | `src/app/[locale]/layout.tsx`                  | 1–53    | Root locale layout with `NextIntlClientProvider`                                                                                                                    |
| 10  | `src/components/layout/locale-switcher.tsx`    | 1–101   | Language dropdown component                                                                                                                                         |
| 11  | `src/components/layout/locale-loading-bar.tsx` | 1–23    | Visual loading bar during locale switch                                                                                                                             |
| 12  | `src/lib/locale-loading-store.ts`              | 1–9     | Zustand store coordinating loading state                                                                                                                            |
| 13  | `src/lib/locale.ts`                            | 1–20    | Utility functions for locale detection                                                                                                                              |
| 14  | `src/components/layout/app-sidebar.tsx`        | 1–168   | Example of `useTranslations('Nav')` usage                                                                                                                           |
| 15  | `src/components/nav-user.tsx`                  | 1–113   | Example of `useTranslations('Nav')` usage                                                                                                                           |
| 16  | `src/components/modal/alert-modal.tsx`         | 1–57    | Example of `useTranslations('Common')` usage                                                                                                                        |
| 17  | Multiple table/feature files                   | various | Examples using `useTranslations('Table')`, `useTranslations('Product')`, `useTranslations('User')`, `useTranslations('Kanban')`, `useTranslations('Organizations')` |

---

## 2. Key Code

### 2a. Routing Configuration

```ts
// src/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["en", "id"],
	defaultLocale: "en",
	localePrefix: "as-needed", // en → /path, id → /id/path
});
```

### 2b. Message Loading (request.ts)

```ts
// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = routing.locales.includes(requested as "en" | "id")
		? (requested as "en" | "id")
		: routing.defaultLocale;

	return {
		locale,
		messages: (await import(`@/messages/${locale}.json`)).default,
	};
});
```

### 2c. Navigation helpers

```ts
// src/i18n/navigation.ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

### 2d. Type augmentation (global.d.ts)

```ts
// src/i18n/global.d.ts
import type en from "@/messages/en.json";

declare module "next-intl" {
	interface AppConfig {
		Locale: "en" | "id";
		Messages: typeof en; // full type safety matching en.json shape
	}
}
```

### 2e. Next.js plugin (next.config.ts)

```ts
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
// wrapped around the rest of the config
const nextConfig = withNextIntl(configWithPlugins);
export default nextConfig;
```

### 2f. Combined proxy middleware

```ts
// src/proxy.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const handleI18nRouting = createMiddleware(routing);

// Routes NOT under [locale]:
const nonI18nRoutes = ['/', '/auth', '/about', '/terms-of-service', '/privacy-policy'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth.api.getSession({ headers: request.headers });

  // Redirect authenticated users away from auth pages
  if (session && pathname.startsWith('/auth'))
    return NextResponse.redirect(new URL('/dashboard/overview', request.url));

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !session) { ... redirect to sign-in }

  // Non-i18n routes pass through directly
  if (isNonI18nRoute(pathname)) return NextResponse.next();

  // Everything else → i18n routing
  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)']
};
```

### 2g. Locale layout

```ts
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'en' | 'id')) notFound();

  setRequestLocale(locale as 'en' | 'id');
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

### 2h. Locale switcher component

```ts
// src/components/layout/locale-switcher.tsx
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';

const locales = [
  { code: 'en' as const, label: 'English', flag: '🇺🇸' },
  { code: 'id' as const, label: 'Indonesia', flag: '🇮🇩' }
];

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const setChangingLocale = useLocaleLoadingStore((s) => s.setChangingLocale);

  const handleLocaleChange = (newLocale: 'en' | 'id') => {
    if (newLocale === locale) return;
    setChangingLocale(true);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <Button variant='ghost' size='icon' className='h-8 w-8'>
          {isPending ? <Icons.spinner /> : <span>{currentLocale.flag}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {locales.map((loc) => (
          <DropdownMenuItem key={loc.code} onClick={() => handleLocaleChange(loc.code)}>
            <span>{loc.flag}</span>
            <span>{loc.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 2i. Translation usage in components (client-side)

```tsx
// In any 'use client' component:
import { useTranslations } from "next-intl";

const t = useTranslations("Nav"); // Namespace: Nav.dashboard, Nav.profile, etc.
const tCommon = useTranslations("Common"); // Namespace: Common.save, Common.cancel, etc.

// Usage:
return <span>{t("dashboard")}</span>; // → "Dashboard" or "Dasbor"
```

### 2j. Translation message structure

```
en.json / id.json structure:
├── Nav          → sidebar/menu labels (24 keys)
├── Common       → generic UI strings (19 keys, includes {count} placeholders)
├── Auth         → sign-in/sign-up labels (split into signIn.* and signUp.*)
├── PageTitles   → page title/description pairs (15 keys)
├── Table        → table column headers & search placeholders
├── Notifications → notification panel strings
├── Organizations → org switcher strings
├── Billing      → subscription/plan strings
├── Errors       → error page strings
├── Product      → CRUD action strings for products
├── User         → CRUD action strings for users
├── Kanban       → kanban board labels & placeholders
```

### 2k. Locale loading bar + Zustand store

```ts
// src/lib/locale-loading-store.ts
export const useLocaleLoadingStore = create<LocaleLoadingState>()((set) => ({
	isChangingLocale: false,
	setChangingLocale: (v) => set({ isChangingLocale: v }),
}));

// src/components/layout/locale-loading-bar.tsx
// Shows a top-of-page animated bar when isChangingLocale is true.
// Cleared when the React transition completes.
```

### 2l. Utility helpers

```ts
// src/lib/locale.ts
export function getLocaleFromRequest(request: Request): 'en' | 'id' { ... }
export const dateFnsLocale = { id, en: undefined };
export const rechartsLocaleStrings: Record<'en' | 'id', string> = { en: 'en-US', id: 'id-ID' };
export type SupportedLocale = 'en' | 'id';
```

---

## 3. Architecture / Data Flow

```
User Request
    │
    ▼
next.config.ts (withNextIntl plugin attaches i18n handling)
    │
    ▼
src/proxy.ts (Next.js Middleware)
    ├─ Auth check (session validation via better-auth)
    ├─ Redirect unauthenticated users to /auth/sign-in
    ├─ Redirect authenticated users away from auth pages
    └─ Non-i18n routes (/, /auth, /about, /terms, /privacy) → pass through
    └─ All other routes → handleI18nRouting(routing)
         │
         ▼
    next-intl/middleware handles locale detection & redirect:
    └─ Detects locale from cookie, header, or URL
    └─ Redirects /path → /id/path for non-default locale
    └─ Sets NEXT_LOCALE cookie
         │
         ▼
src/app/[locale]/layout.tsx (Root locale layout)
    ├─ setRequestLocale(locale) — for static rendering
    ├─ getMessages() — loads en.json or id.json
    └─ <NextIntlClientProvider locale={locale} messages={messages}>
         │
         ▼
    NextIntlClientProvider makes messages available to:
    ├─ useTranslations('Namespace') in client components
    └─ getTranslations('Namespace') in server components (not yet used)
         │
         ▼
    LocaleSwitcher component:
    ├─ Reads current locale via useLocale()
    ├─ On change: router.replace(pathname, { locale: newLocale })
    ├─ Wrapped in startTransition → isPending signals loading
    └─ Updates Zustand store → triggers LocaleLoadingBar
```

### Non-i18n pages

Auth pages (`/auth/sign-in`, `/auth/sign-up`), landing page (`/`), static pages (`/about`, `/terms-of-service`, `/privacy-policy`) live **outside** `[locale]` and do **not** use translations. They have hard-coded English strings.

### Navigation components using i18n

All internal navigation must import from `@/i18n/navigation` (not `next/navigation`):

- `Link` → locale-aware
- `useRouter()` → locale-aware
- `usePathname()` → returns pathname without locale prefix
- `redirect()` → locale-aware

---

## 4. Start Here

**First file to open:** `src/i18n/routing.ts` — it defines the two locales and the URL prefix strategy (`as-needed`). Then read `src/i18n/request.ts` to see how messages are loaded, and `src/i18n/navigation.ts` for the exported navigation helpers.

**To understand the middleware flow:** `src/proxy.ts` — it's the entry point for every request and shows how auth and i18n coexist.

**To see translation usage patterns:**

- `src/components/layout/app-sidebar.tsx` — uses `useTranslations('Nav')`
- `src/components/modal/alert-modal.tsx` — uses `useTranslations('Common')`
- `src/features/products/components/product-tables/cell-action.tsx` — uses both `useTranslations('Product')` and `useTranslations('Table')`

---

## 5. Constraints, Risks & Open Questions

| #   | Item                                          | Details                                                                                                                                               |
| --- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Auth pages not translated**                 | `/auth/sign-in` and `/auth/sign-up` have hard-coded English strings. They are outside `[locale]` and won't get translated without structural changes. |
| 2   | **Static pages not translated**               | `/about`, `/terms-of-service`, `/privacy-policy` are outside `[locale]`.                                                                              |
| 3   | **No `getTranslations` usage yet**            | The app only uses client-side `useTranslations()`. Server components could use `getTranslations()` but none do currently.                             |
| 4   | **Middleware duplicates auth logic**          | Better-auth already handles session validation; the proxy middleware duplicates this check, which could cause double validation.                      |
| 5   | **`localePrefix: 'as-needed'` SEO nuance**    | Default locale (`en`) has no prefix. Search engines see `/dashboard` and `/id/dashboard` as different URLs. Canonical tags may be needed.             |
| 6   | **No `generateStaticParams` with `[locale]`** | The locale layout doesn't export `generateStaticParams` for static generation. This is fine for dynamic rendering but worth noting if SSG is needed.  |
| 7   | **Message files are flat JSON**               | No namespacing conflicts, but the `en.json` is ~350 lines and growing. Consider splitting into domain-specific message files if it grows further.     |
| 8   | **Locale detection order**                    | `next-intl/middleware` detects locale from: cookie > header > default. The proxy doesn't set the cookie manually — `next-intl/middleware` does.       |
