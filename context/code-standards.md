# Code Standards

## TypeScript

- Strict mode enabled
- Avoid `any`; new code should not use `as any` casts
- Named types over `ReturnType` patterns
- Business tables are organization-scoped; CRM tables carry `deletedAt` / `createdBy` / `updatedBy`

## Backend

- Business procedures are organization-scoped via `organizationProcedure`
- Soft delete means `deletedAt` + query filters where the table supports it
- Audit logging happens on write operations
- Server-side validation uses Zod schemas
- Error codes stay as string literals from shared `ERROR_CODES`
- CRM handlers call `requirePermission(context, permission)` at the start of the handler, before DB work

## Frontend

- React 19 with hooks
- TanStack Query for server state — query abstractions use `queryOptions`/`mutationOptions` factories in per-feature `api/queries.ts` + `api/mutations.ts` files; use `useQueryClient()` for invalidation (not `getQueryClient()` from UI package)
- TanStack Form for forms — import hooks from `@admin-template/ui/components/forms/use-form-hooks`, primitives from `@admin-template/ui/components/forms/form-context`
- TanStack Table + `nuqs` for list/table URL state
- React Router for navigation
- Single-app shell with org-scoped routing via `OrganizationRoute` guard
- No direct cross-module imports
- Runtime extraction: `src/runtime.ts` for shared API/query setup
- Auth forms use `useAppForm()` + `useFormFields<T>()`
- No page/module file imports from boot files (`main.tsx`)

## Organization Routing

- `OrganizationRoute` wraps all dashboard routes — redirects to `/onboarding` if no active org
- `/onboarding` is authenticated-only (outside `DashboardLayout`, inside `ProtectedRoute`)
- Sidebar brand (`SidebarBrand`) is the organization selector — dropdown lists orgs, switches active org via Better Auth `setActive`, supports creating new orgs
- Org creation uses `orpc.organization.create` with slug generation, workspace table initialization, and transactional insert

## Database

- Drizzle ORM for all queries
- RLS helper exists in `packages/api/src/core/rls.ts`, but SQL policies are not applied yet
- UUID primary keys stored as text
- Timestamp columns currently use Drizzle `timestamp()` defaults (no timezone mode configured)
