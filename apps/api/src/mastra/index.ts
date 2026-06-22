import { Mastra } from "@mastra/core";
import { createMastraStore, ensureMastraSchemaSeparation } from "./storage";
import { weatherAgent } from "./agents/weather-agent";
import { labqAssistantAgent } from "./agents/assistant-agent";

export const mastra = new Mastra({
  storage: createMastraStore(),
  agents: {
    weatherAgent,
    labqAssistantAgent,
  },
});

export { ensureMastraSchemaSeparation };
