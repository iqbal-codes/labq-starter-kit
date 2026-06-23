---
name: using-skills
description: Use at the start of any non-trivial task. Scans the request, picks the right skill(s) from `.agents/skills/`, and announces the plan. Default entry point that keeps the rest of the toolbox out of your head until it matters.
---

# Using Skills

You have a toolbox of specialized skills in `.agents/skills/`. Every one of them exists because it does a specific job better than you would ad-hoc. The trap is forgetting they exist, or asking "should I use one?" every turn. This skill removes that trap.

## The Rule

**Before responding to any non-trivial task, scan the request against the routing map. If a skill clearly applies, invoke it and announce which one.**

Non-trivial = anything beyond a one-line fix, a question that needs a one-paragraph answer, or pure exploration with no deliverable.

## Routing Map

Read top to bottom; the first match wins. If multiple could apply, run them in the order they appear.

### 1. New repo, missing context, or stale context
- "set up this project", "missing context files", "context is stale", greenfield repo
→ **bootstrap**

### 2. Product idea is vague or repo purpose is fuzzy
- "let's brainstorm", "not sure what to build", "help me think this through", mid-build pivot
→ **discover**

### 3. About to build something new and there is no plan yet
- "add X", "build Y", "implement Z", new feature, behavior change, multi-file refactor
→ **architect**

### 4. UI design, redesign, polish, or visual review
- "make it look better", "redesign X", "this UI feels off", color, spacing, motion, accessibility
→ **impeccable**

### 5. Just built something and want to verify it
- "did I do this right", "check my work", "review this feature"
→ **review**

### 6. Bug, test failure, or unexpected behavior
- "X is broken", "tests fail", "this used to work", "why is this happening"
→ **recover**

### 7. Just finished a feature or refactor
- "wrap up", "I'm done with X", need to keep context files honest
→ **syncdocs**

### 8. Session boundary
- "save where we are", "continue tomorrow", new session needing prior state
→ **remember**

### 9. Committing
- `git commit`, finishing a chunk of work, history cleanup
→ **caveman-commit**

### 10. Third-party library, framework, or domain-specific tool
- "use library X", "how do I do Y with framework Z", anything matching a skill name in `.agents/skills/`
→ load that skill directly (e.g., the matching library skill if installed)

### 11. Nothing clearly fits
Skip the skills and proceed using the lightest approach that respects `AGENTS.md` and `context/`. Say so briefly so the developer knows you considered the toolbox.

## Skill Chaining

Some tasks need several skills in sequence. Common chains:

- **New feature from scratch:** `architect` (with persistence mode if non-trivial) → implement → `review` → `impeccable` (if UI) → `syncdocs` → `remember`
- **Bug fix:** `recover` (root cause) → fix → `review (lite)` → `syncdocs`
- **UI work:** `impeccable` → implement → `review` → `syncdocs`
- **New session on existing repo:** `bootstrap` (or `remember restore`) → start
- **Mid-build product doubt:** `discover` → `architect` → resume

Run the chain. Announce each step in one short line.

## Announcement Format

Before invoking a skill, say one line:

```
Using `architect` to align on the plan before any code.
```

That's the whole announcement. No rationale, no preamble, no apology. One line, then act.

## Anti-Patterns

| Thought | Reality |
|---|---|
| "This is too small to need a skill" | Skills have skip rules. Invoke and let the skill decide. |
| "I remember the skill, I'll just do it" | Skills evolve. Invoke the current version. |
| "Multiple skills could apply — I'll guess" | Read the routing map top to bottom; first match wins. |
| "Let me explore first, then pick a skill" | Skills tell you how to explore. Invoke first. |
| "I'll skip the announcement" | One line keeps the developer oriented. Always announce. |

## When You Skip

If the request is truly trivial (a typo, a one-line answer, a factual lookup with no action), skip the routing. Trivial ≠ everything else. Use judgment; the developer will tell you if you over-route.
