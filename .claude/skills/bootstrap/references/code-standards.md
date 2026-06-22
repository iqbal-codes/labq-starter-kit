# Reference — code-standards.md

## Purpose

`context/code-standards.md` defines the engineering rules that should remain stable between sessions.

Its job is to make coding decisions repeatable: typing rules, naming, file organization, error handling, dependency discipline, server/client boundaries, and any project-wide invariants. If an agent can write code in a way that surprises the rest of the repo, this file is not specific enough.

## Inputs to inspect before drafting

Read or inspect:

- existing source files
- lint config, formatter config, tsconfig
- naming conventions in the repo
- error-handling patterns
- import patterns
- framework-specific boundaries

## What must be factual

- conventions already used consistently
- enforced TypeScript, lint, and framework constraints
- real folder ownership boundaries
- real error-handling or data-fetching patterns
- approved dependency constraints if they exist

## What may be proposed for confirmation

- stronger future rules where the repo is still inconsistent
- dependency approval policy
- preferred abstractions where the codebase has not stabilized yet

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
- [rule]

## Naming

- [rule]
- [rule]

## Imports

- [rule]
- [rule]

## Boundaries

- [rule]
- [rule]

## Error Handling

- [rule]
- [rule]

## Dependencies

- [rule]
- [rule]

## Invariants

- [must-never-break rule]
- [must-never-break rule]
```

## Drafting rule

Do not dump generic best practices into this file. Only write rules that should shape how code gets written in this specific project.
