# Library Documentation

## Better Auth 1.6.11

- Organization plugin: `organization({ ac, roles })`
- Access control: `createAccessControl(statement)`
- Roles: `ac.newRole({ module: ["enable", "disable"] })`
- Session includes: user, activeOrganization, activeMember

## Hono + @hono/node-server

- `Hono()` hosts both the oRPC handlers and the binary attachment routes in `apps/api/src/index.ts`
- `serve({ fetch: app.fetch, port })` comes from `@hono/node-server`
- Use plain Hono routes when the endpoint is not a good fit for oRPC (for example multipart upload / binary download)

## AI SDK 6.0.208 + `@ai-sdk/react` 3.0.210

- Shell assistant uses `useChat<UIMessage>()` from `@ai-sdk/react`
- Backend streams assistant responses with `createUIMessageStream()` + `createUIMessageStreamResponse()` from `ai`
- History replay validates stored assistant transcripts with `safeValidateUIMessages()` before hydrating the UI
- Streaming loader UX should key off the last assistant `UIMessage` and whether any text parts have arrived, not `status` alone

## Mastra 1.x (`@mastra/core`, `@mastra/memory`, `@mastra/pg`, `@mastra/ai-sdk`)

- `apps/api/src/mastra/index.ts` creates the Mastra runtime and registers `labqAssistantAgent`
- `@mastra/core/agent` provides `Agent`; `@mastra/core/tools` provides `createTool`; `@mastra/core/request-context` carries user/org/module/permission context into tools
- `@mastra/memory` `Memory({ storage, options: { lastMessages: 50 } })` backs assistant thread replay
- `@mastra/pg` `PostgresStore({ connectionString, schemaName: "mastra" })` persists Mastra tables in a dedicated PostgreSQL schema
- `@mastra/ai-sdk` `toAISdkStream(stream, { from: "agent", version: "v6" })` bridges Mastra agent streams into the AI SDK UI stream format used by the shell
- Tool approvals resume through `agent.approveToolCall({ runId, toolCallId })` / `agent.declineToolCall({ runId, toolCallId })`

## oRPC

- Procedures: `os.$context<Context>()`
- Middleware: `.middleware(async ({ context, next }) => {})`
- Error: `new ORPCError("CODE", { message })`
- Handler: `.handler(async ({ context, input }) => {})`

## Drizzle ORM

- Schema: `pgTable(...)` with column builders from `drizzle-orm/pg-core`
- Query: `db.query.tableName.findMany({ where, limit, offset })`
- Insert: `db.insert(table).values({})`
- Update: `db.update(table).set({}).where()`
- Relations: `relations(table, ({ one, many }) => ({}))`

## drizzle-kit

- Drives schema lifecycle in `packages/db` (`db:generate`, `db:migrate`, `db:push`, `db:studio`)
- `drizzle-kit push --force` can accept destructive changes automatically; this repo now constrains it to `schemaFilter: ["public"]` so Mastra-owned tables in schema `mastra` are left alone

## @module-federation/vite

- Host remotes format: `{ type: "module", name, entry, entryGlobalName, shareScope }`
- Remote exposes: `{ name, filename: "remoteEntry.js", exposes: { "./module": "./src/module.tsx" } }`
- Shared singletons: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `nuqs`
- Remote must set `server.origin` for correct `remoteEntry.js` URLs
- Remote routes stay relative when shell mounts them at `/*`

## vite-plus (`vp`)

- Workspace runner used from the repo root (`vp run -r check-types`, `vp dev apps/web`, `vp run --filter ./packages/db db:push`)
- `vp config` runs from the root `prepare` script
- Treat it as the repo-level task runner, not Turborepo

## TanStack Form

- `useAppForm({ defaultValues, validators: { onSubmit: schema }, onSubmit })`
- `useFormFields<FormValues>()` returns typed field components
- Canonical import: `@admin-template/ui/components/forms/use-form-hooks` (hooks) and `@admin-template/ui/components/forms/form-context` (primitives)
- Legacy barrel at `@admin-template/ui/components/forms/tanstack-form` re-exports everything for backwards compat
- Field components include `FormTextField`, `FormSelectField`, `FormTextareaField`, `FormNumberField`
- Validation: `validators: { onSubmit: z.object({...}) }` for form-level rules
- Field validation: `validators: { onBlur, onChangeAsync }` for per-field rules
- `form.AppForm` → `form.Form` → fields → `form.SubmitButton`

