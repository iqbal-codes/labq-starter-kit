# UI Registry

## Registered Patterns

### DataTable Pattern

- Server-side pagination (built-in `DataTablePagination`)
- URL-backed state via `useQueryStates` + `getSortingStateParser` + `parseAsInteger` / `parseAsString` / `parseAsArrayOf`
- Filter widgets chosen from `columnDef.meta.variant` (`text` → `Input`, `number` → numeric `Input` with optional unit, `range` → `DataTableSliderFilter`, `date` / `dateRange` → `DataTableDateFilter`, `select` / `multiSelect` → `DataTableFacetedFilter`)
  +- Non-text filter widgets (`select`, `multiSelect`, `date`, `dateRange`, `range`, `number`) align with the searchbar on the left on desktop (≥ md). On mobile (< md), they collapse behind a single "Filter" trigger button that opens a `Dialog` containing all filter widgets stacked vertically, plus "Reset" and "Done" buttons.
- Text filters write the generic `search` query param; page-specific column names stay backend implementation details.
- String `columnDef.header` values are auto-wrapped with `DataTableColumnHeader`, so any column that opts in via `enableSorting` or `getCanHide()` gets the sort + hide dropdown for free
- `DataTable` accepts an `actionBar` slot rendered when the filtered selected row model is non-empty
- `placeholderData: (previous) => previous` keeps stale rows visible during transitions
- `DataTableSkeleton` shows only on first load (`!data && isLoading`)
- Dialog for create/edit stays local to each page
- Actions column id is always `"actions"`, right-pinned, non-hideable
- Used in: `customers`, `services`, `orders`

### Module CRUD Dialog Form Pattern

- `useAppForm` with `defaultValues`, `validators: { onSubmit: schema }`, `onSubmitInvalid: scrollToFirstError()`
- `useFormFields<T>()` for type-safe field names (`FormTextField`, `FormSelectField`, `FormComboboxField`, `FormNumberField`, `FormTextareaField`, `FormCheckboxField`, `FormDatePickerField`); import from `@admin-template/ui/components/forms/use-form-hooks`
- Dialog lifecycle: `form.reset(values)` in open/close handlers; `onOpenChange(false)` clears editing state and resets form
- `form.AppForm` → `form.Form` → fields → `DialogFooter` with cancel `Button type="button"` + `form.SubmitButton`
- Cancel button and `onOpenChange(false)` both call `form.reset(EMPTY_FORM)` to prevent stale values leaking
- Conditional fields: `listeners.onChange` on a discriminated field clears hidden dependent fields via `fieldApi.form.setFieldValue()`
- Cross-field validation: Zod `superRefine` with per-field `ctx.addIssue({ path: [...] })` for targeted error display
- Form-level errors: `<FormErrors />` rendered above fields as a safety net for cross-field issues
- Used in: `customers`, `services`, `orders`

### Shared Operations Types/Constants/Schemas Pattern

- Active source of truth lives in `apps/web/src/features/operations/shared/` (`types.ts`, `constants.ts`, `form-schemas.ts`, `use-operations-lookups.ts`)
- Active operations pages import shared row types, option arrays, empty forms, sort ids, and Zod schemas from this folder
- A few older feature-level helper files still exist, but the shared folder is what current pages use
- Form types use optional strings where needed to align with Zod output types

- Reusable `ActivityTimeline` component takes `entityType` + `entityId`
- Uses `useQuery` for activity list + `useMutation` for create/update/delete
- Create/edit happens in an inline `Dialog` backed by `useAppForm`
- Permission-gated: create/update requires `operations.update`, delete requires `operations.delete`
- **Note**: Activity timeline is not currently implemented in the operations module

- **Note**: Lead conversion is not implemented in the operations module

- **Note**: Pipeline stage admin is not implemented in the operations module

### Operations Lookup Hook Pattern

- `useOperationsLookups()` returns customer/service options + name-by-id maps
- Single hook used by multiple pages to avoid duplicate queries
- Returns `customerOptions`, `serviceOptions`, `customerNameById`, `serviceNameById`
- Used in: `apps/web/src/features/orders/page.tsx`

### CSV Import/Export Pattern

