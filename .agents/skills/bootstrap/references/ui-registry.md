# Reference — ui-registry.md

## Purpose

`context/ui-registry.md` is the growing memory of implemented UI patterns.

Its job is to record what was actually built so future components match the existing interface. Unlike `ui-rules.md`, which describes stable global rules, `ui-registry.md` captures component-level patterns and keeps them reusable across sessions.

## Inputs to inspect before drafting or updating

Read or inspect:

- recently built components
- repeated component types in the repo
- actual class usage or style props
- `ui-tokens.md` and `ui-rules.md`

## What must be factual

- file paths
- actual classes or token usage in implemented components
- repeated visual patterns already present in the code

## What may be proposed for confirmation

- component grouping strategy
- pattern notes that generalize from an implementation
- baseline recommendations when doing first-time audit work

## Suggested sections

- one entry per reusable component type
- optional baseline section for audit-driven projects
- pattern notes for why a component is styled the way it is

## Starter template

```markdown
# UI Registry

### [Component Name]

File: [path]
Last updated: [date]

| Property         | Class / Token |
| ---------------- | ------------- |
| Background       | [value]       |
| Border           | [value]       |
| Radius           | [value]       |
| Text — primary   | [value]       |
| Text — secondary | [value]       |
| Spacing          | [value]       |
| Hover state      | [value]       |
| Shadow           | [value]       |
| Accent usage     | [value]       |

**Pattern notes:**
[Why this pattern exists and what future components should match]
```

## Drafting rule

This file should grow with the project. Append or update entries as components are built. It is a practical memory system, not a theoretical guide.
