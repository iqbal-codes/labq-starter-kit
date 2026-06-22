# Architecture

- pnpm workspace
- Vite Plus (`vp`) workspace runner for dev/build/check/db orchestration
- Single-app shell architecture with shared packages

## Frontend

- Shell app (`apps/web`): auth, sidebar organization selector, onboarding, settings, org-scoped routing, module guards, shared layout chrome, and the floating assistant sheet
- Operations features: overview, customers, services, orders
- `OrganizationRoute` guard wraps dashboard routes — redirects to `/onboarding` if no active org
- `OnboardingPage` at `/onboarding` — single-field org name form, creates org via `orpc.organization.create`, sets active org via Better Auth `setActive`, navigates to `/overview`
- `main.tsx` is a thin boot file: imports runtime + renders root component with `ReactDOM.createRoot()`
- No page or module file imports from a file that calls `ReactDOM.createRoot()`

### Form System

- TanStack Form + shadcn/ui integration via `@admin-template/ui/components/forms`
- Hooks (`useAppForm`, `useFormFields`, `withForm`, `withFieldGroup`) import from `use-form-hooks` (canonical source)
- Components (`FormFieldSet`, `FormField`, `FormFieldError`, `FormErrors`) import from `form-context`
- Legacy compatibility barrel at `tanstack-form` re-exports everything from both sources
- `useAppForm()` for form setup with Zod validators
- `useFormFields<T>()` for type-safe field components (`FormTextField`, `FormSelectField`, etc.)
- Auth pages use this system (sign-in, sign-up)

## Backend

- Modular monolith on Hono + oRPC
- `apps/api/src/index.ts` hosts the shell assistant endpoints (`/api/ai/chat`, `/api/ai/chat/history`, `/api/ai/chat/approve`, `/api/ai/chat/decline`) alongside the oRPC surface; the history route accepts `threadId`, `page`, `perPage`, and `all=true`, returns `{ threadId, messages, total }`, and enforces resource/user ownership before replaying transcript state
- Assistant tool-call approval/resumption is coordinated through Mastra run IDs bridged into the AI SDK stream (`X-Mastra-Run-Id` / `x-mastra-run-id`), and persisted Mastra tables now live in PostgreSQL schema `mastra`, not `public`, so Drizzle schema pushes for app tables do not wipe assistant memory
- Business procedures are organization-scoped
- Operations handlers enforce RBAC with `requirePermission(...)`
- `packages/api/src/core/rls.ts` provides a transaction helper, but SQL RLS policies / router integration are still pending

## Auth

- Better Auth + Organization plugin
- Email/password required
- OAuth optional (GitHub, Google)
- Roles: owner, admin, member, viewer
- Signup no longer auto-creates an organization — users land on `/onboarding` after signup
- `/onboarding` creates org via `orpc.organization.create`, sets active org via Better Auth `setActive`, then navigates to `/overview`
- `session.create.before` restores the active organization for existing memberships on sign-in

## Database

- Drizzle ORM
- Business tables: customers, services, orders, organizationSettings, auditLogs, attachments
- Operations tables (customers, services, orders) carry `createdBy` / `updatedBy` columns; soft delete via `deletedAt`
- Audit logging on CRUD operations

## Storage

- S3-compatible object storage (MinIO local, Cloudflare R2 prod)
- Generic `S3_*` env vars — no `R2_*` or `MINIO_*` aliases
- S3 client singleton in `packages/api/src/core/s3.ts` (shared by oRPC router and Hono routes)
- Binary upload/download routes live in `apps/api/src/index.ts` (Hono, not oRPC)
- Attachment metadata lives in the `attachments` table and stores `entityType` / `entityId`, but the current API surface only exposes `crm_contact` attachments

## Permissions

- `packages/api/src/core/permissions.ts`: `requirePermission(context, permission)` — throws `FORBIDDEN` if missing
- Operations router enforces `operations.view`, `operations.create`, `operations.update`, `operations.delete` on its handlers
- Frontend gating uses `apps/web/src/hooks/use-permissions.ts`, which reads `orpc.organization.getContext` for the active permission array

## Import/Export

- Shared CSV utilities in `packages/ui/src/lib/csv.ts`: `parseCsvFile(File)` and `downloadCsv({ filename, headers, rows })`
- Reusable import dialog: `packages/ui/src/components/import-export/csv-import-dialog.tsx`
- Generic `CsvImportDialog<TRow>` accepts columns, schema, and `onImport` — UI-focused, not API-aware
- Schema contract: `CONTACT_IMPORT_EXPORT_FIELDS` in `@admin-template/schemas` defines round-trippable CSV columns
- Backend bulk import: `contacts.bulkCreate` in `packages/api/src/routers/crm.ts` — row-by-row with audit
- Backend export: `contacts.exportRows` — unpaginated, returns import-safe subset with nullable → empty string normalization; picks `search`, `status`, and `sort` from the same list input schema

## Generic Search

- Operations list endpoints (`customers.list`, `services.list`, `orders.list`) expose a single `search: z.string().optional()` input instead of column-specific params
- The shared `useDataTable` hook maps any `meta.variant === "text"` column filter to the generic `search` query key; non-text variants (select / multiSelect / date / number) keep their column-id keys
- Search URL writes are debounced (300ms default) before `useQueryStates` is called

Backend search matches (via `ilike`): customers → name/email/phone, services → name/description, orders → title/notes
