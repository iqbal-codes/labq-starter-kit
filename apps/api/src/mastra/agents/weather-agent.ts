import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../tools/weather-tool";

export const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  instructions: "You are a helpful assistant that can check the weather.",
  model: "openrouter/google/gemini-2.5-flash",
  tools: { weatherTool },
});
