# Reference — ui-tokens.md

## Purpose

`context/ui-tokens.md` defines the design-token source of truth.

Its job is to document the approved visual primitives the project uses for color, text, spacing, radius, shadows, and any semantic roles. This file exists so components do not invent styles independently.

If the project is not UI-heavy, this file can be shorter. If the project has a design system, this file should be explicit.

## Inputs to inspect before drafting

Read or inspect:

- global CSS or theme files
- Tailwind config or theme directives
- component primitives
- design docs or mockups if present
- repeated class patterns across the UI

## What must be factual

- actual token names already used in the codebase
- where tokens are defined
- categories already encoded in CSS, Tailwind, or component theme files
- hard rules about what may not be hardcoded

## What may be proposed for confirmation

- token categories that should be added but do not exist yet
- normalization advice when the UI is still inconsistent
- naming recommendations for future tokens

## Suggested sections

- Token Source of Truth
- Required Token Categories
- Semantic Usage Rules
- Anti-Patterns
- Example Usage

## Starter template

```markdown
# UI Tokens

## Source of Truth

[Where tokens live and how they are consumed]

## Color Tokens

- `--color-background` — [use]
- `--color-surface` — [use]
- `--color-text-primary` — [use]

## Typography Tokens

- `--font-sans` — [use]
- `--text-body` — [use]

## Radius Tokens

- `[token]` — [use]

## Shadow Tokens

- `[token]` — [use]

## Rules

- Never hardcode [value type]
- Always use [token source]

## Anti-Patterns

- [pattern to avoid]
- [pattern to avoid]
```

## Drafting rule

This file is a constraint document, not a component catalog. Record the primitives and how they must be used.
