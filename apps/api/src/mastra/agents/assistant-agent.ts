import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { createMastraStore } from "../storage";
import { getPlatformInfo } from "../tools/platform-tools";
import { readCrmData } from "../tools/crm-tools";
import { createCrmActivity } from "../tools/crm-activities";

const memory = new Memory({
  storage: createMastraStore(),
  options: {
    lastMessages: 50,
  },
});

export const labqAssistantAgent = new Agent({
  id: "labq-assistant",
  name: "LabQ Assistant",
  instructions: `You are the LabQ Modules AI Assistant. Your job is to help users manage their organization's CRM.

When answering, check the current platform information (permissions, active organization, and user ID) before proceeding.
- If a user asks to see leads, contacts, companies, deals, or activities, use the read-crm-data tool.
- If a user asks you to create a note, task, call, or meeting, use the create-crm-activity tool.
- Inform the user that write/creation actions require their explicit confirmation (the UI will prompt them to approve or decline the tool call).

Rules:
1. Only run tools if you have the required permissions. If you lack permissions, explain that to the user politely.
2. Be professional, direct, and helpful. Focus on the task at hand.`,
  model: "openrouter/google/gemini-2.5-flash",
  tools: {
    getPlatformInfo,
    readCrmData,
    createCrmActivity,
  },
  memory,
});
