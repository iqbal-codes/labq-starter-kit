# Build Plan

## Phase 1: Foundation ✅

- Monorepo scaffold (pnpm workspace)
- Shared packages (types, schemas, api-client)
- Docker + PostgreSQL + MinIO

## Phase 2: Auth & Org ✅

- Better Auth with Organization plugin
- Signup/sign-in/active org restoration
- Role-based permissions (owner/admin/member/viewer)
- Org settings + module enable/disable

## Phase 3: API Layer ✅

- Hono + oRPC router setup
- Organization CRUD
- CRM: contacts, companies, deals, deal_stages, leads, activities
- ~~Inventory: products, locations, movements, balances~~ (deleted in single-app refactor)
- Audit logging on all write paths
- S3-backed attachment support for CRM contacts

## Phase 4: Database Schema ✅

- CRM: contacts, companies, deals, deal_stages, leads, crm_activities
- ~~Inventory: products, locations, movements, balances~~ (deleted in single-app refactor)
- Audit logs
- Auth: organization, member, session tables

## Phase 5: Backend API ✅

- Organization module (getContext, updateProfile)
- CRM module (contacts, companies, deals, leads, stages, activities CRUD + summary + lead conversion)

## Phase 6: Shell App ✅

- Auth flow (sign-up, sign-in, sign-out)
- Dashboard layout with sidebar navigation
- Organization onboarding flow
- Settings pages (organization)

## Phase 7: Operations Features ✅ (rewritten)

- Overview page with summary metrics
- Customers: CRUD, avatar upload via S3, dedicated detail page
- Services: CRUD, photo upload via S3, dedicated detail page
- Orders: CRUD with customer/service associations, dedicated detail page

- ~~CRM features (leads, contacts, companies, deals, pipeline, activities)~~ (deleted during single-app refactor)
- ~~Products, Locations, Movements, Balances CRUD~~ (deleted during single-app refactor)

## Phase 9: Remaining

- RLS SQL policies
- Workspace typecheck cleanup (`packages/env/src/web.ts` currently fails on `import.meta.env` typing)

## Phase 10: Completed

- ~~E2E test coverage for data-table URL state~~ (done; lives in `e2e/data-table.spec.ts`)
- ~~React Doctor audit fix pass~~ (score 47 → 68, 0 errors, 74 warnings remaining)
- ~~Fallow audit cleanup~~ (dead files, unused exports, circular deps, duplication)
- ~~Module code generator~~ (repo-local `pnpm create:module` script, CRM-pattern templates, strict registry patching, auto-port selection)
- ~~Agentic AI assistant integration~~ (Mastra-backed shell assistant with history replay, tool approvals, and dedicated Playwright coverage)
- ~~Mastra persistence schema isolation~~ (`mastra` schema, `schemaFilter: ["public"]`, and startup migration of stray `public.mastra_*` tables)

## Phase 11: Organization Onboarding ✅

- Removed automatic organization creation from signup (`user-create-after.ts`, `databaseHooks.user.create.after`)
- Added `/onboarding` page — single-field org name form, creates org via `orpc.organization.create`, sets active org via Better Auth `setActive`
- Added `OrganizationRoute` guard — redirects to `/onboarding` if no active org in session
- Sidebar brand converted to organization selector (`SidebarBrand`) — dropdown with org list, switch active org, create new org
- Added `organization.create` procedure with slug generation (`slugifyOrganizationName`), unique slug resolution, and transactional workspace table initialization (`insertInitialWorkspaceTables`)
- Added `createOrganizationSchema` in `@admin-template/schemas`
- Exported `DEFAULT_DEAL_STAGES` and `insertInitialWorkspaceTables` from `packages/auth/src/seed.ts`
- Removed `repair-orphaned-workspace.ts` and `repair:orphaned-workspace` script
- Removed stale `Modules` nav item from sidebar user menu
- E2E tests updated: signup expects `/onboarding` flow, sidebar org selector verified
- Unit test: `slugifyOrganizationName` with 3 cases

## Phase 12: Public Storefront ✅

- Added `apps/site` as a separate Astro storefront workspace app (`@admin-template/site`)
- Static-first public routes: `/`, `/services`, `/services/[slug]`, `/contact`, `/checkout`
- Shared storefront shell with Astro layout/components plus React islands for cart, newsletter, booking CTA, and checkout summary
- Storefront uses shared `@admin-template/ui` tokens/CSS and local sample catalog data under `apps/site/src/data`
- Root convenience script added: `pnpm dev:site`
- Public storefront now reads from real public `/api/storefront/*` endpoints with graceful fallback to sample data when the API is unavailable
- Added stable `public_slug` + optional `category` support to services plus DB migration `0001_messy_ted_forrester`
- Public contact form flow is now real: `apps/site` submits inquiries to `apps/api`, which delivers notification email through `packages/email`
