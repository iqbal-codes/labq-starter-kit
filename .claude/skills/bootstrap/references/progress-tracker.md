# Reference — progress-tracker.md

## Purpose

`context/progress-tracker.md` is the session-to-session execution ledger.

Its job is to tell any new session what is done, what is in progress, what is next, what important decisions were made, and what notes matter for future work. This file is the fastest way to recover execution state without rereading the full repo history.

## Inputs to inspect before drafting or updating

Read or inspect:

- `build-plan.md`
- current code state
- recently completed features
- bug fixes or deviations made during implementation
- known blockers or verification notes

## What must be factual

- current phase
- last completed feature
- next planned feature
- completed versus incomplete checklist items
- actual decisions and implementation notes from work already done

## What may be proposed for confirmation

- what should count as the next feature if sequencing changed
- how to phrase new decision log entries
- whether a partial task should be marked complete or still in progress

## Suggested sections

- Current Status
- Progress by phase
- Decisions Made During Build
- Notes

## Starter template

```markdown
# Progress Tracker

## Current Status

**Phase:** [value]
**Last completed:** [value]
**Next:** [value]

## Progress

### Phase 1 — [name]

- [x] [feature]
- [ ] [feature]

### Phase 2 — [name]

- [x] [feature]
- [ ] [feature]

## Decisions Made During Build

- [decision]
- [decision]

## Notes

- [note]
- [note]
```

## Drafting rule

Update this file after every completed feature or major architectural correction. If this file is stale, the next session starts blind.
