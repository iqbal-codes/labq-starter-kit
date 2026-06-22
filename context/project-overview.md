# Project Overview

## Product Positioning

Admin App Template is an internal-tools platform for building organization-scoped business apps. Built as a developer-first starter kit, it provides a shared shell, auth, permissions, and reusable UI. CRM is the primary business domain. The repo targets developers, agencies, and technical teams who need a solid starting point for internal tools — not a full ERP replacement.

## What makes this a robust internal-tools platform

- **Organization and permission model** — workspace/org scoping, RBAC, record-level protection.
- **Single-app architecture** — shared shell with org-scoped routing and organization selector.
- **Operational CRUD foundation** — reusable forms, tables, validation, pagination, filtering, and bulk-safe data handling.
- **Import and export** — CSV/XLSX import/export, templates, bulk updates, validation before commit, and traceability for imported changes.
- **Activity history and collaboration** — per-record timeline/chatter, comments, field-change history, followers/watchers, and linked files.
- **Tasks and reminders** — scheduled follow-ups, assignees, due dates, and record-linked activities.
- **Approvals and workflow controls** — multi-step approvals for sensitive actions, delegation/escalation, and approval audit history.
- **Documents and attachments** — file upload, shared folders, versioning, and access-controlled document links.
- **Search, reporting, and saved views** — global search, filterable lists, exportable reports, and reusable views for operators.
- **Auditability and notifications** — audit logs, important-change notifications, and operational visibility across modules.

## Current foundation in this repo

These capabilities exist in code today:

- Organization-aware auth with explicit onboarding — new users create their first organization at `/onboarding` before entering the app.
- Owner/admin/member/viewer roles plus per-module permission keys; CRM handlers enforce them.
- Single-app shell architecture with sidebar organization selector and org-scoped routing.
- CRM as the primary business domain with full CRUD, activities, pipeline, and import/export.
- Reusable TanStack Form system with Zod validation across all module dialogs.
- Reusable DataTable with server-side pagination, sort, and filter on all module pages.
- Backend audit logging on all write paths (no audit-log UI yet).
- Organization onboarding and sidebar org selector for workspace switching.
- Docker Compose and dev-script runnable local stack.

## Target Users

- Developer
- Agency
- Technical founder
- Internal tools builder
- Portfolio/demo showcase

## Current MVP success criteria

1. User signup
2. User lands on `/onboarding` and creates an organization (name → slug, workspace tables initialized)
3. User enters Home Dashboard with active org
4. CRM active with org-scoped data
5. User can CRUD CRM data
6. Sidebar org selector shows active org and supports switching
7. Docker Compose runs all services

## Platform completeness criteria

1. Operators can import and export business records safely in bulk.
2. Every important record has a visible history of changes, comments, and linked files.
3. Users can assign follow-up activities with owners and due dates.
4. Sensitive actions can require one or more approvals before execution.
5. Files and documents can be attached, organized, and permissioned across records.
6. Users can search, filter, save views, and export operational reports without engineering help.
7. Important actions emit audit logs and user-facing notifications.
8. New modules can reuse the same auth, permissions, UI, and operational patterns without rewriting the shell.
