# Code Standards

These standards extend the project's existing conventions. Anything already in
`ui-rules.md`, `ui-tokens.md`, `ui-registry.md`, `architecture.md`,
`library-docs.md`, and `build-plan.md` remains in force — this file is the
"how to write code" companion to those "what we use" docs.

When something in this file contradicts another context file, the more
specific doc wins (e.g. `ui-rules.md` for tokens, `ui-registry.md` for
established UI patterns, `library-docs.md` for API usage).

## Language and Typing

- `strict: true` is the project baseline — do not loosen it.
- `noUncheckedIndexedAccess: true` for new packages; prefer defensive access
  (`map.get(key)` → `T | undefined`) over `!` assertions.
- `exactOptionalPropertyTypes: true` recommended — distinguish `{ x?: T }` from
  `{ x: T | undefined }`.
- `noEmit: true` in `packages/ui` and any package that publishes source directly.
- Prefer `import type { ... }` for type-only imports.
- Avoid `any`; new code must not use `as any`. Existing carve-outs: better-auth
  inferred types in `apps/web/src/lib/auth-client.ts`, oRPC/Hono error unwrapping
  in `apps/api/src/index.ts` and `packages/api-client/src/index.ts`, Hono context
  typing for the error logger. New occurrences need an inline comment.
- Prefer `unknown` + type guard over `any` for runtime boundaries (catches,
  `JSON.parse`, `fetch().json()`, S3 responses).
- Named types over `ReturnType` patterns. Give a type a top-level `interface`/`type`
  so refactors propagate.
- `as const` on literal arrays (e.g. `ORDER_STATUSES`) — narrows to tuple, not
  `string[]`.
- Zod is the source of truth for runtime input/output shapes. Derive TS types
  via `z.infer<typeof schema>`.
- Discriminated unions with a `kind`/`type` literal field preferred over optional
  fields for variant data.
- Throw `AppError` (from `packages/api/src/core/errors.ts`) for user-facing errors
  with a code from the shared `ERROR_CODES` set; let unhandled exceptions bubble as
  `INTERNAL_ERROR`.
- Catch blocks: rethrow `AppError` unchanged, wrap unknown errors. Never swallow
  silently — log with enough context to debug from logs alone.
- Use `throwNotFound(entity)` and `throwForbidden(...)` from
  `packages/api/src/core/errors.ts` — keeps `ORPCError` codes aligned with
  `ERROR_CODES`.
- Catch blocks typed as `catch (err: unknown)`. Wrap non-`AppError` as
  `INTERNAL_ERROR` with the original message for log correlation.

## Naming

- Files: `kebab-case.ts` / `kebab-case.tsx` for non-component files;
  `PascalCase.tsx` for React components (and their test files when the component
  is the default export).
- Named exports by default; default exports only where a framework requires them
  (Astro components, route components).
- Avoid barrel re-exports unless they cross a package boundary and are part of
  that package's public surface (e.g. `@admin-template/ui/components/forms`).
- One responsibility per file. If a file needs section comment headers
  (`// ── Audit Logs ──`), split into one-per-file once there are 3+ sections.
- Backend handler input schemas: `<entity><Action>InputSchema` (one per procedure).
- Hook naming: `useEntityDataTable`, not `useCustomerTableHook` — name after
  the concern, not the component.
- Query key factories: `<entity>Keys` (e.g. `customerKeys`) co-located in
  `feature/api/queries.ts`.

## Imports

- No direct cross-module imports — reach shared types via `@admin-template/types`
  and `@admin-template/schemas`, not another module's internals.
- `apps/web` consumes packages through published entry points (`@admin-template/ui`,
  `@admin-template/api-client`, `@admin-template/schemas`); never import from a
  package's `src/` directory.
- Boot files (`apps/web/src/main.tsx`, `apps/site/src/...`) must not import page
  or module files — keep the boot layer thin.
- All env access goes through `@admin-template/env` (`server.ts`, `web.ts`). Never
  read raw `process.env` or `import.meta.env` in feature code.
- Server-only env vars must not be imported into client bundles.
- New env vars require an entry in both the schema and `.env.example` on the same PR.
- TanStack Query invalidation uses entity key factories — never literal strings
  like `"customers"`.
- Forms use `useAppForm()` + `useFormFields<T>()` from
  `@admin-template/ui/components/forms/use-form-hooks`.

## Boundaries

### Server / Client / Domain

- Business procedures are organization-scoped via `organizationProcedure`.
- Handlers call `requirePermission(context, permission)` first, before DB work.
- Never trust client-supplied user/org ids — pull from `context` inside the handler.
  Same for `createdBy` / `updatedBy` (from `context.userId`).
- RBAC permission keys live in `@admin-template/types` as `PermissionKey`; reference
  by literal string (`"operations.create"`) inside `requirePermission`.
- Public oRPC procedures must declare `.route({ method, path })` or they won't
  match `/api/*` requests.
- Public endpoints (storefront API, contact form) bypass Better Auth session checks
  but must validate inputs and rate-limit if accepting arbitrary payloads.
