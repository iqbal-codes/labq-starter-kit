---
name: bootstrap
description: Set up the agentic engineering context for a project at the start of a session or the start of a repo. Use this when you need to load the full context system, audit whether the project context is healthy, repair drift in the context files, or scaffold the same context structure for a greenfield codebase.
---

Agentic work breaks down when the project has no operating system. The model sees fragments. The developer assumes shared understanding that does not exist yet. The next session starts from memory instead of structure. That is how architecture drifts, standards get skipped, and features stop fitting together.

This skill fixes that by treating project context as infrastructure. Not as optional notes. Not as nice-to-have documentation. As the operating system for how the agent reads the repo, plans work, keeps consistency, and hands state from one session to the next.

Use this skill in three situations:

- At the start of a session on a project that already has context files and you need to load and validate them
- In a project where the context system exists but has drifted and needs repair
- In a greenfield project where the context system does not exist yet and must be created from scratch

The goal is simple: every project should have the same stable context backbone, and every session should start from that backbone instead of guesswork.

---

## How to Invoke

At session start on an existing project:

```
/bootstrap
```

To repair or refresh a partial context system:

```
/bootstrap refresh
```

To scaffold the context system for a greenfield project:

```
/bootstrap setup
```

If the developer does not specify a mode, detect the project state first and choose the correct mode based on what exists.

---

## Bundled References

This skill includes durable reference files for every context artifact under `references/`.

Read them when you need to create or repair the system:

- `references/project-overview.md`
- `references/architecture.md`
- `references/ui-tokens.md`
- `references/ui-rules.md`
- `references/ui-registry.md`
- `references/code-standards.md`
- `references/library-docs.md`
- `references/build-plan.md`
- `references/progress-tracker.md`

These references are not project facts. They are the recipes and templates for how each context file should work. Use them to scaffold new projects and to compare existing projects against the expected shape.

---

## Step 1 — Detect Project State

Before choosing what to do, inspect the project state.

Check for these foundations:

- `AGENTS.md`
- `context/`
- `context/project-overview.md`
- `context/architecture.md`
- `context/ui-tokens.md`
- `context/ui-rules.md`
- `context/ui-registry.md`
- `context/code-standards.md`
- `context/library-docs.md`
- `context/build-plan.md`
- `context/progress-tracker.md`
- `.agents/skills/`
- `skills-lock.json`
- `memory.md` if the project uses cross-session handoff

Classify the state:

- **Bootstrap mode** — the context system exists and mainly needs to be read and validated
- **Refresh mode** — part of the system exists, but files are missing, stale, inconsistent, or no longer match the repo
- **Setup mode** — the context system is mostly absent and needs to be established from scratch

If the right mode is ambiguous, say so and ask the developer which path they want.

```
I checked the project state.

What exists:
- [item]
- [item]

What is missing or drifting:
- [item]
- [item]

I recommend [bootstrap / refresh / setup] mode because [reason].
```

Do not create or rewrite anything yet if the project state is unclear.

---

## Step 2 — Choose the Correct Mode

Pick the lightest mode that solves the real problem.

### Bootstrap mode

Use this when the context system already exists and the main job is to load it, verify it, and establish the current session state.

### Refresh mode

Use this when the context system exists in part, but some files are missing sections, stale against the repo, out of order, or inconsistent with each other.

### Setup mode

Use this when the project does not yet have the context backbone and needs the full system scaffolded.

State the mode explicitly before proceeding.

```
Mode selected: [bootstrap / refresh / setup]

Why:
[one short paragraph]
```

This matters because reading, repairing, and creating are different jobs. Do not blur them together.

---

## Step 3 — Run the Mode

### Bootstrap mode — Read and validate an existing system

