# Reference — architecture.md

## Purpose

`context/architecture.md` defines the technical shape of the system.

Its job is to tell a new session how the project is built, where responsibility lives, how data moves, what the main integrations are, and which invariants must never be violated. If an agent cannot trace the path from user action to system behavior after reading this file, the file is incomplete.

## Inputs to inspect before drafting

Read or inspect:

- `package.json`
- top-level folders
- route structure
- API handlers, actions, workers, jobs, or services
- config files
- environment variable usage
- schema or migration files
- external integration code

## What must be factual

- framework and language
- major libraries and services in active use
- folder structure and ownership boundaries
- actual data flow patterns
- actual tables, queues, buckets, or persisted resources
- known invariants already enforced in code

## What may be proposed for confirmation

- intended boundaries not fully implemented yet
- future architectural rules
- target directory structure for parts not built yet

## Suggested sections

- Stack
- Folder Structure
- System Boundaries
- Data Flow
- External Systems / Integrations
- Storage / Database / Queue Model
- Authentication Model
- Operational Invariants

## Starter template

````markdown
# Architecture

## Stack

| Layer     | Tool   | Purpose   |
| --------- | ------ | --------- |
| Framework | [tool] | [purpose] |
| Data      | [tool] | [purpose] |
| Auth      | [tool] | [purpose] |

## Folder Structure

```text
/
├── app/
├── components/
├── lib/
└── ...
```
````

## System Boundaries

| Folder | Owns             |
| ------ | ---------------- |
| `app/` | [responsibility] |
| `lib/` | [responsibility] |

## Data Flow

1. [trigger]
2. [handler]
3. [service]
4. [persistence]

## External Systems

- [service] — [why it exists]
- [service] — [why it exists]

## Invariants

- [rule that must never be violated]
- [rule that must never be violated]

```

## Drafting rule

Write architecture as a map, not as a wishlist. Record the truth first. Then record intentional rules that future work must preserve.
```
