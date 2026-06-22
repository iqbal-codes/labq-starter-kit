Bener bro, my bad. Itu malah jadi **monolith doc**, bukan modular. Yang lebih bener: **Product Primitives dipecah jadi beberapa file kecil**, masing-masing fokus ke 1 bagian, supaya nanti gampang dipakai agentic engineering.

Struktur modularnya gini:

```txt
/docs/product/primitives
  00-overview.md
  01-space.md
  02-memory.md
  03-threads-messages.md
  04-skills.md
  05-routines.md
  06-outputs.md
  07-activity.md
  08-context-rules.md
  09-relationships.md
```

## 00-overview.md

````md
# Product Primitives Overview

## Product

Personal AI Spaces helps users create dedicated AI assistants for different parts of life and work.

Each Space has its own:

- Memory
- Threads
- Skills
- Routines
- Outputs
- Activity

## Core Model

```txt
User
└── Space
    ├── Memory
    ├── Threads
    │   └── Messages
    ├── Skills
    ├── Routines
    ├── Outputs
    └── Activity
```
````

## Core Principle

> Chat is where users think.
> Memory is what the assistant remembers.
> Output is what users keep.
> Space is where context lives.

## Required MVP Primitives

- Space
- Memory
- Thread
- Message
- Skill
- Routine
- Routine Run
- Output
- Activity Item

````

---

## 01-space.md

```md
# Primitive: Space

## Definition

A Space is a dedicated AI assistant environment for one area of life or work.

A Space is not just a folder for chats. It is an ongoing assistant context.

## Examples

Personal:

- Recipe Assistant
- Parenting Assistant
- Career Assistant
- Finance Assistant
- Habit Assistant

Work:

- Client Assistant
- Content Assistant
- Research Assistant
- Product Assistant

## Responsibilities

A Space should:

- contain domain-specific context
- organize conversations into threads
- provide reusable skills
- support scheduled routines
- store useful outputs
- prevent unrelated context from mixing

## MVP Fields

```ts
Space {
  id: string
  userId: string
  name: string
  description?: string
  purpose: string
  createdAt: Date
  updatedAt: Date
}
````

## Relationships

```txt
User has many Spaces
Space has many MemoryItems
Space has many Threads
Space has many Skills
Space has many Routines
Space has many Outputs
Space has many ActivityItems
```

## MVP Rules

- Every Space must have a default `Main Chat` thread.
- Memory must be scoped to one Space.
- A Space should not automatically use Memory from another Space.

## User-facing Language

Use:

- Space
- Assistant
- Assistant Space

Avoid:

- Project
- Workspace Management
- Agent Orchestration
- Jira-like terminology

````

---

## 02-memory.md

```md
# Primitive: Memory

## Definition

Memory is persistent context that the AI should remember inside a Space.

Memory is domain-specific.

## Examples

Recipe Space:

- taste preferences
- available equipment
- common ingredients
- recipes tried

Parenting Space:

- child age
- routines
- preferred activities
- family rules

Career Space:

- target role
- current skills
- resume notes
- learning goals

## Responsibilities

Memory should:

- store important context
- reduce repeated explanation
- be editable by the user
- be used only inside its Space
- stay concise and useful

## MVP Fields

```ts
MemoryItem {
  id: string
  spaceId: string
  title: string
  content: string
  category?: string
  createdAt: Date
  updatedAt: Date
}
````

## Suggested Categories

- Preference
- Context
- Goal
- Constraint
- Rule
- Profile
- Note

## Relationships

```txt
Space has many MemoryItems
MemoryItem belongs to one Space
AI uses MemoryItems when responding inside that Space
```

## MVP Rules

- User can add, edit, and delete Memory.
- Onboarding answers can become MemoryItems.
- User can ask AI to remember something from chat.
- AI must not mix Memory across Spaces.

````

---

## 03-threads-messages.md

```md
# Primitives: Thread & Message

## Thread Definition

A Thread is a focused conversation stream inside a Space.

Threads prevent one Space from becoming one giant messy chat.

## Thread Examples

Recipe Space:

- Main Chat
- Cold Brew Experiment
- Weekly Meal Plan
- Recipe Troubleshooting

Parenting Space:

- Main Chat
- Sleep Routine
- Weekend Activities
- Meal Ideas

## Thread Types

```ts
type ThreadType = "chat" | "skill_run" | "routine_run"
````

## Thread MVP Fields

```ts
Thread {
  id: string
  spaceId: string
  title: string
  type: "chat" | "skill_run" | "routine_run"
  createdAt: Date
  updatedAt: Date
}
```