Read the project context files in the exact order defined by `AGENTS.md`. If `AGENTS.md` does not exist yet, use this canonical order:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-tokens.md`
4. `context/ui-rules.md`
5. `context/ui-registry.md`
6. `context/code-standards.md`
7. `context/library-docs.md`
8. `context/build-plan.md`
9. `context/progress-tracker.md`

Then:

- Read `AGENTS.md` and verify the documented order matches the actual files
- Read `.agents/skills/` and compare it with the skills listed in `AGENTS.md`
- Read `skills-lock.json` and compare it with the actual local skill directories
- Read `memory.md` if present and extract session carry-over state
- Summarize the current feature phase, what is complete, what is next, and any context drift

Do not silently fix mismatches in bootstrap mode. Report them first.

### Refresh mode — Repair a drifting system

Read the existing context files and compare them against the bundled references in `references/`.

For each context artifact:

- Identify whether the file exists
- Check whether the core sections are present
- Check whether the content still matches observable repo reality
- Flag missing sections, stale assumptions, inconsistent terminology, or ordering drift

Recommend targeted repairs first. Only propose a full rewrite if the file is structurally unsalvageable or the developer asks for regeneration.

Use the references as the stable pattern:

- `references/project-overview.md` for product framing and scope
- `references/architecture.md` for stack, structure, boundaries, and flow
- `references/ui-tokens.md` for design token source of truth
- `references/ui-rules.md` for stable layout and visual rules
- `references/ui-registry.md` for reusable visual patterns
- `references/code-standards.md` for code rules and invariants
- `references/library-docs.md` for documentation authority and integration notes
- `references/build-plan.md` for phased feature planning
- `references/progress-tracker.md` for execution status and decision logging

### Setup mode — Scaffold the system for a greenfield project

Treat this as creating the project's agentic operating system.

Create the minimal structure:

- `context/`
- `AGENTS.md`
- `.agents/skills/`
- the nine starter context files
- optionally `memory.md` if cross-session handoff is part of the workflow

When drafting each context file:

- Read the matching reference in `references/` first
- Pull in facts from the repo before inventing anything
- Mark unknowns clearly and ask the developer to confirm them
- Use the repo's actual stack, folder structure, naming, and goals
- Do not copy this repo's product details into another project. Copy the pattern, not the content.

Your job is to establish the shape of the system and fill what is knowable now.

Unknowns should be written like this:

```
Needs confirmation:
- [unknown architectural decision]
- [unknown product scope decision]
- [unknown design-system decision]
```

---

## Step 4 — Validate Skill and Context Wiring

Once the mode work is done, validate the wiring around it.

Check:

- Whether `AGENTS.md` lists the correct context read order
- Whether `AGENTS.md` lists the skills that actually exist
- Whether `.agents/skills/` and `skills-lock.json` are in sync
- Whether the project's workflow rules are clear enough to guide future sessions
- Whether `build-plan.md` and `progress-tracker.md` agree about current status
- Whether the context files are specific enough to guide implementation without relying on memory

If something is contradictory, call it out directly.

```
Wiring issues found:
- [issue]
- [issue]

Why they matter:
[short explanation]
```

Do not bury contradictions inside a long summary. Surface them plainly.

---

## Step 5 — Produce the Report and Wait

Always end with a concise report. The report changes by mode.

### Bootstrap report

```markdown
## Bootstrap Report — [Project Name]

### Context files

- project-overview.md — [present / missing / drifting]
- architecture.md — [present / missing / drifting]
- ui-tokens.md — [present / missing / drifting]
- ui-rules.md — [present / missing / drifting]
- ui-registry.md — [present / missing / drifting]
- code-standards.md — [present / missing / drifting]
- library-docs.md — [present / missing / drifting]
- build-plan.md — [present / missing / drifting]
- progress-tracker.md — [present / missing / drifting]

### Skills and wiring

- AGENTS.md — [healthy / issues]
- .agents/skills — [healthy / issues]
- skills-lock.json — [healthy / issues]

### Current execution state

- Current phase: [value]
- Last completed: [value]
- Next: [value]
- Memory state: [present / absent / stale]

### Risks or drift

- [issue]
- [issue]

### Recommended next action

[one short paragraph]
```

### Refresh report

```markdown
## Context Refresh Report — [Project Name]

### Files that are healthy

- [file]
- [file]

### Files that need repair

- [file] — [what is wrong]
- [file] — [what is wrong]

### Recommended repairs

1. [repair]
2. [repair]
3. [repair]

### What I would update first

[one short paragraph]
```

### Setup report

```markdown
## Context Setup Report — [Project Name]

### Created

- [path]
- [path]

### Drafted from repo facts

- [file] — [what was inferred from the codebase]
- [file] — [what was inferred from the codebase]

### Needs confirmation

- [unknown]
- [unknown]

### Follow-up skills or processes to add

- [skill or process]
- [skill or process]

### Recommended next action

[one short paragraph]
```

After the report, stop and wait for the developer before making broader changes.

---

## What Good Bootstrap Looks Like

Good bootstrap work gives the next session a backbone.

That means:

- the product is explained
- the architecture is bounded
- the design system is explicit
- the coding rules are stable
- the build sequence is visible
- progress is current
- the skill system matches the project reality

If those things are true, the agent can work with confidence. If they are not true, fix the context system before trusting the implementation work built on top of it.

---

## The Rule

Context first. Then planning. Then building.

A project with no context system is running on conversation residue. A project with a healthy context system can survive long builds, multiple sessions, and multiple agents without losing the plot.

Bootstrap the system before you trust the work.