- Reusable CSV import dialog (`CsvImportDialog<TRow>`) in `@admin-template/ui/components/import-export/csv-import-dialog`
- Accepts generic `columns`, `schema`, `onImport` props — UI-focused, not API-aware
- File upload uses the shared `FileUploader` (react-dropzone), CSV parsing uses PapaParse
- Preview phase renders the first 25 rows in `Table` (not `DataTable`), plus per-row validation errors
- Client-side validation blocks import; server-side partial failures keep the dialog open with an inline summary + error CSV download
- Export uses `downloadCsv()` from `@admin-template/ui/lib/csv`
- Permission gating lives in the `DataTableToolbar` right-side children slot for Export / Import actions
- **Note**: CSV import/export is not currently implemented in the operations module

### DataTable Row-Click Detail Pattern

- Optional `onRowClick` prop on `DataTable` — opt-in per page
- When present, each `TableRow` gets `onClick` + `cursor-pointer`
- Empty-state row stays inert (no click handler)
- Action buttons use `e.stopPropagation()` to prevent accidental navigation
- Entity list pages use this pattern for row interactions
- Used in: `customers`, `services`, `orders`

- Detail routes live beside list pages as sibling `detail.tsx` files
- Pages use `PageContainer width="7xl"` + `PageHeader` with an explicit back button
- Loading and not-found states reuse the same layout shell
- Detail content is a simple stacked layout with `Separator`s between sections
- **Note**: Detail pages are not currently implemented in the operations module

- Attachment panel renders `FileUploader` + file list
- Upload and download go through Hono binary routes via `fetch`; list and delete go through oRPC queries/mutations
- Invalidates only the attachment-list query, not the parent table
- Permission-gated: upload requires `operations.create`, delete requires `operations.delete`
- **Note**: Attachment panel is not currently implemented in the operations module

### Empty State Pattern

- Shared empty-state primitives: `Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`, optional `EmptyMedia`
- Used where a feature needs a richer no-data state than a table placeholder
- Used in: `apps/web/src/features/pipeline/page.tsx`

### Organization Selector Pattern

- Sidebar brand (`SidebarBrand`) acts as the organization switcher trigger
- Trigger shows `Building2` icon, active org name from `useOrganization()`, and `ChevronsUpDown` indicator
- Available orgs come from `authClient.useListOrganizations()`; active org from `useOrganization()`
- Dropdown items show org name with `Check` icon on the active org
- Clicking an org calls `authClient.organization.setActive({ organizationId })`, clears React Query cache, navigates to `/overview`
- Final item after separator: `Create organization` with `Plus` icon, navigates to `/onboarding`
- Edge states: loading (disabled "Loading organizations" item), empty (disabled "No organizations found" item + Create)
- Used in: `apps/web/src/features/navigation/components/sidebar-brand.tsx`

### Organization Onboarding Pattern

- Reuses `AuthFormLayout` for focused, sidebar-free page
- Single `FormTextField` for organization name with `createOrganizationSchema` validator
- On submit: `orpc.organization.create.mutateAsync(value)` → `authClient.organization.setActive({ organizationId })` → `queryClient.clear()` → `navigate('/overview', { replace: true })`
- Error handling: keeps user on `/onboarding`, shows `toast.error`, does not navigate to CRM
- Route lives inside `ProtectedRoute` but outside `DashboardLayout` — no sidebar or header chrome
- Used in: `apps/web/src/features/onboarding/page.tsx`

### Settings Pattern

- Settings entry points live in the sidebar user menu
- Organization settings page uses stacked cards
- Used in: `apps/web/src/features/navigation/components/sidebar-user-menu.tsx`, `apps/web/src/features/settings/organization/page.tsx`

### Assistant Sheet Pattern

- Floating shell-wide trigger opens a responsive assistant `SheetContent`: full-width bottom sheet on mobile with its natural content height preserved, right-side panel on desktop, with monochrome chrome, compact header, a native scrollable transcript pane, and a bottom-docked composer
- Transcript hydrates from persisted Mastra / AI SDK `UIMessage` history via `/api/ai/chat/history?all=true`, renders the newest 20 messages first, and reveals older slices through a top `Load earlier` pill without jumping the reader
- Transcript scroll state is tracked from the actual overflow container, which enables the floating `Scroll to bottom` button only when the user has moved away from the latest messages
- Composer is disabled while history is restoring, while the assistant is streaming, and while a pending approval is resuming; streaming state renders a three-dot typing indicator inline in the last assistant bubble once that `UIMessage` exists, falling back to a standalone row when the last message is not from the assistant. Auto-scroll and typing animation both respect `prefers-reduced-motion: reduce`. Message bubbles enforce `min-w-0 break-words`
- Used in: `apps/web/src/features/assistant/components/assistant-button.tsx`, `apps/web/src/features/assistant/components/assistant-sheet.tsx`

