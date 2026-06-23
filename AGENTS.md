# AGENTS.md

Project session bootstrap and wiring doc.

## Process first

Before responding to any non-trivial task, invoke the `using-skills` skill. Its routing map decides which specialized skill applies (architect, recover, review, etc.). Project rules in this file override skill defaults where they conflict.

The `using-skills` skill is the entry point for everything below. When in doubt about what skill to use, that's the skill to use first.

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

If any file is missing or clearly stale, repair context first before trusting implementation work. Use `bootstrap` or `syncdocs` for this.

## Skill triggers

Automatic chains — run these without asking:

- **New feature or behavior change** → `architect` (with persistence mode if 3+ files or 2+ packages) → implement → `review` → `impeccable` (if UI) → `syncdocs` → `remember`
- **Bug, test failure, or unexpected behavior** → `recover` (find root cause before any fix) → fix → `review (lite)` → `syncdocs`
- **UI design, redesign, polish, color, motion, accessibility** → `impeccable` → implement → `review` → `syncdocs`
- **Parallel subagent work** → `review (parallel mode)` after each slice + final integration review
- **New repo, missing/stale context** → `bootstrap` (load / refresh / setup)
- **Product idea still fuzzy** → `discover` → `architect`
- **Mid-session handoff** → `remember save`; new session start → `remember restore` → `bootstrap`
- **Just finished a feature or refactor** → `syncdocs` to keep context honest
- **Git commit** → `caveman-commit`
- **Domain library (hono, ai-sdk, mastra, better-auth, shadcn, etc.)** → load that skill first

If multiple chains apply, run them in order. Each skill should announce itself in one line.

## Workflow rules

- Context first. Then planning. Then building.
- `context/` files are project operating system, not optional notes.
- Prefer existing package boundaries and shared utilities over new abstractions.
- Use token-based styling from `@admin-template/ui`; no hardcoded hex or raw Tailwind palette classes.
- Update `context/progress-tracker.md` after every meaningful feature.
- Update `context/ui-registry.md` after new reusable UI patterns or components.
- Before changing third-party-library-backed code, load the matching skill first when available, then check `context/library-docs.md`.
- Bugs, test failures, unexpected behavior → invoke `recover`. It finds root cause before any fix. If still stuck after root-cause work, the skill escalates internally.
- After any non-trivial feature, invoke `review` before `syncdocs` or `remember save`. Review is not optional for new files or behavior changes.
- For new features touching 3+ files or 2+ packages, `architect` runs in persistence mode — writes design + plan docs to `docs/designs/` and `docs/plans/`.
- Graphify-first exploration: when `graphify-out/graph.json` exists, use Graphify first for codebase exploration, architecture tracing, and "how does this work?" questions; then verify exact symbols and current code with file reads/LSP before editing.

### Human-in-the-loop gates

These cannot be skipped without explicit developer override:

- Before non-trivial code is written (`architect` approval)
- Before destructive actions (schema migrations, deletions, force-push, bulk operations)
- After Critical-severity issues in `review` (block the feature until resolved)
- Before merging to main
- Before creating or merging a PR

### Verification

Before any "done", "fixed", or "passes" claim:

1. Run the verification command in this turn (not the previous one)
2. Quote the actual output as part of the claim
3. If you did not run it, you cannot claim it

This applies to tests, builds, lint, and any other success claim. No exceptions.

### Branch lifecycle

- Feature work happens on a branch, not `main`.
- Ask before creating a worktree; do not assume isolation is wanted.
- When implementation is complete and reviewed: present merge / PR / keep / discard options, then act on the choice.

### Testing

- Behavior changes and bug fixes should have a test that fails before the fix and passes after.
- No universal TDD mandate — match the project's actual test discipline (e2e + targeted unit).
- Exceptions: prototype UI work, generated code, config.

## Current repo reality

- Modular internal-tools platform: shell app + CRM/Inventory remote modules
- pnpm workspace with Vite+ task runner
- Backend: Hono + oRPC on apps/api
- Frontend: Vite React apps (shell-web, crm-web, inventory-web)
- Auth: Better Auth with Organization plugin
- DB: Drizzle ORM + PostgreSQL with RLS
- All code under `@admin-template/*` workspace scope

Future sessions should trust `context/` first, then verify older docs before reusing them.
