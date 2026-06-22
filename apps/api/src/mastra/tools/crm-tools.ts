import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "@labq-modules/db";
import { leads, contacts, companies, deals, crmActivities } from "@labq-modules/db";
import { and, eq, isNull, ilike, or } from "drizzle-orm";

interface RequestContextHolder {
  requestContext?: {
    get(key: string): unknown;
  };
}

export const readCrmData = createTool({
  id: "read-crm-data",
  description:
    "Search and retrieve CRM data (leads, contacts, companies, deals, crmActivities) for the active organization.",
  inputSchema: z.object({
    entityType: z.enum(["leads", "contacts", "companies", "deals", "crmActivities"]),
    searchQuery: z
      .string()
      .optional()
      .describe("Optional query to filter by name, email, or title"),
    limit: z.number().optional().default(10),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    items: z.array(z.record(z.string(), z.unknown())),
    error: z.string().optional(),
  }),
  execute: async (input, context: RequestContextHolder) => {
    const requestContext = context?.requestContext;
    const enabledModules = requestContext?.get("enabledModules");
    const isCrmEnabled = Array.isArray(enabledModules) && enabledModules.includes("crm");
    if (!isCrmEnabled) {
      return {
        success: false,
        items: [],
        error: "CRM module is not enabled for this organization.",
      };
    }

    const permissions = requestContext?.get("permissions");
    const hasCrmView = Array.isArray(permissions) && permissions.includes("crm.view");
    if (!hasCrmView) {
      return { success: false, items: [], error: "User does not have crm.view permission." };
    }

    const orgIdVal = requestContext?.get("orgId");
    const orgId = typeof orgIdVal === "string" ? orgIdVal : null;
    if (!orgId) {
      return { success: false, items: [], error: "Organization context is missing." };
    }

    const limit = input.limit || 10;
    const search = input.searchQuery || "";

    try {
      if (input.entityType === "leads") {
        const whereCond = and(
          eq(leads.organizationId, orgId),
          isNull(leads.deletedAt),
          search
            ? or(ilike(leads.name, `%${search}%`), ilike(leads.companyName, `%${search}%`))
            : undefined,
        );
        const items = await db.query.leads.findMany({
          where: whereCond,
          limit,
        });
        return { success: true, items };
      }

      if (input.entityType === "contacts") {
        const whereCond = and(
          eq(contacts.organizationId, orgId),
          isNull(contacts.deletedAt),
          search
            ? or(ilike(contacts.name, `%${search}%`), ilike(contacts.email, `%${search}%`))
            : undefined,
        );
        const items = await db.query.contacts.findMany({
          where: whereCond,
          limit,
        });
        return { success: true, items };
      }

      if (input.entityType === "companies") {
        const whereCond = and(
          eq(companies.organizationId, orgId),
          isNull(companies.deletedAt),
          search ? ilike(companies.name, `%${search}%`) : undefined,
        );
        const items = await db.query.companies.findMany({
          where: whereCond,
          limit,
        });
        return { success: true, items };
      }

      if (input.entityType === "deals") {
        const whereCond = and(
          eq(deals.organizationId, orgId),
          isNull(deals.deletedAt),
          search ? ilike(deals.title, `%${search}%`) : undefined,
        );
        const items = await db.query.deals.findMany({
          where: whereCond,
          limit,
        });
        return { success: true, items };
      }

      if (input.entityType === "crmActivities") {
        const whereCond = and(
          eq(crmActivities.organizationId, orgId),
          isNull(crmActivities.deletedAt),
          search
            ? or(
                ilike(crmActivities.title, `%${search}%`),
                ilike(crmActivities.details, `%${search}%`),
              )
            : undefined,
        );
        const items = await db.query.crmActivities.findMany({
          where: whereCond,
          limit,
        });
        return { success: true, items };
      }

      return { success: false, items: [], error: "Invalid entity type" };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown database error";
      return { success: false, items: [], error: errMsg };
    }
  },
});
