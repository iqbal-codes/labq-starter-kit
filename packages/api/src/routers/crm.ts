import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@labq-modules/db";
import {
  companies,
  contacts,
  crmActivities,
  dealStages,
  deals,
  leads,
} from "@labq-modules/db/schema/business";
import {
  CRM_ENTITY_TYPES,
  bulkCreateContactsSchema,
  contactAttachmentListInputSchema,
  convertLeadSchema,
  createCompanySchema,
  createContactSchema,
  createCrmActivitySchema,
  createDealSchema,
  createDealStageSchema,
  createLeadSchema,
  deleteAttachmentSchema,
  reorderDealStagesSchema,
  updateCompanySchema,
  updateContactSchema,
  updateCrmActivitySchema,
  updateDealSchema,
  updateDealStageSchema,
  updateLeadSchema,
} from "@labq-modules/schemas";
import type { PermissionKey } from "@labq-modules/types";
import { organizationProcedure } from "../index";
import { throwNotFound } from "../core/errors";
import { writeAudit } from "../core/audit";
import { requirePermission } from "../core/permissions";
import {
  assertActiveContact,
  getActiveContactAttachment,
  listContactAttachmentItems,
  softDeleteContactAttachmentRecord,
} from "../core/attachments";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3_BUCKET, getS3Client } from "../core/s3";
import { z } from "zod";

const idInputSchema = z.object({ id: z.string().min(1) });

const leadListInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
});

const contactListInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
});

const companyListInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
});

const dealListInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  stageId: z.string().optional(),
  sort: z.string().optional(),
});

const stageListInputSchema = z.object({
  includeRetired: z.boolean().default(false),
});

const activityListInputSchema = z.object({
  entityType: z.enum(CRM_ENTITY_TYPES),
  entityId: z.string().min(1),
});

function getSortColumn(sort?: string): { id: string; desc: boolean } | null {
  if (!sort) return null;
  try {
    const parsed = JSON.parse(sort) as { id: string; desc: boolean }[];
    return parsed[0] ?? null;
  } catch {
    return null;
  }
}

function toIsoString(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

function getLeadOrderBy(sort?: string) {
  const sortColumn = getSortColumn(sort);
  if (!sortColumn) return [desc(leads.createdAt)];
  const direction = sortColumn.desc ? desc : asc;
  if (sortColumn.id === "name") return [direction(leads.name)];
  if (sortColumn.id === "status") return [direction(leads.status)];
  if (sortColumn.id === "companyName") return [direction(leads.companyName)];
  return [desc(leads.createdAt)];
}

function getContactOrderBy(sort?: string) {
  const sortColumn = getSortColumn(sort);
  if (!sortColumn) return [desc(contacts.createdAt)];
  const direction = sortColumn.desc ? desc : asc;
  if (sortColumn.id === "name") return [direction(contacts.name)];
  if (sortColumn.id === "email") return [direction(contacts.email)];
  if (sortColumn.id === "phone") return [direction(contacts.phone)];
  if (sortColumn.id === "status") return [direction(contacts.status)];
  return [desc(contacts.createdAt)];
}

function getCompanyOrderBy(sort?: string) {
  const sortColumn = getSortColumn(sort);
  if (!sortColumn) return [desc(companies.createdAt)];
  const direction = sortColumn.desc ? desc : asc;
  if (sortColumn.id === "name") return [direction(companies.name)];
  if (sortColumn.id === "status") return [direction(companies.status)];
  if (sortColumn.id === "industry") return [direction(companies.industry)];
  if (sortColumn.id === "website") return [direction(companies.website)];
  return [desc(companies.createdAt)];
}

function getDealOrderBy(sort?: string) {
  const sortColumn = getSortColumn(sort);
  if (!sortColumn) return [desc(deals.createdAt)];
  const direction = sortColumn.desc ? desc : asc;
  if (sortColumn.id === "title") return [direction(deals.title)];
  if (sortColumn.id === "value") return [direction(deals.value)];
  if (sortColumn.id === "expectedCloseDate") return [direction(deals.expectedCloseDate)];
  return [desc(deals.createdAt)];
}

async function getActiveLead(orgId: string, id: string) {
  const lead = await db.query.leads.findFirst({
    where: and(eq(leads.id, id), eq(leads.organizationId, orgId), isNull(leads.deletedAt)),
  });
  if (!lead) throwNotFound("Lead");
  return lead;
}

async function getActiveContact(orgId: string, id: string) {
  const contact = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, id), eq(contacts.organizationId, orgId), isNull(contacts.deletedAt)),
  });
  if (!contact) throwNotFound("Contact");
  return contact;
}