## Message Definition

A Message is a single chat entry inside a Thread.

## Message Roles

```ts
type MessageRole = "user" | "assistant" | "system";
```

## Message MVP Fields

```ts
Message {
  id: string
  threadId: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: Date
}
```

## Relationships

```txt
Space has many Threads
Thread has many Messages
Message belongs to one Thread
Assistant Message can be saved as Output
SkillRun creates Thread
RoutineRun creates Thread
```

## MVP Rules

- Every Space has a default `Main Chat` thread.
- User can create and rename threads.
- Skill runs create `skill_run` threads.
- Routine runs create `routine_run` threads.
- AI should use current Thread messages + Space Memory.
- AI should not load all Threads automatically in MVP.

````

---

## 04-skills.md

```md
# Primitive: Skill

## Definition

A Skill is a reusable AI workflow inside a Space.

Skills are used for repeated tasks that need consistent output.

## Examples

Recipe Space:

- Create Recipe
- Scale Recipe
- Troubleshoot Recipe
- Create Weekly Meal Plan

Parenting Space:

- Create Activity Plan
- Generate Bedtime Story
- Prepare Doctor Visit Questions

Career Space:

- Review Resume
- Prepare Interview
- Create Learning Plan

## Responsibilities

A Skill should:

- define a repeatable task
- use Space Memory
- include a prompt template
- define a markdown output format
- create a Thread when run
- create an Output Draft when completed

## MVP Fields

```ts
Skill {
  id: string
  spaceId: string
  name: string
  description: string
  promptTemplate: string
  outputFormatMarkdown: string
  createdAt: Date
  updatedAt: Date
}
````

## Skill Run Fields

```ts
SkillRun {
  id: string
  spaceId: string
  skillId: string
  threadId: string
  outputId?: string
  status: "pending" | "running" | "completed" | "failed"
  createdAt: Date
  completedAt?: Date
}
```

## Relationships

```txt
Space has many Skills
Skill has many SkillRuns
Routine runs a Skill
SkillRun creates Thread
SkillRun creates Output
```

## MVP Rules

- User can create, edit, delete, and run Skills.
- Skill output must follow `outputFormatMarkdown`.
- A completed SkillRun should create:
  - a `skill_run` Thread
  - an assistant response
  - an Output Draft

````

---

## 05-routines.md