### Module Guard Pattern

- Redirect to `/onboarding` if no active organization in session
- Redirect to `/` if the required permission is missing
- Render `Outlet` on success

### PageHeader Pattern

- `PageHeader` from `@admin-template/ui/components/page-header`
- Props: `title` (required), `subtitle`, `actions`, `backButton`, `className`
- `actions` and `backButton` are ReactNode slots — each page decides behavior
- No built-in router logic; back navigation is explicit per page
- Responsive: stacks on mobile, left/right aligned on desktop
- Used in: `customers`, `services`, `orders`, `overview`

### PageContainer Pattern

- `PageContainer` from `@admin-template/ui/components/page-container`
- Props: `width` (`'full'` | `'7xl'` | `'6xl'` | `'5xl'` | `'4xl'` | `'3xl'` | `'xl'`), `className`, plus standard div props
- Default full-width wrapper: `flex flex-1 flex-col gap-4 p-6`
- Narrower widths center with `mx-auto w-full max-w-{width}`

### Settings Pattern

- Settings entry points live in the sidebar user menu
- Organization settings page uses stacked cards
- Used in: `apps/web/src/features/navigation/components/sidebar-user-menu.tsx`, `apps/web/src/features/settings/organization/page.tsx`

### Layout Header Breadcrumb Pattern

- Dynamic path-based breadcrumbs map `location.pathname` segments with the shared `<Breadcrumb>` components
- Prepends the active organization name (from `useOrganization`) or `Admin App Template` as the root breadcrumb linking to `/`
- Maps module segments and capitalizes the remaining path segments
- Non-terminal breadcrumbs render as `<Link>`s by default; the current muted exception is `/settings`, because there is no standalone settings index route
- Header right side hosts the shared `AnimatedThemeToggler` circle variant
- Used in: `apps/web/src/components/layout/header.tsx`

### Operations Overview / Dashboard Pattern

- **Metric Cards**: Group related metrics (Customers, Services, Orders, Open Orders, Completed Orders) in a responsive grid of `Card` components with icons and count values
- Uses `orpc.operations.summary.queryOptions()` for data
- Skeleton loading state with `Skeleton` component
- Navigation buttons to entity list pages
- **Used in**: `apps/web/src/features/overview/page.tsx`

### Query Abstraction Pattern

- Per-feature `api/queries.ts` exports `<entity>Keys` (key factory) and `<entity>ListQueryOptions(input)` (query options factory using oRPC's `.queryOptions()`)
- Per-feature `api/mutations.ts` exports `create<Entity>Mutation()`, `update<Entity>Mutation()`, `softDelete<Entity>Mutation()` (mutation options factories using oRPC's `.mutationOptions()`)
- Shared `operations/api/queries.ts` exports `operationsKeys` and summary/list query options for cross-entity use
- `useEntityDataTable` hook consumes typed factory refs and composes via spread: `useMutation({ ...factory(), onSuccess })`
- Hook uses `useQueryClient()` from React context for invalidation (not `getQueryClient()` from UI package)
- **Used in**: `customers/`, `services/`, `orders/`, `organization/`, `operations/` feature directories

### API Error Surfacing in Forms

- Forms that call APIs in `onSubmit` must surface server-side errors inline, not just in a toast.
- Pattern: `try { api call } catch (error) { formApi.setErrorMap({ onSubmit: { form: errorMessage, fields: {} } }); toast.error(errorMessage); }`.
- The existing `<FormErrors>` component subscribes to `state.errors` and renders a `role="alert"` banner.
- Both channels are used: inline (persistent, a11y) + toast (redundant notification).
- For Better Auth auth forms, map known `error.status` / `error.code` values to user-friendly messages; fall back to `error.message`.
- For the shared CRUD pattern (`useEntityDataTable`), the hook's `onSubmit` catches API errors via `formApi.setErrorMap` and `EntityFormDialog` renders `<FormErrors />` inside the form context.
- Used in: `sign-in.tsx`, `sign-up.tsx`, `onboarding/page.tsx`, `use-entity-data-table.ts` (customers, services, orders)