async function getActiveCompany(orgId: string, id: string) {
  const company = await db.query.companies.findFirst({
    where: and(
      eq(companies.id, id),
      eq(companies.organizationId, orgId),
      isNull(companies.deletedAt),
    ),
  });
  if (!company) throwNotFound("Company");
  return company;
}

async function getActiveDeal(orgId: string, id: string) {
  const deal = await db.query.deals.findFirst({
    where: and(eq(deals.id, id), eq(deals.organizationId, orgId), isNull(deals.deletedAt)),
  });
  if (!deal) throwNotFound("Deal");
  return deal;
}

async function getActiveStage(orgId: string, id: string) {
  const stage = await db.query.dealStages.findFirst({
    where: and(
      eq(dealStages.id, id),
      eq(dealStages.organizationId, orgId),
      isNull(dealStages.deletedAt),
    ),
  });
  if (!stage) throwNotFound("Deal stage");
  return stage;
}

async function getDefaultOpenStage(orgId: string) {
  const stage = await db.query.dealStages.findFirst({
    where: and(
      eq(dealStages.organizationId, orgId),
      eq(dealStages.kind, "open"),
      isNull(dealStages.deletedAt),
    ),
    orderBy: [asc(dealStages.sortOrder), asc(dealStages.createdAt)],
  });
  if (!stage) {
    throw new ORPCError("VALIDATION_ERROR", {
      message: "Create at least one open pipeline stage before creating deals.",
    });
  }
  return stage;
}

async function assertActivityEntity(
  orgId: string,
  entityType: (typeof CRM_ENTITY_TYPES)[number],
  entityId: string,
) {
  if (entityType === "lead") {
    await getActiveLead(orgId, entityId);
    return;
  }
  if (entityType === "contact") {
    await getActiveContact(orgId, entityId);
    return;
  }
  if (entityType === "company") {
    await getActiveCompany(orgId, entityId);
    return;
  }
  await getActiveDeal(orgId, entityId);
}

function serializeActivity(activity: typeof crmActivities.$inferSelect) {
  return {
    ...activity,
    dueAt: toIsoString(activity.dueAt),
    occurredAt: toIsoString(activity.occurredAt),
    completedAt: toIsoString(activity.completedAt),
    createdAt: toIsoString(activity.createdAt),
    updatedAt: toIsoString(activity.updatedAt),
    deletedAt: toIsoString(activity.deletedAt),
  };
}

async function listStageSummaries(orgId: string, includeRetired = false) {
  const stageWhere = includeRetired
    ? eq(dealStages.organizationId, orgId)
    : and(eq(dealStages.organizationId, orgId), isNull(dealStages.deletedAt));
  const [stages, activeDeals] = await Promise.all([
    db.query.dealStages.findMany({
      where: stageWhere,
      orderBy: [asc(dealStages.sortOrder), asc(dealStages.createdAt)],
    }),
    db.query.deals.findMany({
      where: and(eq(deals.organizationId, orgId), isNull(deals.deletedAt)),
    }),
  ]);

  return stages.map((stage) => {
    let dealCount = 0;
    let totalValue = 0;
    for (const deal of activeDeals) {
      if (deal.stageId !== stage.id) continue;
      dealCount += 1;
      if (deal.value) totalValue += Number(deal.value);
    }
    return {
      ...stage,
      dealCount,
      totalValue,
      createdAt: toIsoString(stage.createdAt),
      updatedAt: toIsoString(stage.updatedAt),
      deletedAt: toIsoString(stage.deletedAt),
    };
  });
}

