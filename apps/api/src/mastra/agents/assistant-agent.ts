import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { createMastraStore } from "../storage";
import { getPlatformInfo } from "../tools/platform-tools";

const memory = new Memory({
  storage: createMastraStore(),
  options: {
    lastMessages: 50,
  },
});

export const labqAssistantAgent = new Agent({
  id: "labq-assistant",
  name: "Admin Template Assistant",
  instructions:
    "You are the Admin App Template Assistant. Help users understand their organization workspace, permissions, enabled modules, and how the scaffold is structured. Use get-platform-info before answering questions about the current workspace. Do not claim access to business records unless a project-specific tool is registered.",
  model: "openrouter/google/gemini-2.5-flash",
  tools: {
    getPlatformInfo,
  },
  memory,
});
