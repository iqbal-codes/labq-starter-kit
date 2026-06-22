# UI Registry

## Registered Patterns

### DataTable Pattern

- Server-side pagination (built-in `DataTablePagination`)
- URL-backed state via `useQueryStates` + `getSortingStateParser` + `parseAsInteger` / `parseAsString` / `parseAsArrayOf`
- Filter widgets chosen from `columnDef.meta.variant` (`text` → `Input`, `number` → numeric `Input` with optional unit, `range` → `DataTableSliderFilter`, `date` / `dateRange` → `DataTableDateFilter`, `select` / `multiSelect` → `DataTableFacetedFilter`)
- Text filters write the generic `search` query param; page-specific column names stay backend implementation details.
- String `columnDef.header` values are auto-wrapped with `DataTableColumnHeader`, so any column that opts in via `enableSorting` or `getCanHide()` gets the sort + hide dropdown for free
- `DataTable` accepts an `actionBar` slot rendered when the filtered selected row model is non-empty
- `placeholderData: (previous) => previous` keeps stale rows visible during transitions
- `DataTableSkeleton` shows only on first load (`!data && isLoading`)
- Dialog for create/edit stays local to each page
- Actions column id is always `"actions"`, right-pinned, non-hideable
- Used in: `leads`, `contacts`, `companies`, `deals`


### Module CRUD Dialog Form Pattern

- `useAppForm` with `defaultValues`, `validators: { onSubmit: schema }`, `onSubmitInvalid: scrollToFirstError()`
- `useFormFields<T>()` for type-safe field names (`FormTextField`, `FormSelectField`, `FormComboboxField`, `FormNumberField`, `FormTextareaField`, `FormCheckboxField`, `FormDatePickerField`); import from `@labq-modules/ui/components/forms/use-form-hooks`
- Dialog lifecycle: `form.reset(values)` in open/close handlers; `onOpenChange(false)` clears editing state and resets form
- `form.AppForm` → `form.Form` → fields → `DialogFooter` with cancel `Button type="button"` + `form.SubmitButton`
- Cancel button and `onOpenChange(false)` both call `form.reset(EMPTY_FORM)` to prevent stale values leaking
- Conditional fields: `listeners.onChange` on a discriminated field clears hidden dependent fields via `fieldApi.form.setFieldValue()`
- Cross-field validation: Zod `superRefine` with per-field `ctx.addIssue({ path: [...] })` for targeted error display
- Form-level errors: `<FormErrors />` rendered above fields as a safety net for cross-field issues
- Used in: `leads`, `companies`, `contacts`, `deals`, `pipeline`, `products`, `locations`, `movements`

### Shared CRM Types/Constants/Schemas Pattern

- Active source of truth lives in `apps/web/src/features/shared/` (`types.ts`, `constants.ts`, `form-schemas.ts`, `use-crm-lookups.ts`)
- Active CRM pages import shared row types, option arrays, empty forms, sort ids, CSV columns, and Zod schemas from this folder
- A few older feature-level helper files still exist, but the shared folder is what current pages use
- Form types use optional strings where needed to align with Zod output types

### Activity Timeline Pattern

- Reusable `ActivityTimeline` component takes `entityType` + `entityId`
- Uses `useQuery` for activity list + `useMutation` for create/update/delete
- Create/edit happens in an inline `Dialog` backed by `useAppForm`
- Permission-gated: create/update requires `crm.update`, delete requires `crm.delete`
- Used in: lead detail page, contact detail page, company detail page, deal detail page

### Lead Conversion Pattern

- Separate `ConvertLeadDialog` with conditional Zod schema (`superRefine`)
- One click creates Contact + optional Company + optional Deal, then marks the Lead as converted
- Preserves the lead record with conversion metadata (`convertedContactId`, `convertedCompanyId`, `convertedDealId`, `convertedAt`)
- Invalidates lead, contact, company, deal, and summary queries on success
- Used in: `apps/web/src/features/leads/page.tsx`

### Pipeline Stage Admin Pattern

