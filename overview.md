# Project Overview — Modular Internal Tools Platform MVP

## 1. Overview

Project ini adalah **Odoo-lite inspired modular internal tools platform** yang fokus sebagai **developer/agency starter kit**, bukan ERP full-scale.

Tujuan utamanya adalah membangun **foundation internal tools yang modular, scalable, dan reusable**, sehingga ke depannya module baru bisa ditambahkan tanpa mengubah core platform secara besar-besaran.

MVP ini juga berfungsi sebagai **architecture showcase** untuk modern TypeScript ecosystem, micro-frontend, reusable UI system, type-safe backend, multi-tenant organization model, RBAC, dan PostgreSQL RLS.

## 2. Product Positioning

Produk ini bukan Odoo clone penuh.

Positioning MVP:

> A modular internal tools foundation for building CRM, Inventory, and future business modules with consistent UI, strong architecture, and organization-level module activation.

Target utama MVP:

- Developer
- Agency
- Technical founder
- Internal tools builder
- Portfolio/demo showcase

## 3. MVP Goal

MVP dianggap berhasil kalau bisa dipresentasikan dalam 5–10 menit dengan flow yang smooth:

1. User signup
2. System auto-create default workspace
3. User masuk ke Home Dashboard
4. CRM dan Inventory aktif sebagai remote modules
5. User bisa CRUD CRM data
6. User bisa manage product dan stock movement
7. Stock balance otomatis terupdate
8. User bisa disable/enable module dari Settings
9. Sidebar dan dashboard berubah sesuai active modules
10. Docker Compose bisa menjalankan semua service

## 4. Core Architecture

### Monorepo

Menggunakan:

- `pnpm workspace`
- `Vite+`
- `@module-federation/vite`
- TypeScript ecosystem

Struktur utama:

```txt
apps/
  shell-web
  crm-web
  inventory-web
  api

packages/
  ui
  schemas
  api-client
  module-contract
  auth
  config
  types
```

## 5. Frontend Architecture

Frontend menggunakan pendekatan **micro-frontend route-level federation**.

### Shell App

`shell-web` bertanggung jawab untuk:

- Auth layout
- Protected routes
- Sidebar/topbar
- Workspace/organization context
- Module registry
- Module activation guard
- Permission guard
- Home dashboard
- Settings page
- Remote module loading

### Remote Modules

MVP punya dua remote modules:

```txt
crm-web
inventory-web
```

Setiap module punya ownership sendiri atas:

- Routes
- Pages
- Forms
- Tables
- Hooks
- API calls
- Module-specific state

Shell tidak boleh import internal files dari remote module.

## 6. UI System

UI menggunakan reusable package:

```txt
packages/ui
```

Berbasis `shadcn/ui`, berisi:

- UI primitives
- App layout primitives
- Form components
- DataTable components
- Empty/loading/error states
- Dialogs
- Status badges
- Permission-aware UI helpers

Rule penting:

> `@repo/ui` tidak boleh berisi domain logic CRM atau Inventory.

## 7. Backend Architecture

Backend menggunakan:

- Hono
- Hono RPC-style client
- PostgreSQL
- Drizzle ORM
- Better Auth
- Better Auth Organization plugin

Backend dibuat sebagai **modular monolith**, bukan microservice.

Struktur backend:

```txt
apps/api/src/
  core/
    auth/
    rbac/
    rls/
    audit/
    errors/
    context/

  modules/
    organization/
    crm/
    inventory/
```

Setiap backend module punya struktur:

```txt
module.routes.ts
module.service.ts
module.repository.ts
module.permissions.ts
module.audit.ts
module.errors.ts
```

## 8. Auth, Organization, and RBAC

Auth menggunakan **Better Auth + Organization plugin**.

Signup flow:

```txt
User signup
→ create default organization: "My Workspace"
→ assign user as owner
→ set default currency: IDR
→ enable CRM + Inventory
→ seed CRM stages
→ seed Main Warehouse
→ redirect to Home Dashboard
```

Role MVP:

```txt
owner
admin
member
viewer
```

Permission model menggunakan permission key:

```txt
crm.view
crm.create
crm.update
crm.delete

inventory.view
inventory.create
inventory.update
inventory.delete
```

MVP belum punya member management UI. User pertama otomatis menjadi `owner`.

