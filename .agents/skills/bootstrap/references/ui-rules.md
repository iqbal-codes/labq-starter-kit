# Reference — ui-rules.md

## Purpose

`context/ui-rules.md` records the stable interface rules that should not drift between sessions.

Its job is to capture layout, hierarchy, spacing, component behavior, interaction states, and visual constraints that are broader than a single component. It complements `ui-tokens.md`: tokens define the primitives, UI rules define how the primitives are applied.

## Inputs to inspect before drafting

Read or inspect:

- design mockups and screenshots
- shared layout components
- repeated page patterns
- `ui-tokens.md`
- existing component composition patterns

## What must be factual

- recurring layout structure already visible in the project
- navigation model
- component composition patterns already used repeatedly
- known spacing, card, form, and typography conventions

## What may be proposed for confirmation

- standardization choices where the UI is still being formed
- future consistency rules for not-yet-built screens
- rules inferred from a small number of existing pages

## Suggested sections

- Layout Rules
- Navigation Rules
- Card / Panel Rules
- Form Rules
- Typography Rules
- Interaction Rules
- Things That Never Change

## Starter template

```markdown
# UI Rules

## Layout

- [rule]
- [rule]

## Navigation

- [rule]
- [rule]

## Cards and Panels

- [rule]
- [rule]

## Forms

- [rule]
- [rule]

## Typography

- [rule]
- [rule]

## Interaction

- [rule]
- [rule]

## Never Do This

- [anti-pattern]
- [anti-pattern]
```

## Drafting rule

Only promote a UI pattern into this file if it should remain stable across future work. This file is for durable rules, not one-off observations.