- Stage cards render inside a horizontal `ScrollArea`; the board itself stays `w-max` so the scrollbar tracks real column width instead of a forced full-width container
- Shared `KanbanBoard` uses horizontal `items-start`, and `KanbanColumn` defaults to content height instead of stretching to the tallest sibling
- Deal cards can be dragged across stages; board UI follows `Kanban` `onValueChange`, persistence side effects run from `onDragEnd` against the latest board ref
- Destructive stage retirement uses `AlertDialog`; the empty board state uses the shared `Empty` primitives
- Stages sort by `sortOrder` ascending
- Used in: `apps/web/src/features/pipeline/page.tsx`

### CRM Lookup Hook Pattern

- `useCrmLookups()` returns company/contact/stage options + name-by-id maps
- Single hook used by multiple pages to avoid duplicate queries
- Returns `companyOptions`, `contactOptions`, `stageOptions`, `companyNameById`, `contactNameById`, `stageNameById`
- Used in: `apps/web/src/features/leads/page.tsx`, `apps/web/src/features/deals/page.tsx`, `apps/web/src/features/contacts/page.tsx`

### CSV Import/Export Pattern

- Reusable CSV import dialog (`CsvImportDialog<TRow>`) in `@labq-modules/ui/components/import-export/csv-import-dialog`
- Accepts generic `columns`, `schema`, `onImport` props — UI-focused, not API-aware
- File upload uses the shared `FileUploader` (react-dropzone), CSV parsing uses PapaParse
- Preview phase renders the first 25 rows in `Table` (not `DataTable`), plus per-row validation errors
- Client-side validation blocks import; server-side partial failures keep the dialog open with an inline summary + error CSV download
- Export uses `downloadCsv()` from `@labq-modules/ui/lib/csv`
- Permission gating lives in the `DataTableToolbar` right-side children slot for Export / Import actions
- Schema contract: `CONTACT_IMPORT_EXPORT_FIELDS` in `@labq-modules/schemas` defines the round-trippable CSV column set
- Used in: `apps/web/src/features/contacts/page.tsx`

### DataTable Row-Click Detail Pattern

- Optional `onRowClick` prop on `DataTable` — opt-in per page
- When present, each `TableRow` gets `onClick` + `cursor-pointer`
- Empty-state row stays inert (no click handler)
- Action buttons use `e.stopPropagation()` to prevent accidental navigation
- CRM list pages navigate to dedicated detail routes (`/crm/leads/:id`, `/crm/contacts/:id`, `/crm/companies/:id`, `/crm/deals/:id`) instead of opening an inline sheet
- Used in: `leads`, `contacts`, `companies`, `deals`

### CRM Detail Page Pattern

- Detail routes live beside list pages as sibling `detail.tsx` files
- Pages use `PageContainer width="7xl"` + `PageHeader` with an explicit back button
- Loading and not-found states reuse the same layout shell instead of swapping to a separate screen pattern
- Detail content is a simple stacked layout with `Separator`s between sections; `ActivityTimeline` sits below the record facts, and contacts append `ContactAttachmentsPanel`
- Used in: `apps/web/src/features/leads/detail.tsx`, `apps/web/src/features/contacts/detail.tsx`, `apps/web/src/features/companies/detail.tsx`, `apps/web/src/features/deals/detail.tsx`

### Attachment Panel Pattern

- `ContactAttachmentsPanel` renders `FileUploader` + file list
- Upload and download go through Hono binary routes via `fetch`; list and delete go through oRPC queries/mutations
- Invalidates only the attachment-list query, not the parent table
- Permission-gated: upload requires `crm.create`, delete requires `crm.delete`
- Used in: `apps/web/src/features/contacts/components/contact-attachments-panel.tsx`

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

- Organization and module settings stay out of primary nav
- Settings entry points live in the sidebar user menu
- Module settings page uses stacked cards with per-module switches
- Runtime-inactive dev modules are hidden instead of shown as disabled toggles
- Used in: `apps/web/src/features/navigation/components/sidebar-user-menu.tsx`, `apps/web/src/features/settings/organization/page.tsx`, `apps/web/src/features/settings/modules/page.tsx`

### Assistant Sheet Pattern