## 9. Multi-Tenancy and RLS

Semua business table wajib punya:

```txt
organization_id
created_at
updated_at
deleted_at
created_by
updated_by
```

MVP menggunakan dua layer security:

### App-level guard

- Validate session
- Validate active organization
- Validate membership
- Validate permission

### Database-level guard

- PostgreSQL Row Level Security untuk business tables
- Query business data berjalan dengan organization context

RLS masuk MVP untuk:

- CRM tables
- Inventory tables
- Audit logs jika relevan

Better Auth internal tables tidak perlu dipaksakan pakai custom RLS di MVP.

## 10. Module Registry

Module registry menggunakan pendekatan hybrid.

### Static/env config

Berisi:

- module key
- label
- base path
- remote entry URL
- exposed route
- required permission

### Database config

Berisi module yang aktif per organization:

```txt
organization_modules
- organization_id
- module_key
- enabled
- enabled_at
- enabled_by
```

Settings MVP punya halaman:

```txt
Settings
- Organization Profile
- Modules
```

Owner/admin bisa enable/disable CRM dan Inventory.

## 11. Home Dashboard

Setelah login, user masuk ke shell-level Home Dashboard.

Dashboard menampilkan:

- Welcome message
- Active organization
- Enabled modules
- Module summary cards
- Quick actions

Dashboard hanya menampilkan data/action dari module yang:

1. aktif untuk organization
2. permitted untuk user

Summary endpoint dimiliki masing-masing module:

```txt
crm.summary()
inventory.summary()
```

## 12. CRM Module Scope

CRM MVP terdiri dari:

```txt
Contacts
Companies
Deals
Deal Stages
```

Build order:

```txt
1. Contacts
2. Companies
3. Link Contact ↔ Company
4. Deals
5. Deal stage summary
```

### Contacts

Fields:

```txt
name
email
phone
company
status
source
notes
```

UI:

- List table
- Search/filter
- Create/edit dialog
- Soft delete

### Companies

Fields:

```txt
name
industry
website
email
phone
address
```

UI sama seperti Contacts.

### Deals

Fields:

```txt
title
company
contact
value
stage
expected_close_date
notes
```

Deals UI:

- Stage summary cards
- DataTable
- Search
- Filter by stage
- Create/edit dialog
- Soft delete

Deal stages disimpan di table `deal_stages` dan diseed per organization:

```txt
New
Qualified
Proposal
Won
Lost
```

Belum ada UI untuk manage stages di MVP.

## 13. Inventory Module Scope

Inventory MVP terdiri dari:

```txt
Products
Stock Locations
Stock Movements
Stock Balances
```

Build order:

```txt
1. Products
2. Locations
3. Stock Movements
4. Stock Balances
```

### Products

Fields:

```txt
sku
name
category
unit
description
is_active
```

Rules:

- SKU auto-generated default: `PRD-0001`
- User bisa edit SKU
- SKU unique per organization
- Unit fixed list

Unit MVP:

```txt
pcs
box
pack
kg
gram
liter
ml
meter
```

### Stock Locations

Simple location model:

```txt
name
type: warehouse / shelf / virtual
is_active
```

Default seed:

```txt
Main Warehouse
```

### Stock Movements

Movement types:

```txt
in
out
transfer
adjustment
```

Rules:

- Movement immutable
- Tidak boleh edit/delete movement
- Kalau salah input, koreksi lewat adjustment
- Negative stock tidak boleh
- Quantity menggunakan decimal

Adjustment behavior:

```txt
User input actual counted quantity
System calculates delta automatically
```

Movement menyimpan balance snapshot:

```txt
balance_before
balance_after
```

Untuk transfer:

```txt
source_balance_before
source_balance_after
destination_balance_before
destination_balance_after
```

### Stock Balances

Stock balance adalah projection table.

Source of truth:

```txt
stock_movements
```

Current state:

```txt
stock_balances
```

Uniqueness:

```txt
unique(organization_id, product_id, location_id)
```

Stock Balance UI:

- Read-only table
- Adjust Stock action
- Koreksi tetap lewat adjustment movement

## 14. Data and Query Pattern

Table data menggunakan:

- Server-side pagination
- Server-side search
- Server-side filter
- Server-side sorting
- URL query state via `nuqs`
- Fetching via TanStack Query

