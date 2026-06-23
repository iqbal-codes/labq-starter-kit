---
name: review
description: After building a feature, verify it matches what was planned, respects the system architecture and design standards, and is ready for production. Runs three review layers (plan alignment, system integrity, production readiness) and drives disposition. Use whenever a feature is complete, before merging, or when parallel subagent work needs integration review.
---

Building is not done when the code runs. It is done when the code is correct.

AI moves fast. Fast means things get built that work on the surface but drift from the architecture, violate the design system, or miss edge cases that matter. This skill catches those things before they compound into bigger problems.

Run this after every feature. Before you move on.

## What This Skill Does Not Do

It does not fix anything. It reports what it finds and lets the developer decide what matters and what to do about it. Fixing without understanding is how problems get buried, not solved.

---

## Step 0 — Pick the Right Mode

Three modes. Pick one based on context:

| Mode | When | What it covers |
|---|---|---|
| **Full review** | Single feature built end-to-end, ready to merge | All 3 layers + Disposition |
| **Lite review** | Small fix, single-file change, after a `recover` fix | Layer 2 (system integrity) + Layer 3 (production readiness) — skip Layer 1 if no plan exists |
| **Parallel review** | Multiple subagents built disjoint slices in parallel | Per-slice review first, then cross-slice integration review |
| **Audit** | Post-merge, weeks after a feature shipped | Drift check: do listed "completed" features still exist? Has intent captured at design time been overridden? |

If unsure, use Full review. The other modes exist to skip work that's not relevant.

---

## Step 1 — Understand What Should Have Been Built

Before reviewing anything, establish the benchmark.

Read in this order:

- The implementation plan from `architect` if one exists
- The feature description or task that was given
- Any relevant context files — architecture boundaries, code standards, design rules

If no plan exists, ask the developer to describe what the feature was supposed to do before reviewing. You cannot verify correctness without knowing what correct looks like.

---

## Step 2 — Review in Three Layers

### Layer 1 — Does it match the plan?

Compare what was built against what was planned.

Check:

- Every part of the feature description — is it all there?
- The decisions made during planning — are they reflected in the code?
- The scope — did the implementation stay within bounds or add things that were not asked for?

Flag anything that was planned but missing. Flag anything that was built but not planned.

### Layer 2 — Does it respect the system?

This is where AI drift most commonly happens. The feature works, but it violates rules that the project depends on.

Check:

- **Architecture boundaries** — does code in the right place own the right responsibilities? No UI logic in API routes. No DB calls in components. Whatever the project's boundaries are — are they respected?
- **Design system** — are the correct tokens, classes, and patterns used? Any hardcoded values that should be variables? Any raw color classes that should use the design system?
- **Code standards** — naming conventions, file organisation, TypeScript strictness, error handling patterns — do they match what the project established?
- **Existing patterns** — does this feature introduce a new pattern when an existing one should have been used?

### Layer 3 — Is it production ready?

Check:

- Error handling — what happens when things go wrong? Are errors caught and handled or does the feature silently fail?
- Edge cases — empty states, loading states, missing data — are these handled?
- Console errors — any errors or warnings in the browser or terminal?
- Obvious bugs — anything that would clearly break for a real user?

---

## Step 3 — Reviewing Parallel Work (if Mode = Parallel)

When multiple subagents built disjoint slices in parallel:

1. **Per-slice review** — review each slice against its own contract first
2. **Cross-slice integration review** — then check that the slices compose:
   - Shared types — do they actually match across slices?
   - Duplicate imports — did two slices both add the same dependency?
   - Boundary violations — does slice A's code leak into slice B's territory?
   - Integration points — do the pieces wire up correctly?

Flag integration issues as Critical even if individual slices pass their own review. A per-slice pass that finds nothing can still hide a cross-slice integration break. Always do both.

---

## Step 4 — Report What You Found

After completing all three layers, produce a clear report. Do not bury issues. Do not soften them. Report honestly so the developer can make informed decisions.

```
## Review — [Feature Name]

### Layer 1 — Plan alignment
[PASS / ISSUES FOUND]
[List any gaps between what was planned and what was built]

### Layer 2 — System integrity
[PASS / ISSUES FOUND]
[List any architecture, design, or code standard violations]

### Layer 3 — Production readiness
[PASS / ISSUES FOUND]
[List any error handling gaps, edge cases, or obvious bugs]

### Summary
[X] issues found across [Y] layers.

[If no issues: "No issues found. This feature is ready to ship."]
[If issues: "Resolve the above before moving to the next feature."]
```

---

## Step 5 — Disposition

After the report, do not just wait. Drive the next step. Issues have severity labels (see Severity Guide below) — handle each:

### Critical (block the feature)

- Do NOT move on. Critical issues mean the feature is not done.
- Offer to fix now, or hand off to `recover` if the underlying approach is wrong.
- If you cannot fix in this session, log as a blocker and stop work.

### Important (ask explicitly)

- Ask: "Fix now, or open a follow-up task?"
- Do not assume the developer remembers to track these.
- If deferred, log into `context/progress-tracker.md`'s running issues section so it doesn't get lost.

### Minor (log and proceed)

- Add to a running list (or `context/progress-tracker.md` if it exists).
- Proceed with the feature.
- These are housekeeping, not blockers.

**Never present a Critical review and then end the session without explicit resolution.**

---

## Step 6 — Audit Mode (if Mode = Audit)

For post-merge review of shipped features:

1. Read `git log` for the relevant feature commit range
2. Read the corresponding section in `context/progress-tracker.md`
3. Check:
   - Are the listed "completed" features actually still in the codebase, or were they reverted?
   - Has any documented decision been silently overridden by recent commits?
   - Has any new pattern emerged that's not in `context/ui-registry.md` or other context docs yet?
4. Report drift as Critical (decision overrides) or Important (new untracked patterns).

This is mostly `syncdocs` territory — drift in documentation. Audit mode in review catches drift in *intent*: code that no longer matches what was originally agreed.

---

## Severity Guide

Not all issues are equal. Use this to help the developer prioritise:

**Critical — fix before moving on**

- Architecture boundary violations that will break future features
- Missing error handling that causes silent failures
- Functionality that was planned but completely missing

**Important — fix soon**

- Design system drift that will cause UI inconsistency
- Code standard violations that will compound across the codebase
- Edge cases that a real user will encounter

**Minor — fix when convenient**

- Naming inconsistencies that do not affect behaviour
- Missing optimisations
- Style issues that do not affect the design system

Label each issue with its severity so the developer can triage quickly.

---

## The Standard

The question this skill answers is not "does it work?"

The question is "is it correct?"

Working and correct are not the same thing. A feature can work today and break the project tomorrow. Review exists to catch the difference.
