import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getPlatformInfo = createTool({
  id: "get-platform-info",
  description:
    "Get information about the current user, organization, enabled modules, and permissions.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    userId: z.string().nullable(),
    orgId: z.string().nullable(),
    enabledModules: z.array(z.string()),
    permissions: z.array(z.string()),
  }),
  execute: async (_input, context) => {
    const requestContext = context?.requestContext;
    const userId = (requestContext?.get("userId") as string) || null;
    const orgId = (requestContext?.get("orgId") as string) || null;
    const enabledModules = (requestContext?.get("enabledModules") as string[]) || [];
    const permissions = (requestContext?.get("permissions") as string[]) || [];

    return {
      userId,
      orgId,
      enabledModules,
      permissions,
    };
  },
});