Form state menggunakan:

- TanStack Form
- Zod validation
- Shared schema package

Schema package:

```txt
packages/schemas
  crm/
  inventory/
  organization/
```

## 15. Error Handling

MVP menggunakan standardized app error system.

Contoh error code:

```txt
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
MODULE_DISABLED
ORGANIZATION_REQUIRED
INSUFFICIENT_STOCK
DUPLICATE_SKU
INTERNAL_ERROR
```

Frontend behavior:

- Field error untuk validation
- Toast untuk business/server error
- ErrorState untuk page fetch error
- AccessDenied untuk permission error
- ModuleDisabled untuk disabled module

## 16. Audit Trail

Audit log masuk MVP sebagai backend-only feature.

Table:

```txt
audit_logs
- organization_id
- actor_user_id
- module_key
- entity_type
- entity_id
- action
- metadata
- created_at
```

Yang diaudit:

- CRM create/update/delete
- Inventory product/location changes
- Stock movement creation
- Module enable/disable
- Important organization changes

Belum ada audit log UI di MVP.

## 17. Deployment

MVP deployment menggunakan Docker Compose.

Services:

```txt
postgres
api
shell-web
crm-web
inventory-web
```

Development ports:

```txt
shell-web      :3000
crm-web        :3001
inventory-web  :3002
api            :4000
postgres       :5432
```

Micro-frontend tetap served sebagai service terpisah.

## 18. Testing

Testing MVP fokus ke quality-critical logic.

Backend tests:

- RBAC permission check
- Organization guard
- RLS context helper
- CRM basic CRUD service
- Inventory movement service
- Reject negative stock
- Stock balance projection update
- Audit log creation

Frontend tests:

- PermissionGate
- Module navigation visibility
- Form validation
- Loading/empty/error state

CI:

```txt
pnpm typecheck
pnpm lint
pnpm test
pnpm build
docker build api
docker build shell-web
docker build crm-web
docker build inventory-web
```

## 19. Documentation

MVP docs:

```txt
README.md
docs/architecture.md
docs/adr/
```

ADR minimal:

```txt
001-monorepo-and-tooling.md
002-micro-frontend-architecture.md
003-auth-organization-rbac.md
004-postgres-rls.md
005-inventory-stock-balance-projection.md
```

## 20. Out of Scope for MVP

Tidak masuk MVP:

- Accounting
- Invoice
- Purchase order
- Sales order
- Procurement
- Barcode
- Batch/lot/expiry
- Multi-currency per deal
- Custom role builder
- Invite/member management UI
- Audit log UI
- Notification center
- Full dashboard analytics
- Kanban drag-and-drop
- Module marketplace
- CLI module generator
- Kubernetes/GitOps deployment

## 21. MVP Milestones

### Milestone 1 — Monorepo and Tooling Foundation

- pnpm workspace
- Vite+
- app/package structure
- shared config
- Docker Compose skeleton

### Milestone 2 — Shell and UI Foundation

- `@repo/ui`
- shell layout
- routing
- protected app structure
- Home Dashboard placeholder

### Milestone 3 — Auth, Org, RBAC, RLS Foundation

- Better Auth
- organization creation
- active organization
- role/permission mapping
- RLS helper
- audit helper

### Milestone 4 — Micro-frontend Foundation

- module contract
- shell remote loader
- CRM remote proof
- Inventory remote proof
- module activation settings

### Milestone 5 — CRM Module

- Contacts
- Companies
- Deals
- Deal stages
- CRM summary endpoint

### Milestone 6 — Inventory Module

- Products
- Locations
- Stock movements
- Stock balances
- Inventory summary endpoint

### Milestone 7 — Polish, Tests, Docs, Docker

- demo seed data
- tests
- README
- ADR
- Docker Compose
- CI build

## 22. Final MVP Definition

MVP ini adalah **modular internal tools platform foundation** dengan CRM dan Inventory sebagai first-party modules.

Nilai utamanya bukan cuma fitur CRM/Inventory, tapi:

- modular architecture
- micro-frontend implementation
- consistent reusable UI
- type-safe fullstack TypeScript
- organization-based module activation
- RBAC
- PostgreSQL RLS
- inventory domain logic
- Dockerized multi-app setup
- portfolio-ready demo flow
