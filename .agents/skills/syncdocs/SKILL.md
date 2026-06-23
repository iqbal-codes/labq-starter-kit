---
name: syncdocs
description: You are the documentarian. Your job is to make sure the project's context files tell the truth.
---

You are the documentarian. Your job is to make sure the project's context files tell the truth.

The context files (`context/*.md`) are the single source of truth for agentic sessions. When they drift from the actual code, every subsequent session starts with wrong assumptions. Drift is inevitable — features get built, refactors happen, new patterns emerge. Fixing drift is your job.

## What this skill does NOT do

- It does not change any source code
- It does not change E2E tests
- It does not re-plan features
- It does not generate new context files from scratch — only reconciles existing ones

## Phase 1 — Scope the analysis

Before reading the entire codebase, determine what might have changed:

1. **Check git.** Run `git log --oneline -30` to see recent commits. What was touched?
2. **Check the last sync.** Read `context/progress-tracker.md` — what was the last completed feature? What is listed as "next"?
3. **Identify sources of drift.** Based on recent commits, which context files could be stale?
   - `context/progress-tracker.md` — new features listed as "next" that are now done?
   - `context/ui-registry.md` — new UI patterns were built but not captured?
   - `context/architecture.md` — new module, dependency, or boundary introduced?
   - `context/code-standards.md` — convention drift that should be codified?
   - `context/ui-tokens.md` — new design tokens or token system changes?
   - `context/ui-rules.md` — new rules or rule changes?
   - `context/build-plan.md` — phase progress that should be updated?

If the user specified "sync everything" or no scope is given, default to all files. If the user specified a scope ("just syncdocs progress-tracker"), only check that.

## Phase 2 — Discover what exists

Read broadly across the codebase. Use sub-agents (Agent tool) for parallel discovery:

### Agent 1 — Module tree scan

```
Read `src/modules/` and `src/routes/` recursively.
List every module directory and the files within it.
Note which modules have pages, components, hooks, queries, server, lib, types subdirs.
Compare against what `context/architecture.md` says about module structure.
```

### Agent 2 — Route scan

```
Read `src/routes/` — list every route file and its route path.
Compare against what `context/architecture.md` and `context/progress-tracker.md` say.
```

### Agent 3 — Database schema scan

```
Read `src/db/` — list all schema files and the tables they define.
Compare against what `context/architecture.md` says about the data model.
```

### Agent 4 — UI registry scan

```
Search for any new component files under `src/components/ui/` and `src/components/forms/fields/`
that are not listed in `context/ui-registry.md`.
Also check for new page patterns in `src/modules/*/pages/` that should be registered.
```

### Agent 5 — Integration scan

```
Read `src/integrations/` — list all integration wrappers.
Check `package.json` for new dependencies not documented in `context/library-docs.md`.
```

## Phase 3 — Compare and reconcile

For each context file, compare what it says against what the agents found:

### `context/progress-tracker.md`

**Check:**

- Are all completed features marked as done?
- Are any "next" features already implemented?
- Is the "Current Status" section accurate (phase, last completed, next)?
- Are any "Decisions Made During Build" stale or superseded?

**Update:**

- Move completed items from pending to done
- Update Current Status to reflect actual state
- Remove or correct stale decisions

### `context/ui-registry.md`

**Check:**

- Are all entries still accurate? (file paths, token usage, pattern notes)
- Are there new UI components, form fields, or page patterns not listed?
- Are there patterns that were captured but later changed?

**Update:**

- Add new entries for undocumented patterns
- Update file paths that have changed
- Correct token usage descriptions that no longer match

### `context/architecture.md`

**Check:**

- Is the stack still accurate? (any new libraries added or removed?)
- Does the folder structure match reality?
- Are all system boundaries still correct?
- Is the data model up to date with actual DB schema?
- Are there new auth patterns, data flows, or operational invariants?

**Update:**

- Correct stack, folder structure, and boundaries
- Add new product domain models
- Add new operational invariants that emerged during implementation

### `context/code-standards.md`

**Check:**

- Are the naming conventions still followed in the codebase?
- Are the dependency rules still accurate (shared form system, shared table system)?
- Are there new patterns that should be codified as standards?

**Update:**

- Update rules that are no longer followed
- Add new standards for patterns that emerged

### `context/library-docs.md`

**Check:**

- Are all listed libraries still in use?
- Are there new dependencies in `package.json` that should be documented?
- Are the "Why" and "Must know" sections still accurate?

**Update:**

- Add new libraries
- Remove libraries that are no longer used
- Update version and migration notes

### `context/build-plan.md`

**Check:**

- Does the plan still match actual progress?
- Are there completed phases that need marking?

**Update:**

- Mark completed phases

### `context/ui-tokens.md` and `context/ui-rules.md`

**Check:**

- Are the tokens and rules still followed in the codebase?
- Any drift between documented rules and actual usage?

**Update:**

- Correct documented tokens
- Update rules that have changed

## Phase 4 — Report

After all updates, produce a summary:

```md
## Context Sync Report

### Files updated

- context/progress-tracker.md — [summary of changes]
- context/ui-registry.md — [summary of changes]

### Drift detected but not fixed

- [Any gaps that could not be resolved automatically, e.g., "Architecture.md describes a 'reports' module that does not exist yet"]
- [Any decisions needed from the developer, e.g., "The codebase uses Tailwind classes directly in 3 places — should these be tokenized?"]

### Verdict

- Context is up to date / Minor drift / Significant drift (recommend /architect for review)
```

## Rules

1. **Never change source code.** You only write to `context/*.md`.
2. **Never add features to context files that do not exist.** Do not "pre-document" things that might come.
3. **When in doubt, leave it out.** If you are not sure whether an entry is accurate, add it to "Drift detected but not fixed" rather than making a wrong correction.
4. **Respect the original structure.** Keep the same headings, formatting, and conventions as the file you are updating.
5. **Update `progress-tracker.md`'s date** if you change its status or completed list.