## TanStack Query

- Query abstractions use `queryOptions`/`mutationOptions` factories in per-feature `api/queries.ts` + `api/mutations.ts` files
- Factories use oRPC's `.queryOptions()` and `.mutationOptions()` methods directly (not TanStack Query's `queryOptions()`)
- Key factories co-located in `queries.ts`: `<entity>Keys = { all, lists, list, details, detail }`
- Hook (`useEntityDataTable`) uses `useQueryClient()` from React context for invalidation (not `getQueryClient()` from UI package)
- Composition at call site via spread: `useMutation({ ...factory(), onSuccess: ... })`
- See `.agents/skills/shadcn-dashboard/references/query-abstractions.md` for full rationale

## TanStack Table

- `ColumnDef<T>` powers the shared DataTable wrapper
- `columnDef.meta.variant` selects the filter UI (`text`, `select`, `date`, `slider`)
- Pages keep columns close to feature code; shared table chrome lives in `@admin-template/ui/components/table`

## nuqs

- Shell bootstraps `NuqsAdapter` from `nuqs/adapters/react-router/v7`
- `apps/web/src/module.tsx` re-wraps its `<Routes>` in a local `NuqsAdapter` so URL state stays live even if the shared-scope adapter fails to resolve from the remote
- Feature pages use `useQueryStates(...)` + parser helpers to keep table pagination, filters, and sorting in the URL
- `useDataTable` debounces filter URL writes (300ms default) and routes text-variant column filters to a single `search` query key

## @dnd-kit/\*

- Shared drag-and-drop primitives behind `packages/ui/src/components/kanban.tsx`
- CRM pipeline uses the shared Kanban exports for column and card movement

## sonner

- Root toast host: `<Toaster richColors position="top-right" />` in `apps/web/src/main.tsx`
- Feature hooks and pages use `toast.success(...)` / `toast.error(...)`
- `packages/ui/src/components/sonner.tsx` provides a themed wrapper when needed

## PapaParse

- CSV parsing and serialization library
- `Papa.parse(file, { header: true, skipEmptyLines: true })` for CSV → objects
- `Papa.unparse({ fields, data })` for objects → CSV string
- Used in `@admin-template/ui/lib/csv` for shared import/export utilities
- Note: parsing `File` objects in Node test environments needs browser-compatible APIs

## react-dropzone

- Underpins `@admin-template/ui/components/file-uploader`
- Used for CSV import and CRM contact attachment upload flows

## recharts

- Wrapped by `packages/ui/src/components/chart.tsx`
- Use the wrapper instead of raw Recharts primitives in feature code so chart theming stays token-driven

## Zod

- Shared validation layer for backend input validation and frontend form validation
- `z.object({...})` for object schemas, `.partial()` for optional fields, `.omit()` for subsets
- `safeParse()` powers non-throwing row validation in import dialogs
- Shared schemas live in `@admin-template/schemas`; UI consumes them directly where helpful

## @aws-sdk/client-s3

- S3-compatible client for MinIO locally and Cloudflare R2 in production
- `S3Client` configured with `endpoint`, `region`, `forcePathStyle`, `credentials`
- `PutObjectCommand`, `GetObjectCommand`, and `DeleteObjectCommand` back the attachment flows
- `forcePathStyle: true` is required for MinIO and still works with R2
- Singleton client lives in `packages/api/src/core/s3.ts`

## @t3-oss/env-core

- Schema-validates environment variables in `packages/env/src/server.ts`
- Frontend env parsing lives in `packages/env/src/web.ts`
- Keep env parsing centralized here rather than reading raw `process.env` / `import.meta.env` throughout apps

## @react-email/components + resend

- `packages/email/src/client.ts` creates the Resend client when `RESEND_API_KEY` is present
- `packages/email/src/templates/verification.tsx` renders the verification email with React Email components
- Email is a supporting package; most app flows still work without a configured Resend client in local development

## tsx

- Root `create:module` script uses `tsx scripts/create-module.ts` to run the TypeScript generator without a build step
- Keep it as dev tooling only; generated app code should still be checked with each app's `tsc --noEmit` script

## react-doctor

- `npx react-doctor@latest <dir> -y` scans for React bugs, perf issues, and architecture problems
- Use it as an audit tool, not as a replacement for typecheck / lint / tests

## fallow

- `npx fallow audit` detects dead code, duplication, and complexity issues
- Useful for repo hygiene sweeps and changed-file audits