- Single-app shell with org-scoped routing via `OrganizationRoute` guard.
- No direct cross-module imports (enforced in both directions).

### Handler Shape

Procedure skeleton in order:

1. `input` Zod schema (named `<entity><Action>InputSchema`)
2. `.handler(async ({ context, input }) => { ... })`
3. `requirePermission(context, "<permission>")`
4. Org scope check from context
5. Existence/lookup with `throwNotFound(...)` on miss
6. Mutation + soft-delete aware `where` clause
7. `auditLog.write(...)` for create/update/delete
8. Return typed payload

- Avoid N+1: use Drizzle `with: { relation: true }` or `inArray` queries.
- Long handlers: split into named helpers at the bottom of the file.
- One router file per business entity group; shared helpers in
  `packages/api/src/core/`.

### Frontend Structure

- React 19 with hooks. TanStack Query for server state, TanStack Form for forms,
  TanStack Table + `nuqs` for list/table URL state, React Router for navigation.
- Components are functional; co-locate small components with their feature page.
  Promote to `@admin-template/ui` only when a second feature needs them.
- Keep components focused: lift data fetches into hooks or `queryOptions` factories.
- One custom hook per concern. List hook dependencies explicitly.
- Server state in TanStack Query. Client-only UI state in component state/context.
  Form state in TanStack Form. URL state in `nuqs`.
- `localStorage` writes for theme prefs go through `next-themes` `setTheme(...)`.
- Routes defined in `apps/web/src/App.tsx` — no second router.
- `OrganizationRoute` wraps dashboard routes; `/onboarding` is authenticated-only.
- Detail pages are sibling files next to their list page (`detail.tsx`).
- Code-split with `lazy()` + `<Suspense>` only when the bundle win is real.
- Memoize only after profiling shows the re-render is a real cost.
- All interactive controls keyboard reachable. Respect `prefers-reduced-motion`.

### Validation

- Reuse schemas from `@admin-template/schemas` rather than redefining locally.
- Normalize optional blank strings to `undefined` with `z.preprocess(...)`.
- Cross-field validation in `superRefine` with `ctx.addIssue(...)`.
- API errors surfaced inline via `formApi.setErrorMap(...)` + `toast.error(...)`.
- Dialog lifecycle: `form.reset(values)` on open/close; cancel calls
  `form.reset(EMPTY_FORM)`.

### Database

- Drizzle ORM for all queries. RLS helper in `packages/api/src/core/rls.ts`
  (SQL policies not yet applied).
- UUID primary keys as text. Generate ids in application code (`randomUUID()`),
  not in the database.
- All business tables: `organizationId text not null` as first tenant column;
  composite index starting with `organizationId` for list filters;
  `createdAt`, `updatedAt`, `deletedAt` (nullable), `createdBy`, `updatedBy`
  on operations tables.
- Foreign keys: always `text` columns referencing other `id` columns. Use
  `references(...)` explicitly. Prefer `"restrict"` for cross-org, `"cascade"`
  for owned child rows.
- Enums: prefer `text` with a Zod enum over Postgres enum type.
- Relational query API for fetches with joins; core API for reports/aggregations.
- Always scope reads by `organizationId` and `deletedAt`. Cross-org queries in
  `db.transaction(...)`.
- Composite index order: `organizationId` first, then equality filters, then sort.
  Never add single-column indexes for columns already leading a composite.
- One migration per logical change. Never edit a checked-in migration.
- `drizzle-kit push --force` restricted to `schemaFilter: ["public"]`.
- `db:generate` output must be committed.

## Dependencies

- S3-compatible object storage (MinIO local, Cloudflare R2 prod). Generic `S3_*`
  env vars. Client singleton in `packages/api/src/core/s3.ts`.
- Binary upload/download routes in `apps/api/src/index.ts` (Hono, not oRPC).
- Attachment metadata in `attachments` table (`entityType` / `entityId`). New
  entity types go in `OPERATIONS_ATTACHMENT_ENTITY_TYPES`. Always use
  `packages/api/src/core/operations-media.ts` for entity-scoped attachments.
- Testing: E2E for user-visible flows, targeted unit tests for non-obvious logic.
  Tests exercise behavior, not plumbing. E2E specs randomize registration data.
- Soft delete only — never `DELETE FROM` business tables. Filter every read with
  `where(deletedAt.isNull())`.
- Audit log entries required on every `create`, `update`, `softDelete`.
- Mutations that may be retried should be idempotent on a client-supplied key
  (not yet enforced — flag the gap in PRs).
- One logical change per commit. Refactors, formatting, and behavior changes
  in separate commits.

## Invariants

- `strict: true` never loosened.
- No `any` in new code without inline justification + follow-up issue.
- Org id from `context.organizationId` — never from client input.
- Never `DELETE FROM` business tables — soft delete only.
- Every list endpoint has a supporting index.
- Env access only through `@admin-template/env`.
- No direct cross-module imports.
- Boot files never import page or module files.
- Query invalidation always uses entity key factories, never literal strings.
- `drizzle-kit push --force` restricted to `schemaFilter: ["public"]`.