export const crmRouter = {
  summary: organizationProcedure.handler(async ({ context }) => {
    requirePermission(context, "crm.view" as PermissionKey);
    const orgId = context.activeOrganization!.id;
    const now = new Date();
    const [leadRows, contactRows, companyRows, dealRows, stageSummaries, overdueTasks] =
      await Promise.all([
        db.query.leads.findMany({
          where: and(eq(leads.organizationId, orgId), isNull(leads.deletedAt)),
        }),
        db.query.contacts.findMany({
          where: and(eq(contacts.organizationId, orgId), isNull(contacts.deletedAt)),
        }),
        db.query.companies.findMany({
          where: and(eq(companies.organizationId, orgId), isNull(companies.deletedAt)),
        }),
        db.query.deals.findMany({
          where: and(eq(deals.organizationId, orgId), isNull(deals.deletedAt)),
        }),
        listStageSummaries(orgId),
        db.query.crmActivities.findMany({
          where: and(
            eq(crmActivities.organizationId, orgId),
            eq(crmActivities.type, "task"),
            isNull(crmActivities.deletedAt),
            isNull(crmActivities.completedAt),
          ),
        }),
      ]);

    let wonDeals = 0;
    let lostDeals = 0;
    for (const stage of stageSummaries) {
      if (stage.kind === "won") wonDeals += stage.dealCount;
      if (stage.kind === "lost") lostDeals += stage.dealCount;
    }

    let overdueTaskCount = 0;
    for (const task of overdueTasks) {
      if (task.dueAt && task.dueAt < now) overdueTaskCount += 1;
    }

    return {
      leads: leadRows.length,
      contacts: contactRows.length,
      companies: companyRows.length,
      deals: dealRows.length,
      openDeals: Math.max(0, dealRows.length - wonDeals - lostDeals),
      wonDeals,
      lostDeals,
      overdueTasks: overdueTaskCount,
      stageCounts: stageSummaries.map((stage) => ({
        id: stage.id,
        name: stage.name,
        kind: stage.kind,
        dealCount: stage.dealCount,
        totalValue: stage.totalValue,
      })),
    };
  }),

  leads: {
    list: organizationProcedure.input(leadListInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.view" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const conditions = [eq(leads.organizationId, orgId), isNull(leads.deletedAt)];
      if (input.search) {
        conditions.push(
          or(
            ilike(leads.name, `%${input.search}%`),
            ilike(leads.email, `%${input.search}%`),
            ilike(leads.companyName, `%${input.search}%`),
          )!,
        );
      }
      if (input.status) conditions.push(eq(leads.status, input.status));
      const where = and(...conditions);
      const items = await db.query.leads.findMany({
        where,
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
        orderBy: getLeadOrderBy(input.sort),
      });
      const total = await db.select({ value: count() }).from(leads).where(where);
      return { items, total: total[0]?.value ?? 0, page: input.page, pageSize: input.pageSize };
    }),

    get: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.view" as PermissionKey);
      return getActiveLead(context.activeOrganization!.id, input.id);
    }),

    create: organizationProcedure.input(createLeadSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.create" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      const id = randomUUID();
      await db.insert(leads).values({
        id,
        organizationId: orgId,
        name: input.name,
        email: input.email || undefined,
        phone: input.phone || undefined,
        companyName: input.companyName || undefined,
        status: input.status,
        source: input.source || undefined,
        notes: input.notes || undefined,
        createdBy: userId,
        updatedBy: userId,
      });
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "lead",
        entityId: id,
        action: "create",
      });
      return { id };
    }),

    update: organizationProcedure.input(updateLeadSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.update" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveLead(orgId, input.id);
      await db
        .update(leads)
        .set({
          name: input.name,
          email: input.email,
          phone: input.phone,
          companyName: input.companyName,
          status: input.status,
          source: input.source,
          notes: input.notes,
          updatedBy: userId,
        })
        .where(eq(leads.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "lead",
        entityId: input.id,
        action: "update",
      });
      return { success: true };
    }),

    convert: organizationProcedure.input(convertLeadSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.update" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      const lead = await getActiveLead(orgId, input.id);
      if (lead.convertedAt) {
        throw new ORPCError("VALIDATION_ERROR", { message: "Lead has already been converted." });
      }

      const contactId = randomUUID();
      const contactName = input.contactName?.trim() || lead.name;
      let companyId: string | undefined;
      const companyName = input.companyName?.trim() || lead.companyName?.trim();
      if (input.createCompany && companyName) {
        const existingCompany = await db.query.companies.findFirst({
          where: and(
            eq(companies.organizationId, orgId),
            eq(companies.name, companyName),
            isNull(companies.deletedAt),
          ),
        });
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          companyId = randomUUID();
          await db.insert(companies).values({
            id: companyId,
            organizationId: orgId,
            name: companyName,
            status: "customer",
            createdBy: userId,
            updatedBy: userId,
          });
          await writeAudit({
            organizationId: orgId,
            userId,
            moduleKey: "crm",
            entityType: "company",
            entityId: companyId,
            action: "create",
          });
        }
      }

      await db.insert(contacts).values({
        id: contactId,
        organizationId: orgId,
        name: contactName,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        companyId,
        status: "active",
        source: lead.source || undefined,
        notes: lead.notes || undefined,
        createdBy: userId,
        updatedBy: userId,
      });
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "contact",
        entityId: contactId,
        action: "create",
      });

      let dealId: string | undefined;
      if (input.createDeal) {
        let stageId = input.stageId;
        if (stageId) {
          await getActiveStage(orgId, stageId);
        } else {
          stageId = (await getDefaultOpenStage(orgId)).id;
        }
        dealId = randomUUID();
        await db.insert(deals).values({
          id: dealId,
          organizationId: orgId,
          title: input.dealTitle?.trim() || `${lead.name} Opportunity`,
          companyId,
          contactId,
          value: input.dealValue?.toString(),
          stageId,
          notes: lead.notes || undefined,
          createdBy: userId,
          updatedBy: userId,
        });
        await writeAudit({
          organizationId: orgId,
          userId,
          moduleKey: "crm",
          entityType: "deal",
          entityId: dealId,
          action: "create",
        });
      }

      const convertedAt = new Date();
      await db
        .update(leads)
        .set({
          status: "converted",
          convertedAt,
          convertedContactId: contactId,
          convertedCompanyId: companyId,
          convertedDealId: dealId,
          updatedBy: userId,
        })
        .where(eq(leads.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "lead",
        entityId: input.id,
        action: "convert",
        metadata: { contactId, companyId, dealId },
      });
      return { contactId, companyId, dealId };
    }),

    softDelete: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.delete" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveLead(orgId, input.id);
      await db
        .update(leads)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(leads.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "lead",
        entityId: input.id,
        action: "softDelete",
      });
      return { success: true };
    }),
  },

  contacts: {
    list: organizationProcedure
      .input(contactListInputSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.view" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const conditions = [eq(contacts.organizationId, orgId), isNull(contacts.deletedAt)];
        if (input.search) {
          conditions.push(
            or(
              ilike(contacts.name, `%${input.search}%`),
              ilike(contacts.email, `%${input.search}%`),
            )!,
          );
        }
        if (input.status) {
          conditions.push(eq(contacts.status, input.status));
        }
        const where = and(...conditions);
        const items = await db.query.contacts.findMany({
          where,
          limit: input.pageSize,
          offset: (input.page - 1) * input.pageSize,
          orderBy: getContactOrderBy(input.sort),
        });
        const total = await db.select({ value: count() }).from(contacts).where(where);
        return { items, total: total[0]?.value ?? 0, page: input.page, pageSize: input.pageSize };
      }),

    get: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.view" as PermissionKey);
      return getActiveContact(context.activeOrganization!.id, input.id);
    }),

    create: organizationProcedure.input(createContactSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.create" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      if (input.companyId) await getActiveCompany(orgId, input.companyId);
      const id = randomUUID();
      await db.insert(contacts).values({
        id,
        organizationId: orgId,
        name: input.name,
        email: input.email || undefined,
        phone: input.phone || undefined,
        companyId: input.companyId || undefined,
        status: input.status,
        source: input.source || undefined,
        notes: input.notes || undefined,
        createdBy: userId,
        updatedBy: userId,
      });
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "contact",
        entityId: id,
        action: "create",
      });
      return { id };
    }),

    update: organizationProcedure.input(updateContactSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.update" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveContact(orgId, input.id);
      if (input.companyId) await getActiveCompany(orgId, input.companyId);
      await db
        .update(contacts)
        .set({
          name: input.name,
          email: input.email,
          phone: input.phone,
          companyId: input.companyId,
          status: input.status,
          source: input.source,
          notes: input.notes,
          updatedBy: userId,
        })
        .where(eq(contacts.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "contact",
        entityId: input.id,
        action: "update",
      });
      return { success: true };
    }),

    softDelete: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.delete" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveContact(orgId, input.id);
      await db
        .update(contacts)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(contacts.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "contact",
        entityId: input.id,
        action: "softDelete",
      });
      return { success: true };
    }),

    exportRows: organizationProcedure
      .input(contactListInputSchema.pick({ search: true, status: true, sort: true }))
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.view" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const conditions = [eq(contacts.organizationId, orgId), isNull(contacts.deletedAt)];
        if (input.search) {
          conditions.push(
            or(
              ilike(contacts.name, `%${input.search}%`),
              ilike(contacts.email, `%${input.search}%`),
            )!,
          );
        }
        if (input.status) {
          conditions.push(eq(contacts.status, input.status));
        }
        const where = and(...conditions);
        const items = await db.query.contacts.findMany({
          where,
          orderBy: getContactOrderBy(input.sort),
        });
        return items.map((item) => ({
          name: item.name ?? "",
          email: item.email ?? "",
          phone: item.phone ?? "",
          status: item.status ?? "",
          source: item.source ?? "",
          notes: item.notes ?? "",
        }));
      }),

    bulkCreate: organizationProcedure
      .input(bulkCreateContactsSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.create" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const userId = context.session.user.id;
        const importBatchId = randomUUID();
        let successCount = 0;
        const errors: { rowNumber: number; message: string; values: Record<string, unknown> }[] =
          [];

        for (let i = 0; i < input.records.length; i++) {
          const record = input.records[i]!;
          try {
            const id = randomUUID();
            await db.insert(contacts).values({
              id,
              organizationId: orgId,
              name: record.name,
              email: record.email || undefined,
              phone: record.phone || undefined,
              status: record.status,
              source: record.source || undefined,
              notes: record.notes || undefined,
              createdBy: userId,
              updatedBy: userId,
            });
            await writeAudit({
              organizationId: orgId,
              userId,
              moduleKey: "crm",
              entityType: "contact",
              entityId: id,
              action: "create",
              metadata: { source: "csv-import", importBatchId, rowNumber: i + 2 },
            });
            successCount += 1;
          } catch (error) {
            errors.push({
              rowNumber: i + 2,
              message: error instanceof Error ? error.message : "Import failed",
              values: record as Record<string, unknown>,
            });
          }
        }

        return { importBatchId, successCount, errorCount: errors.length, errors };
      }),

    attachments: {
      list: organizationProcedure
        .input(contactAttachmentListInputSchema)
        .handler(async ({ context, input }) => {
          requirePermission(context, "crm.view" as PermissionKey);
          const orgId = context.activeOrganization!.id;
          await assertActiveContact(orgId, input.contactId);
          return listContactAttachmentItems(orgId, input.contactId);
        }),

      delete: organizationProcedure
        .input(deleteAttachmentSchema)
        .handler(async ({ context, input }) => {
          requirePermission(context, "crm.delete" as PermissionKey);
          const orgId = context.activeOrganization!.id;
          const userId = context.session.user.id;
          const attachment = await getActiveContactAttachment(orgId, input.id);

          try {
            const s3 = getS3Client();
            await s3.send(
              new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: attachment.storageKey }),
            );
          } catch (err) {
            if (err instanceof Error && err.name !== "NoSuchKey") {
              throw err;
            }
          }

          await softDeleteContactAttachmentRecord(orgId, input.id, userId);
          await writeAudit({
            organizationId: orgId,
            userId,
            moduleKey: "crm",
            entityType: "contact",
            entityId: attachment.entityId,
            action: "attachment.delete",
            metadata: {
              attachmentId: attachment.id,
              fileName: attachment.fileName,
              storageKey: attachment.storageKey,
            },
          });

          return { success: true };
        }),
    },
  },

  companies: {
    list: organizationProcedure
      .input(companyListInputSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.view" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const conditions = [eq(companies.organizationId, orgId), isNull(companies.deletedAt)];
        if (input.search) conditions.push(ilike(companies.name, `%${input.search}%`));
        if (input.status) conditions.push(eq(companies.status, input.status));
        const where = and(...conditions);
        const items = await db.query.companies.findMany({
          where,
          limit: input.pageSize,
          offset: (input.page - 1) * input.pageSize,
          orderBy: getCompanyOrderBy(input.sort),
        });
        const total = await db.select({ value: count() }).from(companies).where(where);
        return { items, total: total[0]?.value ?? 0, page: input.page, pageSize: input.pageSize };
      }),

    get: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.view" as PermissionKey);
      return getActiveCompany(context.activeOrganization!.id, input.id);
    }),

    create: organizationProcedure.input(createCompanySchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.create" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      const id = randomUUID();
      await db.insert(companies).values({
        id,
        organizationId: orgId,
        name: input.name,
        status: input.status,
        industry: input.industry || undefined,
        website: input.website || undefined,
        email: input.email || undefined,
        phone: input.phone || undefined,
        address: input.address || undefined,
        createdBy: userId,
        updatedBy: userId,
      });
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "company",
        entityId: id,
        action: "create",
      });
      return { id };
    }),

    update: organizationProcedure.input(updateCompanySchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.update" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveCompany(orgId, input.id);
      await db
        .update(companies)
        .set({
          name: input.name,
          status: input.status,
          industry: input.industry,
          website: input.website,
          email: input.email,
          phone: input.phone,
          address: input.address,
          updatedBy: userId,
        })
        .where(eq(companies.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "company",
        entityId: input.id,
        action: "update",
      });
      return { success: true };
    }),

    softDelete: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.delete" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveCompany(orgId, input.id);
      await db
        .update(companies)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(companies.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "company",
        entityId: input.id,
        action: "softDelete",
      });
      return { success: true };
    }),
  },

  stages: {
    list: organizationProcedure.input(stageListInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.view" as PermissionKey);
      return listStageSummaries(context.activeOrganization!.id, input.includeRetired);
    }),

    create: organizationProcedure
      .input(createDealStageSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.update" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const userId = context.session.user.id;
        const existingStages = await db.query.dealStages.findMany({
          where: and(eq(dealStages.organizationId, orgId), isNull(dealStages.deletedAt)),
          orderBy: [desc(dealStages.sortOrder)],
          limit: 1,
        });
        const id = randomUUID();
        const nextSortOrder = (existingStages[0]?.sortOrder ?? -1) + 1;
        await db.insert(dealStages).values({
          id,
          organizationId: orgId,
          name: input.name,
          kind: input.kind,
          sortOrder: nextSortOrder,
          createdBy: userId,
          updatedBy: userId,
        });
        await writeAudit({
          organizationId: orgId,
          userId,
          moduleKey: "crm",
          entityType: "deal_stage",
          entityId: id,
          action: "create",
        });
        return { id };
      }),

    update: organizationProcedure
      .input(updateDealStageSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.update" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const userId = context.session.user.id;
        await getActiveStage(orgId, input.id);
        await db
          .update(dealStages)
          .set({
            name: input.name,
            kind: input.kind,
            updatedBy: userId,
          })
          .where(eq(dealStages.id, input.id));
        await writeAudit({
          organizationId: orgId,
          userId,
          moduleKey: "crm",
          entityType: "deal_stage",
          entityId: input.id,
          action: "update",
        });
        return { success: true };
      }),

    reorder: organizationProcedure
      .input(reorderDealStagesSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.update" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const userId = context.session.user.id;
        const stagesForOrg = await db.query.dealStages.findMany({
          where: and(eq(dealStages.organizationId, orgId), isNull(dealStages.deletedAt)),
        });
        const stageIds = new Set(stagesForOrg.map((stage) => stage.id));
        if (
          input.stageIds.length !== stagesForOrg.length ||
          input.stageIds.some((id) => !stageIds.has(id))
        ) {
          throw new ORPCError("VALIDATION_ERROR", {
            message: "Stage reorder payload is out of sync.",
          });
        }
        for (let i = 0; i < input.stageIds.length; i++) {
          await db
            .update(dealStages)
            .set({ sortOrder: i, updatedBy: userId })
            .where(eq(dealStages.id, input.stageIds[i]!));
        }
        await writeAudit({
          organizationId: orgId,
          userId,
          moduleKey: "crm",
          entityType: "deal_stage",
          entityId: "pipeline",
          action: "reorder",
        });
        return { success: true };
      }),

    retire: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.update" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveStage(orgId, input.id);
      const linkedDeals = await db
        .select({ value: count() })
        .from(deals)
        .where(
          and(
            eq(deals.organizationId, orgId),
            eq(deals.stageId, input.id),
            isNull(deals.deletedAt),
          ),
        );
      if ((linkedDeals[0]?.value ?? 0) > 0) {
        throw new ORPCError("VALIDATION_ERROR", {
          message: "Move active deals before retiring this stage.",
        });
      }
      await db
        .update(dealStages)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(dealStages.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "deal_stage",
        entityId: input.id,
        action: "retire",
      });
      return { success: true };
    }),
  },

  deals: {
    list: organizationProcedure.input(dealListInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.view" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const conditions = [eq(deals.organizationId, orgId), isNull(deals.deletedAt)];
      if (input.search) conditions.push(ilike(deals.title, `%${input.search}%`));
      if (input.stageId) conditions.push(eq(deals.stageId, input.stageId));
      const where = and(...conditions);
      const items = await db.query.deals.findMany({
        where,
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
        orderBy: getDealOrderBy(input.sort),
      });
      const total = await db.select({ value: count() }).from(deals).where(where);
      return { items, total: total[0]?.value ?? 0, page: input.page, pageSize: input.pageSize };
    }),

    get: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.view" as PermissionKey);
      return getActiveDeal(context.activeOrganization!.id, input.id);
    }),

    create: organizationProcedure.input(createDealSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.create" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      if (input.companyId) await getActiveCompany(orgId, input.companyId);
      if (input.contactId) await getActiveContact(orgId, input.contactId);
      let stageId = input.stageId;
      if (stageId) {
        await getActiveStage(orgId, stageId);
      } else {
        stageId = (await getDefaultOpenStage(orgId)).id;
      }
      const id = randomUUID();
      await db.insert(deals).values({
        id,
        organizationId: orgId,
        title: input.title,
        companyId: input.companyId || undefined,
        contactId: input.contactId || undefined,
        value: input.value?.toString(),
        stageId,
        expectedCloseDate: input.expectedCloseDate || undefined,
        notes: input.notes || undefined,
        createdBy: userId,
        updatedBy: userId,
      });
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "deal",
        entityId: id,
        action: "create",
      });
      return { id };
    }),

    update: organizationProcedure.input(updateDealSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.update" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveDeal(orgId, input.id);
      if (input.companyId) await getActiveCompany(orgId, input.companyId);
      if (input.contactId) await getActiveContact(orgId, input.contactId);
      if (input.stageId) await getActiveStage(orgId, input.stageId);
      await db
        .update(deals)
        .set({
          title: input.title,
          companyId: input.companyId,
          contactId: input.contactId,
          value: input.value?.toString(),
          stageId: input.stageId,
          expectedCloseDate: input.expectedCloseDate,
          notes: input.notes,
          updatedBy: userId,
        })
        .where(eq(deals.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "deal",
        entityId: input.id,
        action: "update",
      });
      return { success: true };
    }),

    softDelete: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.delete" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveDeal(orgId, input.id);
      await db
        .update(deals)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(deals.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "deal",
        entityId: input.id,
        action: "softDelete",
      });
      return { success: true };
    }),
  },

  activities: {
    list: organizationProcedure
      .input(activityListInputSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.view" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        await assertActivityEntity(orgId, input.entityType, input.entityId);
        const items = await db.query.crmActivities.findMany({
          where: and(
            eq(crmActivities.organizationId, orgId),
            eq(crmActivities.entityType, input.entityType),
            eq(crmActivities.entityId, input.entityId),
            isNull(crmActivities.deletedAt),
          ),
          orderBy: [
            desc(crmActivities.occurredAt),
            desc(crmActivities.dueAt),
            desc(crmActivities.createdAt),
          ],
        });
        return items.map(serializeActivity);
      }),

    create: organizationProcedure
      .input(createCrmActivitySchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.update" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const userId = context.session.user.id;
        await assertActivityEntity(orgId, input.entityType, input.entityId);
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
        return { id };
      }),

    update: organizationProcedure
      .input(updateCrmActivitySchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "crm.update" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const userId = context.session.user.id;
        const activity = await db.query.crmActivities.findFirst({
          where: and(
            eq(crmActivities.id, input.id),
            eq(crmActivities.organizationId, orgId),
            isNull(crmActivities.deletedAt),
          ),
        });
        if (!activity) throwNotFound("Activity");
        await db
          .update(crmActivities)
          .set({
            type: input.type,
            title: input.title,
            details: input.details,
            dueAt: input.dueAt
              ? new Date(input.dueAt)
              : input.dueAt === undefined
                ? undefined
                : null,
            occurredAt: input.occurredAt
              ? new Date(input.occurredAt)
              : input.occurredAt === undefined
                ? undefined
                : null,
            completedAt:
              input.completed === undefined ? undefined : input.completed ? new Date() : null,
            updatedBy: userId,
          })
          .where(eq(crmActivities.id, input.id));
        await writeAudit({
          organizationId: orgId,
          userId,
          moduleKey: "crm",
          entityType: "activity",
          entityId: input.id,
          action: "update",
        });
        return { success: true };
      }),

    softDelete: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "crm.delete" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      const activity = await db.query.crmActivities.findFirst({
        where: and(
          eq(crmActivities.id, input.id),
          eq(crmActivities.organizationId, orgId),
          isNull(crmActivities.deletedAt),
        ),
      });
      if (!activity) throwNotFound("Activity");
      await db
        .update(crmActivities)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(crmActivities.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "crm",
        entityType: "activity",
        entityId: input.id,
        action: "softDelete",
      });
      return { success: true };
    }),
  },
};
