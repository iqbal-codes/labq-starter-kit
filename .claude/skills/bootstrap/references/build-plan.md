# Reference — build-plan.md

## Purpose

`context/build-plan.md` is the execution map.

Its job is to turn product scope into an ordered implementation sequence that the agent can build through without losing the plot. A good build plan makes the next feature obvious, keeps dependencies in the right order, and prevents hidden backend-first work from drifting away from what the user can verify.

## Inputs to inspect before drafting

Read or inspect:

- project overview
- architecture
- tickets, roadmap, or milestones
- current code coverage versus missing features
- design artifacts if the project is UI-heavy

## What must be factual

- features already known to be required
- dependency order between major pieces
- current implementation state if the project already has work done

## What may be proposed for confirmation

- exact phase boundaries
- grouping of features into milestones
- the preferred build sequence when several are possible
- feature naming for planned but unbuilt work

## Suggested sections

- Core Principle
- Phases
- Features inside each phase
- UI and logic expectations per feature if relevant
- Feature Count or milestone summary

## Starter template

```markdown
# Build Plan

## Core Principle

[How work should be sequenced in this project]

## Phase 1 — [name]

### 01 [feature name]

**UI / Surface:**

- [deliverable]

**Logic / Behavior:**

- [deliverable]

### 02 [feature name]

**UI / Surface:**

- [deliverable]

**Logic / Behavior:**

- [deliverable]

## Phase 2 — [name]

### 03 [feature name]

- [details]

## Feature Count

| Phase   | Features |
| ------- | -------- |
| [phase] | [count]  |
```

## Drafting rule

A build plan should tell the agent what to build next, not just what the finished product contains. Make the sequence operational.