- Floating shell-wide trigger opens a responsive assistant `SheetContent`: full-width bottom sheet on mobile with its natural content height preserved, right-side panel on desktop, with monochrome chrome, compact header, a native scrollable transcript pane, and a bottom-docked composer
- Transcript hydrates from persisted Mastra / AI SDK `UIMessage` history via `/api/ai/chat/history?all=true`, renders the newest 20 messages first, and reveals older slices through a top `Load earlier` pill without jumping the reader
- Transcript scroll state is tracked from the actual overflow container, which enables the floating `Scroll to bottom` button only when the user has moved away from the latest messages
- Composer is disabled while history is restoring, while the assistant is streaming, and while a pending approval is resuming; streaming state renders a three-dot typing indicator inline in the last assistant bubble once that `UIMessage` exists, falling back to a standalone row when the last message is not from the assistant. Auto-scroll and typing animation both respect `prefers-reduced-motion: reduce`. Message bubbles enforce `min-w-0 break-words`
- Used in: `apps/web/src/features/assistant/components/assistant-button.tsx`, `apps/web/src/features/assistant/components/assistant-sheet.tsx`

### Module Guard Pattern

- Redirect to `/` if the module is disabled
- Redirect to `/` if the module is not active in the current runtime session
- Redirect to `/` if the required permission is missing
- Render `Outlet` on success

### PageHeader Pattern

- `PageHeader` from `@labq-modules/ui/components/page-header`
- Props: `title` (required), `subtitle`, `actions`, `backButton`, `className`
- `actions` and `backButton` are ReactNode slots — each page decides behavior
- No built-in router logic; back navigation is explicit per page
- Responsive: stacks on mobile, left/right aligned on desktop
- Used in: `companies`, `contacts`, `deals`, `leads`, `overview`, `pipeline`, `products`, `locations`, `movements`, `balances`

### PageContainer Pattern

- `PageContainer` from `@labq-modules/ui/components/page-container`
- Props: `width` (`'full'` | `'7xl'` | `'6xl'` | `'5xl'` | `'4xl'` | `'3xl'` | `'xl'`), `className`, plus standard div props
- Default full-width wrapper: `flex flex-1 flex-col gap-4 p-6`
- Narrower widths center with `mx-auto w-full max-w-{width}`
- CRM detail routes currently standardize on `width="7xl"`

### Layout Header Breadcrumb Pattern

- Dynamic path-based breadcrumbs map `location.pathname` segments with the shared `<Breadcrumb>` components
- Prepends the active organization name (from `useOrganization`) or `LabQ` as the root breadcrumb linking to `/`
- Maps module segments through `shellModules` (`crm` → `CRM`, etc.) and capitalizes the remaining path segments
- Non-terminal breadcrumbs render as `<Link>`s by default; the current muted exception is `/settings`, because there is no standalone settings index route
- Header right side hosts the shared `AnimatedThemeToggler` circle variant
- Used in: `apps/web/src/components/layout/header.tsx`

### CRM Overview / Dashboard Pattern

- **Directory Status Banner**: Group related metrics (Leads, Contacts, Companies) side-by-side in a single `Card` with vertical dividers (`md:border-l border-border/50`) to avoid identical card grids. Apply hover states (`hover:bg-muted/50 rounded-2xl transition-all cursor-pointer`) to encourage exploration of list pages.
- **Sales Pipeline Progress Visualizer**:
  - Dynamic calculation of active pipeline value (excluding terminal `won`/`lost` stages).
  - Custom horizontal progress bar representing stage value shares of total active pipeline.
  - Monochrome opacity steps (`bg-foreground`, `bg-foreground/80`, `bg-foreground/60`, `bg-foreground/40` etc.) to represent progression without brand accents.
  - Stage cards grid below separating open stages from closed terminal ones (dashed borders, muted backgrounds).
- **Outcomes & Velocity Panel**:
  - Dual-segmented progress bar showing historical win rate (Won vs Lost deals).
  - Task Pressure indicators: if overdue tasks exist, display a warning card with destructive accent (`bg-destructive/5 text-destructive border-destructive/20`) and action button; otherwise, display a clean checkmark state.
- **Used in**: `apps/web/src/features/overview/page.tsx`
