# Memory — Mastra Agentic Assistant Integration

Last updated: 2026-06-20 19:40

## What was built

- **Backend Mastra Setup**: Created `apps/api/src/mastra/` folder with `index.ts` configuring instance-level Postgres storage (`PostgresStore`) and registering two agents: `weatherAgent` and `labqAssistantAgent`.
- **Assistant Tools**:
  - `get-platform-info`: Pulls user context, active organization, enabled modules, and user permissions from the `RequestContext`.
  - `read-crm-data`: Enforces CRM module activation and `crm.view` permissions to retrieve leads, contacts, companies, deals, and activities.
  - `read-inventory-data`: Enforces Inventory module activation and `inventory.view` permissions to retrieve products, locations, movements, and balances.
  - `create-crm-activity`: Enforces `crm.update` permission and logs audits. Requires explicit human-in-the-loop user approval before executing database insertions.
- **Hono Endpoints**:
  - `POST /api/ai/chat`: Verifies session, sets up `RequestContext`, and streams agent response via an AI SDK v6 compatible stream, returning the `X-Mastra-Run-Id` header.
  - `POST /api/ai/chat/approve` and `POST /api/ai/chat/decline`: Receives user approval or decline actions and resumes the suspended agent stream.
- **Frontend UI**:
  - Created `AssistantButton` floating bottom-right and mounted it in the shell's `DashboardLayout`.
  - Created `AssistantSheet` containing the chat transcript and input area, using Vercel AI SDK `useChat` hook with `DefaultChatTransport` and credentials configuration.
  - Implemented custom stream decoding to parse `x-mastra-run-id` data parts and request-resuming logic for tool approvals.
  - Rendered `tool-create-crm-activity` calls as interactive approval cards with **Approve** and **Decline** buttons.
- **E2E verification**: Added Playwright test `e2e/assistant-chat.spec.ts` checking signup, sheet launch, and streamed AI responses.

## Decisions made

- **Embedded API Integration**: Embedded Mastra in the existing Hono backend to reuse Better Auth cookies, active organization, permissions, and database schemas.
- **Safety / Approval Model**: Gated mutative tools (like activity creation) behind explicit human approval in the chat UI.
- **Mastra AI SDK v6 Streaming**: Configured `toAISdkStream` with `version: "v6"` and mapped custom roles to ensure compatibility with Vercel AI SDK v6.
- **Workspace Drizzle Standard**: Standardized `drizzle-orm` dependencies to `catalog:` across all packages and apps to prevent type clashes.

## Problems solved

- **Zod Record Arity**: Fixed `z.record(z.unknown())` to `z.record(z.string(), z.unknown())` in `crm-tools` and `inventory-tools`.
- **Stray Try Block Closing Brace**: Fixed early termination of the try block in `apps/api/src/index.ts` causing parse errors.
- **Playwright Race Condition**: Replaced `toBeVisible()` check with `toContainText(/[a-zA-Z]/)` to wait until the assistant actually streams response text instead of asserting immediately on empty bubbles.
- **ES2023 compatibility**: Replaced `messages.findLastIndex` with a simple backwards-loop for ES target compatibility.

## Current state

- Both `apps/api` and `apps/shell-web` typecheck successfully.
- Playwright E2E test `e2e/assistant-chat.spec.ts` passes perfectly.

## Next session starts with

1. Open `/crm` in the browser, launch the assistant sheet, and send a message.
2. Verify CRM read tools work (e.g. "What contacts do we have?").
3. Try scheduling an activity (e.g. "Schedule a task named follow-up for contact [id]") to verify the approval-card UI and database mutation.
4. Expand toolset to support other enabled module routes (e.g. products listing or location creation).

## Open questions

1. Should the floating assistant button be hidden or disabled for viewer roles that lack write capabilities?
2. Do we want to support structured tool output (e.g. rendering custom list items for CRM data) in a future iteration?