```md
# Primitive: Routine

## Definition

A Routine is a scheduled Skill.

Routines are for recurring needs.

## Examples

- Every Sunday → Create Weekly Meal Plan
- Every Friday → Career Reflection
- Every Month → Budget Review
- Every Monday → Parenting Activity Ideas

## Responsibilities

A Routine should:

- run a selected Skill on schedule
- create a RoutineRun
- create a routine_run Thread
- create an Output Draft
- create an ActivityItem

## MVP Fields

```ts
Routine {
  id: string
  spaceId: string
  skillId: string
  name: string
  schedule: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
````

## Routine Run Fields

```ts
RoutineRun {
  id: string
  spaceId: string
  routineId: string
  skillRunId?: string
  threadId?: string
  outputId?: string
  status: "pending" | "running" | "completed" | "failed"
  scheduledFor: Date
  startedAt?: Date
  completedAt?: Date
}
```

## Supported MVP Schedules

- daily
- weekly
- monthly

## Relationships

```txt
Space has many Routines
Routine belongs to one Skill
Routine has many RoutineRuns
RoutineRun creates Thread
RoutineRun creates Output
RoutineRun creates ActivityItem
```

## MVP Rules

- Routine must run a Skill, not an arbitrary prompt.
- User can activate/deactivate Routine.
- Completed RoutineRun should create:
  - routine_run Thread
  - Output Draft
  - ActivityItem

````

---

## 06-outputs.md

```md
# Primitive: Output

## Definition

An Output is a saved markdown artifact from a Space.

Outputs preserve useful AI results so they do not disappear inside chat history.

## Core Principle

> Threads are where work happens.
> Outputs are what users keep.

## Examples

Recipe Space:

- Saved Recipe
- Weekly Meal Plan
- Shopping List
- Batch Notes

Parenting Space:

- Weekly Activity Plan
- Meal Ideas
- Doctor Visit Questions

Career Space:

- Career Roadmap
- Interview Prep
- Resume Notes

Research Space:

- Weekly Brief
- Trend Report
- Competitor Analysis

## Output Sources

```ts
type OutputSourceType = "chat" | "skill_run" | "routine_run"
````

## MVP Fields

```ts
Output {
  id: string
  spaceId: string
  threadId?: string
  sourceType: "chat" | "skill_run" | "routine_run"
  sourceId?: string
  title: string
  type: string
  markdown: string
  status: "draft" | "reviewed" | "archived"
  createdAt: Date
  updatedAt: Date
}
```

## Status

- draft
- reviewed
- archived

## Relationships

```txt
Space has many Outputs
Output may link to source Thread
Output can be created from chat
Output can be created from SkillRun
Output can be created from RoutineRun
```

## MVP Rules

- Output format is markdown.
- User can save assistant message as Output.
- SkillRun creates Output Draft.
- RoutineRun creates Output Draft.
- User can edit and archive Output.
- Do not build complex file/artifact system in MVP.

````

---

## 07-activity.md

```md
# Primitive: Activity

## Definition

Activity is a review/notification feed for important events inside a Space.

## Purpose

Activity helps users notice generated results, especially from routines.

## Examples

- Weekly Meal Plan is ready
- Career Reflection completed
- New Output created from Skill
- Routine failed to run

## MVP Fields

```ts
ActivityItem {
  id: string
  spaceId: string
  type: "routine_completed" | "skill_completed" | "output_created" | "routine_failed"
  title: string
  description?: string
  relatedThreadId?: string
  relatedOutputId?: string
  relatedRoutineRunId?: string
  readAt?: Date
  createdAt: Date
}
````

## Relationships

```txt
Space has many ActivityItems
RoutineRun creates ActivityItem
SkillRun can create ActivityItem
Output creation can create ActivityItem
```

## MVP Rules

- Routine result must create ActivityItem.
- ActivityItem should link to related Thread or Output.
- User can mark ActivityItem as read.

````

---

## 08-context-rules.md

```md
# AI Context Rules

## Purpose

This document defines how AI should use context inside Personal AI Spaces.

## Core Rule

AI context must be scoped to the current Space.

The assistant should not mix context between Spaces.

## Context Hierarchy

When responding inside a Space, AI should use context in this order:

```txt
1. System and safety rules
2. Space purpose
3. Space memory
4. Selected skill prompt, if any
5. Current thread messages
6. User request
````

## MVP Context Sources

In MVP, AI should use:

- current Space purpose
- current Space Memory
- current Thread messages
- selected Skill, if any

In MVP, AI should not automatically use:

- Memory from other Spaces
- all Threads in the current Space
- all Outputs in the current Space

## Chat Behavior

When user chats normally:

- AI should respond based on Space purpose, Memory, and current Thread.
- AI may suggest saving useful results as Output.
- AI should not automatically create Output unless user asks.

## Skill Behavior

When user runs a Skill:

- AI must follow Skill prompt template.
- AI must follow Skill markdown output format.
- Result should create Output Draft.

## Routine Behavior

When Routine runs:

- AI should execute the Routine’s selected Skill.
- Result should create Thread, Output Draft, and ActivityItem.

## Memory Behavior

AI can use Memory inside current Space.

AI can suggest adding Memory when user shares reusable context.

AI should not store sensitive or important personal details without user confirmation unless user explicitly says “remember this”.

````

---

## 09-relationships.md

```md
# Primitive Relationships

## Main Relationship Map

```txt
User
└── has many Spaces

Space
├── has many MemoryItems
├── has many Threads
├── has many Skills
├── has many Routines
├── has many Outputs
└── has many ActivityItems

Thread
└── has many Messages

Skill
└── has many SkillRuns

Routine
└── has many RoutineRuns

SkillRun
├── creates Thread
└── creates Output

RoutineRun
├── runs Skill
├── creates Thread
├── creates Output
└── creates ActivityItem

Output
└── may link to source Thread
````

## Source Flows

### Chat to Output

```txt
Assistant Message
→ User clicks Save as Output
→ Output created with sourceType = chat
```

### Skill to Output

```txt
User runs Skill
→ SkillRun created
→ skill_run Thread created
→ Assistant generates markdown result
→ Output Draft created
```

### Routine to Output

```txt
Routine triggers
→ RoutineRun created
→ Routine executes selected Skill
→ routine_run Thread created
→ Output Draft created
→ ActivityItem created
```

## Product Rules

- Space owns all domain context.
- Memory belongs to one Space.
- Thread belongs to one Space.
- Output belongs to one Space.
- Skill belongs to one Space.
- Routine belongs to one Space.
- Routine runs Skill.
- Skill and Routine results should create Outputs.

```

```
