# Reference — library-docs.md

## Purpose

`context/library-docs.md` defines how the project treats library and API documentation.

Its job is to stop the agent from guessing library behavior from stale memory. It should record which documentation sources are authoritative, when live docs must be fetched, which project-specific integration notes matter, and any banned or deprecated usage patterns already discovered.

## Inputs to inspect before drafting

Read or inspect:

- installed dependencies
- framework and SDK usage in the repo
- any project instructions about MCP tools or live docs
- known integration bugs, version pinning, or migration notes
- README notes on setup or external services

## What must be factual

- real libraries and services used by the repo
- actual documentation-fetching tools available to the agent
- known version constraints
- project-specific integration caveats already proven in code

## What may be proposed for confirmation

- authority order if it is not explicitly defined yet
- future documentation workflow rules
- recommendations for new libraries or integrations

## Suggested sections

- Authority Order
- How to Fetch Docs
- Installed Libraries That Need Special Handling
- Version Pins / Breaking Changes
- Project-Specific Integration Rules
- What Not to Rely On

## Starter template

```markdown
# Library Docs

## Authority Order

1. [highest authority]
2. [next authority]
3. [next authority]
4. [lowest authority]

## How to Fetch Documentation

- For [library type], use [tool/process]
- For [library type], use [tool/process]

## Key Libraries

### [library]

- Why it is used: [reason]
- Must know: [integration rule]
- Avoid: [anti-pattern]

### [library]

- Why it is used: [reason]
- Must know: [integration rule]
- Avoid: [anti-pattern]

## Version / Migration Notes

- [note]
- [note]
```

## Drafting rule

This file should reduce hallucinated library usage. Be explicit about where truth comes from and which library-specific traps matter in this project.
