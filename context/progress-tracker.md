## Storefront UI Primitives, Theme Toggler, and Cart Removal

Refactored the storefront components with a full suite of customer-facing React UI primitives, completely removed all commerce cart and checkout features, and shipped a highly optimized View Transitions-backed theme toggler with local storage and OS preference synchronization.

Changes:

- **Storefront UI Primitives** (`apps/site/src/components/ui/`): Created customer-facing React primitives including `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `StarRating`, `Accordion`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `RadioGroupItem`, and `Container`.
- **Refactoring** (`apps/site/src/components/astro/` & `apps/site/src/components/islands/`): Migrated all pages, layouts, and islands to use the new UI primitives.
- **Cart & Checkout Removal**: Deleted the `/checkout` route, `checkout.astro`, and all cart-related stores, drawers, triggers, and summary components, simplifying the storefront to a direct lead-generation site.
- **Theme Toggler Island** (`apps/site/src/components/islands/theme-toggler.tsx`): Built an optimized theme toggler React island utilizing the browser View Transitions API for clip-path circular animations and class state synchronization via `useSyncExternalStore`.
- **Theme Sync & Persistence** (`apps/site/src/layouts/StorefrontLayout.astro`): Added an inline blocking script in `<head>` to initialize dark mode instantly, and added a listener on `(prefers-color-scheme: dark)` to sync with browser/OS theme preferences dynamically when no user override exists in `localStorage`.
- **E2E Test Coverage** (`e2e/storefront-theme-toggle.spec.ts`): Added E2E tests for the storefront theme toggle, verifying persistence and default browser/OS preference behaviors.
- **Vite Version Alignment**: Standardized `vite` to version `7.3.5` across the monorepo via root `package.json` overrides and `pnpm-workspace.yaml` catalog, resolving Rolldown's `moduleType` compiler error on Astro.
- **E2E Parallel Run Fix**: Appended a random suffix to registration emails in all E2E spec files, preventing parallel worker run conflicts on database unique key checks.

Verification:

- `pnpm --filter @admin-template/site check-types` (Pass)
- `pnpm --filter @admin-template/site build` (Pass)
- `pnpm playwright test e2e/storefront-theme-toggle.spec.ts` (Pass)
- `pnpm playwright test e2e/theme-toggle.spec.ts` (Pass)

**Last synced:** 2026-06-23

## Public Contact Inquiry Flow

Replaced the storefront's placeholder mailto-only contact card with a real public inquiry submission flow backed by the API and email package.

Changes:

- **Backend endpoint** (`apps/api/src/index.ts`): added `POST /api/storefront/contact` with trimmed validation, malformed-JSON handling, sender-readiness gating, storefront CORS support, and structured success/error/fallback responses
- **Email delivery** (`packages/email/src/index.ts`, `packages/email/src/templates/contact-inquiry.tsx`): added `sendContactInquiryEmail(...)` and a dedicated React Email template for concierge-led public inquiries
- **Environment wiring** (`packages/env/src/server.ts`, `.env.example`, `apps/api/package.json`): added `CONTACT_EMAIL`, `STOREFRONT_SITE_ORIGIN`, `PUBLIC_API_BASE`, and `PUBLIC_ORG_SLUG` wiring plus the `@admin-template/email` dependency for the API app
- **Storefront form UI** (`apps/site/src/components/islands/contact-form.tsx`, `apps/site/src/pages/contact.astro`): added a real client island with validation, loading/success/error states, service-area selection, optional company field, and honest fallback mailto handling when the API provides a fallback address

Verification:

- `pnpm --filter @admin-template/email check-types`
- `pnpm --filter @admin-template/api-server check-types`
- `pnpm --filter @admin-template/site check-types`
- `pnpm --filter @admin-template/site build`

Notes:

- The contact flow remains concierge-led; successful submission only notifies the internal inbox
- The storefront form is intentionally disabled when `PUBLIC_ORG_SLUG` is unset, rather than pretending the flow is available

**Last synced:** 2026-06-22

## Public Storefront API Wiring

Moved the Astro storefront from page-local sample arrays to a real read-only public catalog surface backed by `packages/api`, while keeping concierge-led contact/checkout flows intact.

Changes:

- **Public storefront router** (`packages/api/src/routers/storefront.ts`, `packages/api/src/routers/index.ts`): added OpenAPI-routed read-only endpoints for service list/detail/featured/categories under `/api/storefront/*`
- **Stable public slugs** (`packages/api/src/core/storefront-slugs.ts`, `packages/api/src/routers/operations.ts`, `packages/db/src/schema/business.ts`): services now persist `publicSlug`, create retries on slug collisions, and update preserves the existing slug
- **Service schema rollout** (`packages/db/src/migrations/0001_messy_ted_forrester.sql`, `packages/db/src/migrations/meta/0001_snapshot.json`): added `public_slug` and `category` columns plus the unique `(organization_id, public_slug)` constraint with backfill
- **Storefront data layer** (`apps/site/src/lib/storefront-api.ts`): added API-backed loaders with paginated list fetching, honest empty-state handling, category derivation from live API data, and local fallback only on fetch failure
- **Admin service metadata** (`packages/schemas/src/index.ts`, `apps/web/src/features/operations/shared/*`, `apps/web/src/features/services/page.tsx`): added optional `category` field so internal service records can drive public storefront grouping without demo taxonomy leakage

Verification:

- `pnpm --filter @admin-template/db check-types`
- `pnpm --filter @admin-template/api check-types`
- `pnpm --filter @admin-template/api-server check-types`
- `pnpm --filter @admin-template/site check-types`
- `pnpm --filter @admin-template/site build`

Notes:

- `PUBLIC_ORG_SLUG` enables live storefront catalog reads; when unset or the public API is unavailable, `apps/site` still renders from local sample data
- Contact and checkout remain concierge-led; no public write flows were added in this slice

**Last synced:** 2026-06-22

## Astro Public Storefront Scaffold

Added a new public-facing Astro storefront app under `apps/site`, separate from the internal admin shell, with a static-first route structure and React islands only where client state is required.

Changes:

- **Workspace app scaffold** (`apps/site/package.json`, `astro.config.mjs`, `tsconfig.json`, `env.d.ts`): added `@admin-template/site` with Astro 6, `@astrojs/node`, `@astrojs/react`, `@astrojs/check`, and a root `pnpm dev:site` script
- **Shared storefront shell** (`apps/site/src/layouts/StorefrontLayout.astro`, `apps/site/src/components/astro/*`): added sticky header/footer, skip link, main landmark, homepage sections, services catalog page, service detail pages, contact page, and concierge-led checkout page
- **Sample storefront data** (`apps/site/src/data/*`, `apps/site/src/lib/format.ts`): centralized the starter catalog, category definitions, related-service wiring, social proof content, and USD price formatting
- **React islands** (`apps/site/src/components/islands/*`): added persisted cart store, cart drawer, booking CTA, newsletter mailto handoff, and checkout summary island
- **Token wiring** (`apps/site/src/styles/global.css`): imported `@admin-template/ui/globals.css` and added local `@source` coverage for `.astro` and `.tsx` files

Verification:

- `pnpm install --no-frozen-lockfile`
- `pnpm --filter @admin-template/site check-types`
- `pnpm --filter @admin-template/site build`

Notes:

- The storefront currently uses local sample catalog data in `apps/site/src/data/*`
- Public commerce/contact flows are concierge-led for now; no public commerce API endpoints were added in this pass

**Last synced:** 2026-06-22

## Customer Contact Validation Hardening

Tightened customer form validation so optional contact fields accept blanks, reject malformed input, and surface errors earlier in the dialog.

Changes:

- **Shared customer validators** (`packages/schemas/src/index.ts`): added trimmed optional email and phone schemas; blank strings now normalize to `undefined`, email uses Zod email validation, and phone accepts common punctuation / extensions while requiring 7–15 digits.
- **Customer form schema** (`apps/web/src/features/operations/shared/form-schemas.ts`): switched the customer form to those shared validators so frontend and API validation stay aligned.
- **Field-level feedback** (`apps/web/src/features/customers/page.tsx`): added `onBlur` validators for the email and phone inputs so users see field errors before submit.
- **Regression coverage** (`apps/web/src/features/operations/shared/form-schemas.test.ts`): added cases for blank optional fields, invalid email, invalid phone, and a valid formatted international phone number.

Verification:

- `pnpm test apps/web/src/features/operations/shared/form-schemas.test.ts`
- `pnpm --filter @admin-template/schemas check-types`
- `pnpm --filter @admin-template/web check-types`

**Last synced:** 2026-06-22

## Customer Avatar and Service Photos — Full Integration

Integrated persisted media uploads for customer avatars and service photos through API, S3 storage, and database-backed attachment records.

Changes:

- **Backend attachment helpers** (`packages/api/src/core/operations-media.ts`): reusable S3 + attachments-table helpers for upload, download, list, and soft-delete with org scoping and entity-type enforcement
- **S3 bucket bootstrap** (`packages/api/src/core/s3.ts`): added `ensureS3BucketExists()` that auto-creates the configured bucket on first use, fixing local dev on fresh MinIO instances
- **oRPC media procedures** (`packages/api/src/routers/operations.ts`): added `customers.avatar.{get,delete}` and `services.photos.{list,delete}` with permission checks and audit logging
- **Hono upload/download routes** (`apps/api/src/index.ts`): added `POST /api/operations/customers/:customerId/avatar` (replace semantics), `POST /api/operations/services/:serviceId/photos` (append semantics), and `GET /api/operations/attachments/:attachmentId` (binary download)
- **Client media helpers** (`apps/web/src/features/operations/shared/media-client.ts`): fetch-based upload functions for browser-side multipart upload
- **oRPC query/mutation factories** (`apps/web/src/features/customers/api/`, `apps/web/src/features/services/api/`): added avatar and photos query options and delete mutations
- **EntityDataTable afterSave hook** (`apps/web/src/features/shared/use-entity-data-table.ts`): added optional `afterSave` callback so entity-specific post-save logic runs after create/update
- **Scrollable dialog** (`apps/web/src/features/shared/form-dialog.tsx`): added `max-h-[85vh] overflow-auto` to `DialogContent` so tall forms remain scrollable
- **Customer page integration** (`apps/web/src/features/customers/page.tsx`): `afterSave` uploads avatar via Hono route, shows persisted avatar from API in edit dialog with remove button
- **Service page integration** (`apps/web/src/features/services/page.tsx`): `afterSave` uploads photos via Hono route, shows persisted photo gallery from API in edit dialog with per-photo remove buttons
- **E2E coverage** (`e2e/operations-flow.spec.ts`): verifies avatar and photo uploads persist through API, appear in edit dialogs, and can be deleted

Verification:

- `pnpm --filter @admin-template/ui check-types`
- `pnpm --filter @admin-template/web check-types`
- `pnpm --filter @admin-template/api check-types`
- `pnpm --filter @admin-template/api-server check-types`
- `pnpm playwright test e2e/operations-flow.spec.ts`

**Last synced:** 2026-06-22

## Theme Toggle Persistence and System Default

Fixed the shell header theme toggle so explicit light/dark choices survive reloads and first load follows the browser color-scheme when no preference is saved.

Changes:

- **Theme bootstrap** (`apps/web/index.html`): added an inline pre-hydration script that reads `localStorage.theme`, falls back to `matchMedia("(prefers-color-scheme: dark)")`, then sets the root `.dark` class and `color-scheme` before React mounts
- **Theme provider wiring** (`apps/web/src/main.tsx`, `packages/ui/src/components/theme-provider.tsx`): wrapped the app in `next-themes` via a shared UI `ThemeProvider` configured for class-based theming with `defaultTheme="system"` and `enableSystem`
- **Toggle persistence fix** (`packages/ui/src/components/animated-theme-toggler.tsx`): replaced the ad-hoc `localStorage` write with `setTheme(...)` so the provider, DOM class, and saved preference stay aligned while preserving the existing view-transition animation
- **Toast theming alignment** (`apps/web/src/main.tsx`): switched the shell toast host to `@admin-template/ui/components/sonner` so toast chrome follows the active theme
- **Regression coverage** (`e2e/theme-toggle.spec.ts`): added coverage for persisted dark mode after reload and browser-dark default behavior when `localStorage.theme` is unset

Verification:

- `pnpm --filter @admin-template/ui check-types`
- `pnpm --filter @admin-template/web check-types`
- `pnpm playwright test e2e/theme-toggle.spec.ts`

**Last synced:** 2026-06-22

## Photo Upload Form Fields

Added specialized image-focused TanStack Form fields in `packages/ui` without changing the generic file-upload field contract.

Changes:

- **New photo field exports** (`packages/ui/src/components/forms/fields/photo-upload-field.tsx`): added `AvatarUploadField` / `PhotoUploadField` plus flat composed `FormAvatarUploadField` / `FormPhotoUploadField`
- **Shared field contract**: both new fields keep the existing `File[]` value shape and route through `field.handleChange`, so callers do not need a new single-file form type for avatars
- **Behavior defaults**: avatar uploads are single-image only with image-only accept defaults; photo uploads default to image-only multi-upload with `maxFiles=6`; both default `maxSize` to `5MB`
- **Uploader presentation reuse** (`packages/ui/src/components/file-uploader.tsx`): extended the primitive with `default` / `avatar` / `photos` variants plus customizable dropzone copy so specialized fields reuse the same drop, preview, progress, and remove logic
- **Forms API wiring** (`packages/ui/src/components/forms/fields/index.tsx`, `packages/ui/src/components/forms/use-form-hooks.tsx`): exported the new fields, registered them with `createFormHook`, and exposed typed access through `useFormFields<T>()`

Verification:

- `pnpm --filter @admin-template/ui check-types`
- `pnpm --filter @admin-template/web check-types`

**Last synced:** 2026-06-22

## CRUD Dialog Edit Prefill Fix

Fixed the shared operations CRUD dialog so edit flows open with the selected row values instead of resetting back to the empty form.

Changes:

- **Shared hook fix** (`apps/web/src/features/shared/use-entity-data-table.ts`): captured the empty form defaults once per hook instance and derived `useAppForm({ defaultValues })` from the current edit target (`editing ? toFormValues(editing) : emptyDefaults`).
- **Why**: TanStack Form's `useForm` calls `formApi.update(opts)` on every render; after `form.reset(rowValues)`, the next render was reapplying `EMPTY_*_FORM` as `defaultValues`, which wiped the selected row values before the dialog fields mounted.
- **Behavior preserved**: create and close still explicitly reset back to the empty form; edit still explicitly resets to the selected row before opening.
- **Regression coverage** (`e2e/operations-flow.spec.ts`): added an assertion that the customer edit dialog opens with `Name = "Acme Buyer"` before the test changes it.

Verification:

- `pnpm --filter @admin-template/web check-types`
- `pnpm playwright test e2e/operations-flow.spec.ts`

**Last synced:** 2026-06-22

# Progress Tracker

## Query Abstractions Compliance

Refactored all query/mutation abstractions to match the standard in `.agents/skills/shadcn-dashboard/references/query-abstractions.md`.

Changes:

- **Per-feature API factories**: Created `api/queries.ts` + `api/mutations.ts` in `customers/`, `services/`, `orders/`, `organization/`, and `operations/` feature directories
- **Key factories**: Each entity exports `<entity>Keys` with `all`, `lists`, `list`, `details`, `detail` for cache invalidation via prefix matching
- **oRPC integration**: Factories use oRPC's `.queryOptions()` and `.mutationOptions()` methods directly
- **Hook rewrite**: `useEntityDataTable` consumes typed factory refs (`listQueryOptions`, `createMutation`, `updateMutation`, `softDeleteMutation`, `summaryQueryKey`) instead of raw oRPC procedure refs
- **Invalidation fix**: Hook uses `useQueryClient()` from React context (correct instance) instead of `getQueryClient()` from UI package (separate singleton)
- **Organization hook**: `useOrganizationProfile` consumes `updateOrganizationProfileMutation` factory
- **Overview page**: Uses `operationsSummaryQueryOptions()` factory
- **Lookups hook**: Uses `operationsCustomerListQueryOptions()` / `operationsServiceListQueryOptions()` factories
- **Removed**: All `as unknown as` casts, manual type aliases, `orpc*` config fields from `useEntityDataTable`
- **Config shape**: `EntityDataTableConfig` now takes `listQueryOptions`, `createMutation`, `updateMutation`, `softDeleteMutation`, `summaryQueryKey`

Verification:

- `pnpm --filter @admin-template/web check-types` — clean
- `pnpm playwright test e2e/data-table.spec.ts e2e/operations-flow.spec.ts` — 2/2 passed
- Grep: zero hits for `as unknown as`, `getQueryClient`, `EntityListProcedureLike`, `orpcList`

**Last synced:** 2026-06-22

## API Error Surfacing in Forms

Added inline form-level error display for API errors in `onSubmit` across all three forms that call APIs:

- **Sign-in** (`apps/web/src/pages/auth/sign-in.tsx`): `onSubmit` catches Better Auth errors, maps known status codes (`403` → verify-email prompt, fallback → `error.message`), sets form-level error via `formApi.setErrorMap({ onSubmit: { form: message, fields: {} } })`, and fires a `sonner` toast. `<FormErrors />` added inside `<CardContent>`.
- **Sign-up** (`apps/web/src/pages/auth/sign-up.tsx`): same pattern — maps `USER_ALREADY_EXISTS` and status `403`.
- **Onboarding** (`apps/web/src/features/onboarding/page.tsx`): error handling moved from `useMutation.onError` into the `onSubmit` catch block, with `setErrorMap` for inline display and toast for redundancy. `<FormErrors />` added.
- **Removed**: stale `onError` handler from onboarding mutation (duplicate toast).
- **Pattern**: both channels — inline `FormErrors` (a11y-friendly `role="alert"`) + `sonner` toast.
- **Customers/Services/Orders** (`useEntityDataTable` shared hook + `EntityFormDialog`):
  Shared `onSubmit` now catches `mutateAsync` rejection and sets form-level error via
  `formApi.setErrorMap({ onSubmit: { form: message, fields: {} } })`.
  `<FormErrors />` added to `EntityFormDialog` so the inline alert renders in all
  data-table CRUD dialogs. Toast was already wired via mutation `onError`.

Verification:

- `pnpm --filter @admin-template/web check-types` — clean
- `pnpm playwright test e2e/auth-flow.spec.ts` — 5/5 passed

**Last synced:** 2026-06-22

## Form Field Label Display

Updated `SelectField` and `ComboboxField` to display the matching option label in the closed field UI instead of the raw stored value.

Changes:

- **SelectField** (`packages/ui/src/components/forms/fields/select-field.tsx`): used `SelectValue`'s `children` render function to map the stored value to the matching option label. Falls back to placeholder when no option matches.
- **ComboboxField** (`packages/ui/src/components/forms/fields/combobox-field.tsx`): used `Combobox.Root`'s `itemToStringLabel` prop to convert the selected value to the display label. Empty values keep the input placeholder.
- **Scope**: form field wrappers only — base `Select` and `Combobox` primitives unchanged.

Verification:

- `pnpm --filter @admin-template/ui check-types` — clean
- `pnpm --filter @admin-template/web check-types` — clean

**Last synced:** 2026-06-22

## UI Source Duplicate Cleanup

Stopped `packages/ui` from re-emitting `.js` files beside the TypeScript source files.

Changes:

- **Emit guard** (`packages/ui/tsconfig.json`): added `"noEmit": true` so a plain `tsc -p tsconfig.json` cannot write compiled `.js` files back into `src/`.
- **Duplicate cleanup** (`packages/ui/src/**/*.js`): removed 111 generated JavaScript mirrors that duplicated the `.ts` / `.tsx` source tree, including the tracked `packages/ui/src/lib/csv.test.js`.
- **Root cause**: the package exported source files directly but did not set `noEmit` in tsconfig, so ad-hoc or editor-driven TypeScript runs could transpile into the source tree and create duplicate files.

Verification:

- `pnpm --filter @admin-template/ui exec tsc -p tsconfig.json --listEmittedFiles`
- `python3 - <<'PY' ... Path('packages/ui/src').rglob('*.js') ... -> 0 files`

**Last synced:** 2026-06-22

## Organization Onboarding & Sidebar Org Selector

Implemented explicit organization onboarding flow and converted the sidebar brand to an organization selector.

Changes:

- **Removed auto-create org on signup**: deleted `user-create-after.ts`, `repair-orphaned-workspace.ts`, and `databaseHooks.user.create.after` from auth config. Users without an active org now go to `/onboarding`.
- **Onboarding page** (`apps/web/src/features/onboarding/page.tsx`): single-field org name form, creates org via `orpc.organization.create`, sets active org via Better Auth `setActive`, navigates to `/overview`.
- **OrganizationRoute guard** (`apps/web/src/components/organization-route.tsx`): wraps dashboard routes, redirects to `/onboarding` if no active org in session.
  - **Sidebar org selector** (`apps/web/src/features/navigation/components/sidebar-brand.tsx`): `Building2` icon, org name, dropdown with org list + Create organization. Switches active org via `setActive`. `DropdownMenuLabel` must be inside `DropdownMenuGroup` (base-ui `Menu.Group` context requirement).
- **Organization create procedure** (`packages/api/src/routers/organization.ts`): `slugifyOrganizationName`, unique slug resolution (`-2` through `-100`), transactional org + member + workspace table insert.
- **Shared schema** (`createOrganizationSchema` in `@admin-template/schemas`), **seed exports** (`DEFAULT_DEAL_STAGES`, `insertInitialWorkspaceTables` in `packages/auth/src/seed.ts`).
- **Removed stale nav**: Modules item deleted from sidebar user menu.
- **E2E tests updated**: signup expects `/onboarding` flow, sidebar org selector verified with org switching.
- **Unit test**: `slugifyOrganizationName` with 3 cases (punctuation, diacritics, empty).

Verification:

- `pnpm --filter @admin-template/schemas check-types`
- `pnpm --filter @admin-template/auth check-types`
- `pnpm --filter @admin-template/api check-types`
- `pnpm --filter @admin-template/api-server check-types`
- `pnpm --filter @admin-template/web check-types`
- `pnpm test packages/api/src/routers/organization.test.ts`
- `pnpm playwright test e2e/auth-flow.spec.ts --grep 'organization onboarding|sidebar'`

**Last synced:** 2026-06-22

## Assistant Mobile Bottom Sheet

Adjusted the shell assistant to present as a full-width bottom sheet on mobile while keeping the desktop right-rail layout unchanged and preserving the sheet's default height.

Changes:

- **Responsive sheet side**: `AssistantSheet` now switches `SheetContent` to `side="bottom"` on mobile via `useIsMobile()`, while desktop keeps the right-side sheet.
- **Width-only mobile sizing**: the mobile sheet keeps `w-full max-w-none` and drops the desktop border, but no longer forces `100dvh`; transcript scrolling now uses the sheet's natural height again.
- **Targeted E2E coverage**: `e2e/assistant-chat.spec.ts` adds a mobile viewport check that asserts the sheet opens from the bottom and spans the viewport width without asserting full-height behavior.

Verification:

- `pnpm --filter @admin-template/web check-types`
- `pnpm playwright test e2e/assistant-chat.spec.ts --grep "full-width bottom sheet"`

**Last synced:** 2026-06-20

## Assistant Streaming Bubble Deduplication

Adjusted `apps/web/src/features/assistant/components/assistant-sheet.tsx` so the assistant shows one in-progress bubble at a time during `useChat` streaming.

Changes:

- **Inline streaming state**: when the last assistant `UIMessage` exists but has no text parts yet, the existing assistant bubble renders the three-dot typing indicator instead of a second placeholder row.
- **Standalone loader narrowed**: the extra typing row now appears only before an assistant message exists at all (for example, immediately after submit while the last message is still the user prompt).
- **AI SDK-aligned guard**: loader visibility now follows the AI SDK guidance to check the last assistant message and whether any text parts have arrived, which avoids the duplicate in-progress bubble.

Verification:

- `pnpm --filter @admin-template/web check-types`
- `pnpm playwright test e2e/assistant-chat.spec.ts`

**Last synced:** 2026-06-21

## Mastra Schema Separation

Moved Mastra persistence out of `public` and into PostgreSQL schema `mastra` so `scripts/dev.sh` no longer wipes assistant history when it runs `pnpm db:push`.

Changes:

- **Dedicated Mastra schema**: `apps/api/src/mastra/storage.ts` now provisions `PostgresStore` with `schemaName: "mastra"` for both root Mastra storage and assistant memory storage.
- **One-time migration guard**: API startup now creates schema `mastra` if needed and moves any existing `public.mastra_*` tables into that schema before the server begins handling requests.
- **Drizzle isolation**: `packages/db/drizzle.config.ts` now restricts `drizzle-kit push` to `schemaFilter: ["public"]`, preventing schema sync from deleting Mastra-owned tables.
- **Reproduced + fixed**: before this change, `pnpm db:push` removed `public.mastra_threads` / `public.mastra_messages` while leaving auth data intact; after the change, both `pnpm db:push` and `./scripts/dev.sh crm` preserved assistant history.

Verification:

- `pnpm --filter @admin-template/db check-types`
- `pnpm --filter @admin-template/api-server check-types`
- `pnpm db:push`
- `./scripts/dev.sh crm` followed by authenticated `/api/ai/chat/history` checks and UI reload checks

**Last synced:** 2026-06-20

## Assistant Sheet Polish Pass

Polished `apps/web/src/features/assistant/components/assistant-sheet.tsx` after `/impeccable critique` (score 27/40). Addressed P0 optimistic-update bug, P1 accessibility gaps, and visual-system drift while keeping the familiar sparkle motif.

Changes:

- **Approval flow hardening**: `handleResume` now waits for the stream to finish before marking a tool call as approved/declined; failures surface an inline error with Retry / Decline instead options instead of silently logging to the console.
- **Per-tool loading**: replaced global `isResuming` with per-approval `isLoading`, so multiple pending tool calls can be reviewed independently.
- **Accessibility**: added `aria-label="Close assistant"` to the header close button, removed 10px uppercase role labels in favor of readable `text-xs`, and guarded auto-scroll with `prefers-reduced-motion` plus a near-bottom check.
- **Design-system alignment**: composer `Textarea` now uses `rounded-3xl` (system input radius), tool card no longer has a permanent `shadow-sm`, and the sheet width is `w-full sm:w-[500px] sm:max-w-[90vw]` for mobile safety.
- **Familiar-but-varied iconography**: tool-approval card uses a `CalendarIcon` for CRM activities instead of the third `SparklesIcon` repeat.

Verification:

- `pnpm --filter @admin-template/web check-types` — clean
- `npx playwright test e2e/assistant-chat.spec.ts` — passed
- Browser screenshots at desktop and mobile viewports confirmed responsive layout and empty-state spacing
- CLI `detect.mjs` on the file returned clean (`[]`)

**Last synced:** 2026-06-20

Assistant transcript persistence complete:

- Added `GET /api/ai/chat/history` in `apps/api/src/index.ts`, replaying persisted Mastra thread messages for the authenticated user/resource while preserving tool-call parts.
- Updated `AssistantSheet` to hydrate stored AI SDK `UIMessage`s on open, validate them before rendering, and disable the composer while history is restoring.
- Extended `e2e/assistant-chat.spec.ts` to reload the app and verify the prior prompt plus assistant reply remain visible after refresh.

Verification:

- `pnpm --filter @admin-template/api-server check-types`
- `pnpm --filter @admin-template/web check-types`
- `pnpm playwright test e2e/assistant-chat.spec.ts`

React Doctor health audit complete — score lift from **47 → 68 (+21)** across all React packages (at time of audit, before single-app refactor):

- **web** (was crm-web): 47 → **89** (+42) — was "Needs work", now "Great"
- **ui**: 54 → **68** (+14) — bulk compound-component work
- **email**: 100 (unchanged)

Major improvements landed:

- **CRM features**: button-style interactive cards (keyboard-accessible), parallelized attachment uploads (`Promise.allSettled`), memoized derived query arrays, hoisted `handleDownload` to module scope
- **Auth provider**: `useContext` → `use()` migration
- **UI package**: listener-ref pattern in carousel, `useMemo`-stabilized context values, lazy `recharts` import, `WeakMap` cache for `Intl.DateTimeFormat`, `useSyncExternalStore` for theme-toggler dark state
- **Tanstack-form split**: `use-form-hooks.tsx` carved out from `tanstack-form.tsx` as canonical hooks source
- **Deleted**: `packages/ui/src/components/table/index.tsx`, `use-debounce.tsx`, `use-stepper.tsx` (no consumers)
- **96 stale `.js` build artifacts** removed from `packages/ui/src` (tsc emit pollution)

Verification (at time of audit):

- `pnpm -r --filter @admin-template/ui exec tsc --build` — clean
- `pnpm dlx react-doctor -y` — 0 errors, 74 warnings remaining

Module generator infrastructure (historical — scripts deleted during single-app refactor):

- ~~`pnpm create:module`~~ — deleted along with `scripts/create-module.ts` and `scripts/templates/`
- Generator previously created shell-only remote modules with CRM-pattern templates
- Module code generation is no longer needed for the single-app architecture

### Background Context

### Verified

- [x] Workspace identity reset (admin-app-template, @admin-template/\*)
- [x] pnpm workspace configuration — pnpm install succeeds, 13 workspace projects resolved
- [x] App layout restructured (web, api)
- [x] Context files created (9 files)
- [x] Shared packages created (types, api-client, schemas)
- [x] Auth with Organization plugin
- [x] Database schema (CRM + Audit)
- [x] Backend API (organization, CRM modules)
- [x] Web app (auth, sidebar navigation, settings, org-scoped routing)
- [x] CRM features (overview, leads, contacts, companies, deals, pipeline)
- [x] Docker and dev scripts updated
- [x] README and .env.example updated
- [x] Organization onboarding — signup creates org at `/onboarding`, sign-in restores active org
- [x] Auth redirect race fixed on auth pages
- [x] Sidebar org selector — organization switching, create new org
- [x] Auth E2E flow covers sign-out/sign-in preserving active workspace
- [x] DataTable migration across CRM pages
- [x] Backend list endpoints accept the shared sort/column-key contract
- [x] CRM DataTable search uses generic `search` param with debounced URL-state refetch
- [x] TanStack Form migration across CRM dialogs
- [x] Import/Export foundation — reusable CSV import/export for CRM contacts
- [x] CRM Contact Attachments — upload/download/delete via S3-compatible storage
- [x] Feature-based module restructure in web app
- [x] Reusable PageHeader component adopted across CRM pages
- [x] PageContainer adopted in CRM detail routes and shared layout patterns
- [x] Layout header breadcrumb pattern with theme toggler shipped in `apps/web/src/components/layout/header.tsx`
- [x] CRM row-click detail routing — leads, contacts, companies, and deals now navigate to dedicated detail routes
- [x] **CRM Module Rewrite — full base CRM**
  - **DB schema**: Added `leads`, `crmActivities`, `dealStageKindEnum` (`open` / `won` / `lost`), `crmActivityTypeEnum`, and `crmActivityEntityTypeEnum`. Updated `companies` with `status`; updated `dealStages` with `kind`, `deletedAt`, `createdBy`, `updatedBy`; updated contact defaults
  - **Shared schemas** (`@admin-template/schemas`): Added lead, activity, and stage schemas plus lead-conversion validation
  - **Backend API** (`packages/api/src/routers/crm.ts`): Full rewrite with typed Zod input schemas, `requirePermission` on CRM handlers, audit logging on writes, lead conversion, stage admin, activities, and richer summary metrics
  - **Router index** (`packages/api/src/routers/index.ts`): Added `leads`, `stages`, and `activities` to the CRM router
  - **Auth seed** (`packages/auth/src/seed.ts`): Updated stage seeding for `kind` plus audit columns
  - **Nav config** (`apps/web/src/config/nav-config.ts`): Added CRM Overview, Leads, and Pipeline entries plus matching icons
  - **CRM features** (`apps/web/src/features/`): Overview, Leads, Contacts, Companies, Deals, Pipeline, and dedicated detail routes for the four record types
  - **Shared feature layer** (`apps/web/src/features/shared/`): Centralized active row/form types, shared constants, lookups, and form schemas
- [x] **Agentic AI Assistant Integration**
  - **Backend API**: Exposes `/api/ai/chat`, `/api/ai/chat/history`, `/api/ai/chat/approve`, and `/api/ai/chat/decline` Hono endpoints for streaming, history replay, and approval resumes
  - **Mastra Setup**: Configures `labqAssistantAgent` with memory and PostgresStore storage backend
  - **Tools**: Defines platform context info, CRM reads, and activity creation tools with approval gating
  - **Frontend UI**: Mounts floating Sparks button in shell layout opening a scrollable Sheet, hydrates persisted transcript state on open, and keeps approval cards/tool parts visible after refresh
  - **E2E verification**: `e2e/assistant-chat.spec.ts` now checks signup, chat, stream response, and transcript restore after a page refresh
  - **Empty prompt fix**: Resolved empty prompt issue when client streams messages containing text in the `parts` array instead of `content`
  - **Database memory persistence**: Wired `PostgresStore` to the agent `Memory` constructor, enabling chat sessions to survive server restarts

### Remaining Work

1. ~~E2E auth-flow tests — need Playwright browser to reach API server~~ (done)
2. ~~Module Federation runtime verification~~ (done)
3. ~~React-doctor fixes~~ (done)
4. ~~Fallow audit fixes~~ (done)
5. ~~Stock movement projection — transactional balance updates~~ (done)
6. RLS SQL policies
7. Workspace typecheck cleanup (`packages/env/src/web.ts` fails on `import.meta.env` typing in `pnpm check-types` as of 2026-06-20)
8. ~~E2E run for data-table URL-state coverage (`e2e/data-table.spec.ts`)~~ (done)
9. Attachment expansion / entity-specific RBAC if product needs attachments beyond operations customers

## Architecture Summary

```
pnpm workspace + vite-plus (`vp`)
├── apps/
│   ├── api (port 4000) — Hono + oRPC backend
│   └── web (port 3100) — React SPA, operations features, sidebar org selector, onboarding
├── packages/
│   ├── api — Router + procedures
│   ├── auth — Better Auth + Organization plugin
│   ├── db — Drizzle schema + migrations
│   ├── env — Environment validation
│   ├── ui — shadcn/ui components
│   ├── types — Shared literal types
│   ├── schemas — Zod validation schemas
│   ├── api-client — oRPC client factory
│   ├── email — React Email + Resend integration
│   └── config — Shared tsconfig
└── context/ — Project documentation
```
