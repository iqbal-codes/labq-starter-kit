---
name: scoped-commits
description: Split a dirty working tree into a safe sequence of atomic commits grouped by scope. Use whenever the user asks to commit gradually, split changes into multiple commits, stage by scope, stage only part of a file, stage only selected hunks, break up changes, make atomic commits, separate unrelated edits, or clean up a mixed diff before committing. This skill should win even when the user only says things like "commit these carefully", "split a file into commits", or "help me stage hunks without mixing work."
user-invocable: true
---

# Scoped commits

Turn a messy diff into a small, reviewable commit series.

The goal is not just "make commits". The goal is to preserve intent, keep each commit bisectable, and avoid mixing unrelated changes.

## Compatibility

- Requires a git repository and bash access for `git status`, `git diff`, `git add`, and `git commit`.
- Best when the agent can inspect the full working tree before staging anything.

Do not use `git reset`, `git restore`, amend, rebase, or other history-rewriting commands in ways that could discard work unless the user explicitly asked for that operation.

## What counts as a scope

Group changes by **intent**, not by file extension or folder.

Good scopes:
- one bug fix
- one feature slice
- one refactor with no behavior change
- one migration plus the code that depends on it
- one test commit that proves a behavior change
- one docs-only follow-up

Bad scopes:
- "frontend files"
- "backend files"
- "everything under src/"
- "whatever already happens to be staged"

## Workflow

### 1. Inventory the working tree first

Start with the real state:
- `git status --short`
- `git diff --stat`
- `git diff --cached --stat` if anything is already staged
If the user already staged changes, treat that as a clue, not as truth. Verify the staged set still matches the intended scope boundary before keeping it.

Then inspect enough diff to understand the change boundaries before proposing commits.

Do not start staging blindly. A fast wrong split is worse than a slower correct one.

### 2. Build a commit plan before the first commit

Produce a short plan that lists:
- each proposed scope
- which files or hunks belong to it
- any risky overlaps or ambiguous files
- a draft commit message for each scope

Use this format:

## Commit plan
1. `<type>(<scope>): <summary>`
   - Files: `path/a`, `path/b`
   - Why together: <one sentence>
   - Risks: none | <specific risk>

Present the plan as a fenced code block so the user can scan the series quickly.

If one file clearly contains multiple scopes, call that out explicitly instead of pretending the boundary is obvious.

### 3. Choose safe boundaries

Prefer these splits:
- behavior change separate from cleanup
- rename/move separate from logic change when possible
- generated files with their source change, not alone unless the repo convention says otherwise
- docs/changelog follow-up after the code they describe
- tests with the behavior they verify, unless the tests are pure harness cleanup

Avoid these splits:
- commit A breaks the build and commit B fixes it, unless the user explicitly wants that history
- one commit mixes refactor + feature + formatting
- a schema change is committed far away from the code that requires it

### 4. Stage one scope at a time

For each scope:
1. Stage only the files or hunks for that scope.
2. Inspect the staged diff before committing.
3. Run the narrowest useful verification for the staged change. At minimum, confirm the staged diff matches the intended scope; do not skip verification entirely.
4. Commit.
5. Re-check the remaining working tree before planning the next scope.

If a whole file belongs to one scope, stage the file.
If only part of a file belongs, stage only that hunk when the boundary is clean.
If the boundary is messy or risky, stop and ask rather than silently mixing work.
If the split is blocked on user input, stop before committing that scope and report exactly what is blocked.

### 5. Verify the staged diff, not the wish

Before every commit, review:
- `git diff --cached --stat`
- `git diff --cached`

Ask:
- Does this commit tell one story?
- Would I want to review this in isolation?
- Does it leave unrelated leftovers unstaged?
- Could this commit stand on its own in `git bisect`?

If the answer is no, restage.

### 6. Use tight commit messages

Use conventional commits:
- `feat(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`

Keep the summary concrete. Add a body only when the why is not obvious.
If the user asked only for a split plan or message suggestions, stop before `git commit`.

### 7. Keep the user updated as the series progresses

After each commit, report:
- the commit message used
- what remains unstaged or uncommitted
- the next proposed scope

Use this format:

## Commit completed
- Message: `<type>(<scope>): <summary>`
- Included: `path/a`, `path/b`
- Remaining: `path/c`, `path/d` | `none`
- Next: `<brief next scope>` | `Done — no remaining changes`

## Decision rules

### When to ask the user

Ask once before proceeding if any of these are true:
- one file contains two real scopes and the split is not mechanically safe
- the user might want different history tradeoffs, like feature-first vs refactor-first
- staged changes already contain unrelated work from a previous attempt
- there are risky migrations, lockfiles, snapshots, or generated files with unclear ownership

Do not ask for permission on obvious, low-risk grouping choices. Pick the boring split and move.

### When to refuse a split

Do not create a commit plan that knowingly leaves the repo broken between commits unless the user explicitly wants a patch-stack with intermediate breakage.
Do not amend, rebase, or rewrite existing commits unless the user explicitly asked for history surgery.

Do not hide uncertainty by inventing tidy scopes. Name the ambiguity.

## Heuristics that usually help

- Infra first when later scopes depend on it.
- Pure renames before edits if the rename is large and mechanical.
- Tests with code when they prove the same behavior.
- Docs last unless the docs are the feature.
- Lockfiles travel with the dependency change that caused them.
- Formatting-only churn is its own commit only if it is truly mechanical.

## Example

User asks: "Split the current changes into auth, permissions, and docs commits."

Good result:
1. Inspect the diff and notice whether auth and permissions are actually separable.
2. If `permissions.ts` changes only support the auth flow, keep them together.
3. Commit docs last.
4. Report what remains after each commit.

The point is to preserve intent, not to satisfy the user's first guess if the diff says otherwise.
