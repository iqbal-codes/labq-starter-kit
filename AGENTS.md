# AGENTS.md

Project session bootstrap and wiring doc.

## Context read order

Read these files in this exact order before implementation:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-tokens.md`
4. `context/ui-rules.md`
5. `context/ui-registry.md`
6. `context/code-standards.md`
7. `context/library-docs.md`
8. `context/build-plan.md`
9. `context/progress-tracker.md`

If any file is missing or clearly stale, repair context first before trusting implementation work.

## Workflow rules

- Context first. Then planning. Then building.
- `context/` files are project operating system, not optional notes.
- Prefer existing package boundaries and shared utilities over new abstractions.
- Use token-based styling from `@admin-template/ui`; no hardcoded hex or raw Tailwind palette classes.
- Update `context/progress-tracker.md` after every meaningful feature.
- Update `context/ui-registry.md` after new reusable UI patterns or components.
- Before changing third-party-library-backed code, load installed skill first when available, then check `context/library-docs.md`.
- If same problem persists after one corrective prompt, stop and use `/recover`.
- After every meaningful feature or refactor, run `/syncdocs` to reconcile context files with actual code state.
- Graphify-first exploration: when `graphify-out/graph.json` exists, use Graphify first for codebase exploration, architecture tracing, and "how does this work?" questions; then verify exact symbols and current code with file reads/LSP before editing.

## Current repo reality

- Modular internal-tools platform: shell app + CRM/Inventory remote modules
- pnpm workspace with Vite+ task runner
- Backend: Hono + oRPC on apps/api
- Frontend: Vite React apps (shell-web, crm-web, inventory-web)
- Auth: Better Auth with Organization plugin
- DB: Drizzle ORM + PostgreSQL with RLS
- All code under `@admin-template/*` workspace scope

Future sessions should trust `context/` first, then verify older docs before reusing them.
