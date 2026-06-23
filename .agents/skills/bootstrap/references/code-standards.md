# Reference — code-standards.md

## Purpose

`context/code-standards.md` defines the engineering rules that stay stable across sessions: typing, naming, file organization, error handling, dependency discipline, boundaries, and project-wide invariants. If an agent can write code that surprises the rest of the repo, this file is not specific enough.

## Inputs to inspect before drafting

- source files, lint/formatter config, tsconfig
- naming, import, and error-handling patterns already in the repo
- framework-specific boundaries

## What must be factual

- conventions already used consistently
- enforced TypeScript, lint, and framework constraints
- real folder ownership and error-handling patterns

## What may be proposed for confirmation

- stronger future rules where the repo is still inconsistent
- dependency approval policy
- preferred abstractions where the codebase has not stabilized

## Suggested sections

- Language and Typing
- File and Naming Conventions
- Imports
- Server / Client / Domain Boundaries
- Error Handling
- State / Data Flow
- Dependency Rules
- Invariants

## Starter template

```markdown
# Code Standards

## Language and Typing
- [rule]

## Naming
- [rule]

## Imports
- [rule]

## Boundaries
- [rule]

## Error Handling
- [rule]

## Dependencies
- [rule]

## Invariants
- [must-never-break rule]
```

## Drafting rule

Only write rules that shape how code gets written in this specific project. No generic best practices.
