import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "@labq-modules/db";
import { crmActivities, leads, contacts, companies, deals } from "@labq-modules/db";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { writeAudit } from "@labq-modules/api/core/audit";

interface RequestContextHolder {
  requestContext?: {
    get(key: string): unknown;
  };
}

export const createCrmActivity = createTool({
  id: "create-crm-activity",
  description:
    "Create a new CRM activity (note, task, call, or meeting) for a lead, contact, company, or deal. Gated by user approval.",
  requireApproval: true,
  inputSchema: z.object({
    entityType: z.enum(["lead", "contact", "company", "deal"]),
    entityId: z.string().describe("The ID of the target record"),
    type: z.enum(["note", "task", "call", "meeting"]).default("note"),
    title: z.string().describe("Short title of the activity"),
    details: z.string().optional().describe("Detailed description or notes"),
    dueAt: z.string().optional().describe("ISO date string for when the task is due"),
    occurredAt: z.string().optional().describe("ISO date string for when the event occurred"),
    completed: z.boolean().optional().default(false),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async (input, context: RequestContextHolder) => {
    const requestContext = context?.requestContext;
    const enabledModules = requestContext?.get("enabledModules");
    const isCrmEnabled = Array.isArray(enabledModules) && enabledModules.includes("crm");
    if (!isCrmEnabled) {
      return { success: false, error: "CRM module is not enabled for this organization." };
    }

    const permissions = requestContext?.get("permissions");
    const hasCrmUpdate = Array.isArray(permissions) && permissions.includes("crm.update");
    if (!hasCrmUpdate) {
      return { success: false, error: "User does not have crm.update permission." };
    }

    const orgIdVal = requestContext?.get("orgId");
    const orgId = typeof orgIdVal === "string" ? orgIdVal : null;
    if (!orgId) {
      return { success: false, error: "Organization context is missing." };
    }

    const userIdVal = requestContext?.get("userId");
    const userId = typeof userIdVal === "string" ? userIdVal : null;
    if (!userId) {
      return { success: false, error: "User context is missing." };
    }

    try {
      // Assert that the target entity exists in this organization and is not deleted
      if (input.entityType === "lead") {
        const item = await db.query.leads.findFirst({
          where: and(
            eq(leads.id, input.entityId),
            eq(leads.organizationId, orgId),
            isNull(leads.deletedAt),
          ),
        });
        if (!item) return { success: false, error: "Lead not found in this organization." };
      } else if (input.entityType === "contact") {
        const item = await db.query.contacts.findFirst({
          where: and(
            eq(contacts.id, input.entityId),
            eq(contacts.organizationId, orgId),
            isNull(contacts.deletedAt),
          ),
        });
        if (!item) return { success: false, error: "Contact not found in this organization." };
      } else if (input.entityType === "company") {
        const item = await db.query.companies.findFirst({
          where: and(
            eq(companies.id, input.entityId),
            eq(companies.organizationId, orgId),
            isNull(companies.deletedAt),
          ),
        });
        if (!item) return { success: false, error: "Company not found in this organization." };
      } else if (input.entityType === "deal") {
        const item = await db.query.deals.findFirst({
          where: and(
            eq(deals.id, input.entityId),
            eq(deals.organizationId, orgId),
            isNull(deals.deletedAt),
          ),
        });
        if (!item) return { success: false, error: "Deal not found in this organization." };
      }

      const id = randomUUID();
      await db.insert(crmActivities).values({
        id,
        organizationId: orgId,
        entityType: input.entityType,
        entityId: input.entityId,
        type: input.type,
        title: input.title,
        details: input.details || undefined,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
        completedAt: input.completed ? new Date() : undefined,
        createdBy: userId,
        updatedBy: userId,
      });

      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "activity",
        entityId: id,
        action: "create",
      });

      return { success: true, id };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown database error";
      return { success: false, error: errMsg };
    }
  },
});
