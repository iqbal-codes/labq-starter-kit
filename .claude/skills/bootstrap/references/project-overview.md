# Reference — project-overview.md

## Purpose

`context/project-overview.md` is the product truth document.

Its job is to tell a new session what the project is, who it is for, what problem it solves, what the main flows are, what is in scope, what is out of scope, and what success looks like. If an agent cannot explain the product after reading this file, the file is not doing its job.

This should be readable by both a developer and an agent. Keep it concrete.

## Inputs to inspect before drafting

Read or inspect:

- README or product brief if present
- app routes, pages, screens, commands, or entrypoints
- feature list, tickets, or roadmap
- existing API routes and user flows
- any business or domain docs in the repo

## What must be factual

These sections should be grounded in observable repo or user-provided facts:

- project name
- what the product does
- pages, screens, routes, or commands
- core user flow
- features already in scope
- features explicitly out of scope
- target user if known

## What may be proposed for confirmation

These can be drafted as hypotheses and marked for confirmation if they are not obvious:

- success criteria
- exact target user profile
- product positioning language
- flow details not visible in code yet

## Suggested sections

- About the Project
- The Problem It Solves
- Pages or Surfaces
- Navigation
- Core User Flow
- Data Architecture or Domain Model Summary
- Features In Scope
- Features Out of Scope
- Success Criteria

## Starter template

```markdown
# Project Overview

## About the Project

[What this product does in one clear paragraph]

## The Problem It Solves

[Why it exists and what pain it removes]

## Pages / Surfaces

- `/` → [purpose]
- `/feature` → [purpose]
- CLI command / background job / API entrypoint → [purpose]

## Navigation

[How the user moves through the product]

## Core User Flow

1. [step]
2. [step]
3. [step]

## Data Architecture

- [main entity] — [what it represents]
- [main entity] — [what it represents]

## Features In Scope

- [feature]
- [feature]

## Features Out of Scope

- [feature]
- [feature]

## Target User

[Who this is for]

## Success Criteria

- [criterion]
- [criterion]
```

## Drafting rule

Do not turn this into marketing copy. It is an operating document. Clear beats impressive.
