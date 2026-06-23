import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@admin-template/db";
import { customers, orders, services } from "@admin-template/db/schema/business";
import {
  createCustomerSchema,
  createOrderSchema,
  createServiceSchema,
  tableQuerySchema,
  updateCustomerSchema,
  updateOrderSchema,
  updateServiceSchema,
} from "@admin-template/schemas";
import type { PermissionKey } from "@admin-template/types";
import { z } from "zod";
import { organizationProcedure } from "../index";
import { writeAudit } from "../core/audit";
import { throwNotFound } from "../core/errors";
import {
  OPERATIONS_ATTACHMENT_ENTITY_TYPES,
  deleteStoredAttachment,
  listEntityAttachments,
  toAttachmentMetadata,
} from "../core/operations-media";
import { requirePermission } from "../core/permissions";
import { resolveUniqueServiceSlug } from "../core/storefront-slugs";

const idInputSchema = z.object({ id: z.string().min(1) });
const customerListInputSchema = tableQuerySchema.extend({
  status: z.string().optional(),
  sort: z.string().optional(),
});
const serviceListInputSchema = tableQuerySchema.extend({
  status: z.string().optional(),
  sort: z.string().optional(),
});
const customerAvatarInputSchema = z.object({ customerId: z.string().min(1) });
const customerAvatarDeleteInputSchema = customerAvatarInputSchema.extend({
  attachmentId: z.string().min(1),
});
const servicePhotosInputSchema = z.object({ serviceId: z.string().min(1) });
const servicePhotoDeleteInputSchema = servicePhotosInputSchema.extend({
  attachmentId: z.string().min(1),
});
const orderListInputSchema = tableQuerySchema.extend({
  status: z.string().optional(),
  sort: z.string().optional(),
});

const OPEN_ORDER_STATUSES = ["draft", "confirmed", "in_progress"] as const;

function getSortColumn(sort?: string): { id: string; desc: boolean } | null {
  if (!sort) return null;
  try {
    const parsed = JSON.parse(sort) as { id: string; desc: boolean }[];
    return parsed[0] ?? null;
  } catch {
    return null;
  }
}

function getCustomerOrderBy(sort?: string) {
  const sortColumn = getSortColumn(sort);
  if (!sortColumn) return [desc(customers.createdAt)];
  const direction = sortColumn.desc ? desc : asc;
  if (sortColumn.id === "name") return [direction(customers.name)];
  if (sortColumn.id === "status") return [direction(customers.status)];
  return [desc(customers.createdAt)];
}

function getServiceOrderBy(sort?: string) {
  const sortColumn = getSortColumn(sort);
  if (!sortColumn) return [desc(services.createdAt)];
  const direction = sortColumn.desc ? desc : asc;
  if (sortColumn.id === "name") return [direction(services.name)];
  if (sortColumn.id === "status") return [direction(services.status)];
  if (sortColumn.id === "price") return [direction(services.price)];
  return [desc(services.createdAt)];
}

function isServiceSlugConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505" &&
    "constraint" in error &&
    (error as { constraint?: unknown }).constraint === "services_org_slug_key"
  );
}

function getOrderOrderBy(sort?: string) {
  const sortColumn = getSortColumn(sort);
  if (!sortColumn) return [desc(orders.createdAt)];
  const direction = sortColumn.desc ? desc : asc;
  if (sortColumn.id === "title") return [direction(orders.title)];
  if (sortColumn.id === "status") return [direction(orders.status)];
  if (sortColumn.id === "dueDate") return [direction(orders.dueDate)];
  if (sortColumn.id === "createdAt") return [direction(orders.createdAt)];
  return [desc(orders.createdAt)];
}

async function getActiveCustomer(orgId: string, id: string) {
  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.organizationId, orgId),
      isNull(customers.deletedAt),
    ),
  });
  if (!customer) throwNotFound("Customer");
  return customer;
}

async function getActiveService(orgId: string, id: string) {
  const service = await db.query.services.findFirst({
    where: and(eq(services.id, id), eq(services.organizationId, orgId), isNull(services.deletedAt)),
  });
  if (!service) throwNotFound("Service");
  return service;
}

async function getActiveOrder(orgId: string, id: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.organizationId, orgId), isNull(orders.deletedAt)),
  });
  if (!order) throwNotFound("Order");
  return order;
}

async function assertActiveOrderRelations(
  orgId: string,
  input: { customerId?: string | null; serviceId?: string | null },
) {
  if (input.customerId) {
    await getActiveCustomer(orgId, input.customerId);
  }
  if (input.serviceId) {
    await getActiveService(orgId, input.serviceId);
  }
}

export const operationsRouter = {
  summary: organizationProcedure.handler(async ({ context }) => {
    requirePermission(context, "operations.view" as PermissionKey);
    const orgId = context.activeOrganization!.id;

    const [customerTotal, serviceTotal, orderTotal, openOrderTotal, completedOrderTotal] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(customers)
          .where(and(eq(customers.organizationId, orgId), isNull(customers.deletedAt))),
        db
          .select({ value: count() })
          .from(services)
          .where(and(eq(services.organizationId, orgId), isNull(services.deletedAt))),
        db
          .select({ value: count() })
          .from(orders)
          .where(and(eq(orders.organizationId, orgId), isNull(orders.deletedAt))),
        db
          .select({ value: count() })
          .from(orders)
          .where(
            and(
              eq(orders.organizationId, orgId),
              isNull(orders.deletedAt),
              or(
                eq(orders.status, OPEN_ORDER_STATUSES[0]),
                eq(orders.status, OPEN_ORDER_STATUSES[1]),
                eq(orders.status, OPEN_ORDER_STATUSES[2]),
              ),
            ),
          ),
        db
          .select({ value: count() })
          .from(orders)
          .where(
            and(
              eq(orders.organizationId, orgId),
              isNull(orders.deletedAt),
              eq(orders.status, "completed"),
            ),
          ),
      ]);

    return {
      customers: customerTotal[0]?.value ?? 0,
      services: serviceTotal[0]?.value ?? 0,
      orders: orderTotal[0]?.value ?? 0,
      openOrders: openOrderTotal[0]?.value ?? 0,
      completedOrders: completedOrderTotal[0]?.value ?? 0,
    };
  }),

  customers: {
    list: organizationProcedure
      .input(customerListInputSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "operations.view" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const conditions = [eq(customers.organizationId, orgId), isNull(customers.deletedAt)];
        if (input.search) {
          conditions.push(
            or(
              ilike(customers.name, `%${input.search}%`),
              ilike(customers.email, `%${input.search}%`),
              ilike(customers.phone, `%${input.search}%`),
            )!,
          );
        }
        if (input.status) {
          conditions.push(eq(customers.status, input.status));
        }
        const where = and(...conditions);
        const items = await db.query.customers.findMany({
          where,
          limit: input.pageSize,
          offset: (input.page - 1) * input.pageSize,
          orderBy: getCustomerOrderBy(input.sort),
        });
        const total = await db.select({ value: count() }).from(customers).where(where);
        return { items, total: total[0]?.value ?? 0, page: input.page, pageSize: input.pageSize };
      }),

    get: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.view" as PermissionKey);
      return getActiveCustomer(context.activeOrganization!.id, input.id);
    }),

    create: organizationProcedure
      .input(createCustomerSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "operations.create" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const userId = context.session.user.id;
        const id = randomUUID();
        await db.insert(customers).values({
          id,
          organizationId: orgId,
          name: input.name,
          email: input.email || undefined,
          phone: input.phone || undefined,
          status: input.status,
          notes: input.notes || undefined,
          createdBy: userId,
          updatedBy: userId,
        });
        await writeAudit({
          organizationId: orgId,
          userId,
          moduleKey: "operations",
          entityType: "customer",
          entityId: id,
          action: "create",
        });
        return { id };
      }),

    update: organizationProcedure
      .input(updateCustomerSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "operations.update" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const userId = context.session.user.id;
        await getActiveCustomer(orgId, input.id);
        await db
          .update(customers)
          .set({
            name: input.name,
            email: input.email,
            phone: input.phone,
            status: input.status,
            notes: input.notes,
            updatedBy: userId,
          })
          .where(eq(customers.id, input.id));
        await writeAudit({
          organizationId: orgId,
          userId,
          moduleKey: "operations",
          entityType: "customer",
          entityId: input.id,
          action: "update",
        });
        return { success: true };
      }),

    softDelete: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.delete" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveCustomer(orgId, input.id);
      await db
        .update(customers)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(customers.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "operations",
        entityType: "customer",
        entityId: input.id,
        action: "softDelete",
      });
      return { success: true };
    }),
    avatar: {
      get: organizationProcedure
        .input(customerAvatarInputSchema)
        .handler(async ({ context, input }) => {
          requirePermission(context, "operations.view" as PermissionKey);
          const orgId = context.activeOrganization!.id;
          await getActiveCustomer(orgId, input.customerId);
          const [attachment] = await listEntityAttachments(
            orgId,
            OPERATIONS_ATTACHMENT_ENTITY_TYPES.customerAvatar,
            input.customerId,
          );
          return attachment ? toAttachmentMetadata(attachment) : null;
        }),
      delete: organizationProcedure
        .input(customerAvatarDeleteInputSchema)
        .handler(async ({ context, input }) => {
          requirePermission(context, "operations.update" as PermissionKey);
          const orgId = context.activeOrganization!.id;
          const userId = context.session.user.id;
          await getActiveCustomer(orgId, input.customerId);
          await deleteStoredAttachment({
            organizationId: orgId,
            attachmentId: input.attachmentId,
            userId,
            entityType: OPERATIONS_ATTACHMENT_ENTITY_TYPES.customerAvatar,
            entityId: input.customerId,
          });
          await writeAudit({
            organizationId: orgId,
            userId,
            moduleKey: "operations",
            entityType: "customer",
            entityId: input.customerId,
            action: "deleteAvatar",
            metadata: { attachmentId: input.attachmentId },
          });
          return { success: true };
        }),
    },
  },

  services: {
    list: organizationProcedure
      .input(serviceListInputSchema)
      .handler(async ({ context, input }) => {
        requirePermission(context, "operations.view" as PermissionKey);
        const orgId = context.activeOrganization!.id;
        const conditions = [eq(services.organizationId, orgId), isNull(services.deletedAt)];
        if (input.search) {
          conditions.push(
            or(
              ilike(services.name, `%${input.search}%`),
              ilike(services.description, `%${input.search}%`),
            )!,
          );
        }
        if (input.status) {
          conditions.push(eq(services.status, input.status));
        }
        const where = and(...conditions);
        const items = await db.query.services.findMany({
          where,
          limit: input.pageSize,
          offset: (input.page - 1) * input.pageSize,
          orderBy: getServiceOrderBy(input.sort),
        });
        const total = await db.select({ value: count() }).from(services).where(where);
        return { items, total: total[0]?.value ?? 0, page: input.page, pageSize: input.pageSize };
      }),

    get: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.view" as PermissionKey);
      return getActiveService(context.activeOrganization!.id, input.id);
    }),
    create: organizationProcedure.input(createServiceSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.create" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      const id = randomUUID();

      while (true) {
        const publicSlug = await resolveUniqueServiceSlug(orgId, input.name);

        try {
          await db.insert(services).values({
            id,
            organizationId: orgId,
            name: input.name,
            publicSlug,
            category: input.category?.trim() ? input.category.trim() : undefined,
            description: input.description || undefined,
            status: input.status,
            price: input.price === null ? undefined : input.price?.toString(),
            createdBy: userId,
            updatedBy: userId,
          });
          break;
        } catch (error) {
          if (isServiceSlugConflict(error)) {
            continue;
          }

          throw error;
        }
      }

      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "operations",
        entityType: "service",
        entityId: id,
        action: "create",
      });
      return { id };
    }),

    update: organizationProcedure.input(updateServiceSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.update" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      const current = await getActiveService(orgId, input.id);
      const nextName = input.name ?? current.name;
      const publicSlug =
        current.publicSlug ?? (await resolveUniqueServiceSlug(orgId, nextName, input.id));
      await db
        .update(services)
        .set({
          name: input.name,
          publicSlug,
          category:
            input.category === undefined
              ? undefined
              : input.category.trim()
                ? input.category.trim()
                : null,
          description: input.description,
          status: input.status,
          price:
            input.price === undefined
              ? undefined
              : input.price === null
                ? null
                : input.price.toString(),
          updatedBy: userId,
        })
        .where(eq(services.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "operations",
        entityType: "service",
        entityId: input.id,
        action: "update",
      });
      return { success: true };
    }),

    softDelete: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.delete" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveService(orgId, input.id);
      await db
        .update(services)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(services.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "operations",
        entityType: "service",
        entityId: input.id,
        action: "softDelete",
      });
      return { success: true };
    }),
    photos: {
      list: organizationProcedure
        .input(servicePhotosInputSchema)
        .handler(async ({ context, input }) => {
          requirePermission(context, "operations.view" as PermissionKey);
          const orgId = context.activeOrganization!.id;
          await getActiveService(orgId, input.serviceId);
          const items = await listEntityAttachments(
            orgId,
            OPERATIONS_ATTACHMENT_ENTITY_TYPES.servicePhoto,
            input.serviceId,
          );
          return items.map(toAttachmentMetadata);
        }),
      delete: organizationProcedure
        .input(servicePhotoDeleteInputSchema)
        .handler(async ({ context, input }) => {
          requirePermission(context, "operations.update" as PermissionKey);
          const orgId = context.activeOrganization!.id;
          const userId = context.session.user.id;
          await getActiveService(orgId, input.serviceId);
          await deleteStoredAttachment({
            organizationId: orgId,
            attachmentId: input.attachmentId,
            userId,
            entityType: OPERATIONS_ATTACHMENT_ENTITY_TYPES.servicePhoto,
            entityId: input.serviceId,
          });
          await writeAudit({
            organizationId: orgId,
            userId,
            moduleKey: "operations",
            entityType: "service",
            entityId: input.serviceId,
            action: "deletePhoto",
            metadata: { attachmentId: input.attachmentId },
          });
          return { success: true };
        }),
    },
  },

  orders: {
    list: organizationProcedure.input(orderListInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.view" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const conditions = [eq(orders.organizationId, orgId), isNull(orders.deletedAt)];
      if (input.search) {
        conditions.push(
          or(ilike(orders.title, `%${input.search}%`), ilike(orders.notes, `%${input.search}%`))!,
        );
      }
      if (input.status) {
        conditions.push(eq(orders.status, input.status));
      }
      const where = and(...conditions);
      const items = await db.query.orders.findMany({
        where,
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
        orderBy: getOrderOrderBy(input.sort),
      });
      const total = await db.select({ value: count() }).from(orders).where(where);
      return { items, total: total[0]?.value ?? 0, page: input.page, pageSize: input.pageSize };
    }),

    get: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.view" as PermissionKey);
      return getActiveOrder(context.activeOrganization!.id, input.id);
    }),

    create: organizationProcedure.input(createOrderSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.create" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await assertActiveOrderRelations(orgId, input);
      const id = randomUUID();
      await db.insert(orders).values({
        id,
        organizationId: orgId,
        title: input.title,
        customerId: input.customerId || undefined,
        serviceId: input.serviceId || undefined,
        status: input.status,
        totalAmount: input.totalAmount?.toString(),
        dueDate: input.dueDate || undefined,
        notes: input.notes || undefined,
        createdBy: userId,
        updatedBy: userId,
      });
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "operations",
        entityType: "order",
        entityId: id,
        action: "create",
      });
      return { id };
    }),

    update: organizationProcedure.input(updateOrderSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.update" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveOrder(orgId, input.id);
      await assertActiveOrderRelations(orgId, input);
      await db
        .update(orders)
        .set({
          title: input.title,
          customerId: input.customerId,
          serviceId: input.serviceId,
          status: input.status,
          totalAmount: input.totalAmount?.toString(),
          dueDate: input.dueDate,
          notes: input.notes,
          updatedBy: userId,
        })
        .where(eq(orders.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "operations",
        entityType: "order",
        entityId: input.id,
        action: "update",
      });
      return { success: true };
    }),

    softDelete: organizationProcedure.input(idInputSchema).handler(async ({ context, input }) => {
      requirePermission(context, "operations.delete" as PermissionKey);
      const orgId = context.activeOrganization!.id;
      const userId = context.session.user.id;
      await getActiveOrder(orgId, input.id);
      await db
        .update(orders)
        .set({ deletedAt: new Date(), updatedBy: userId })
        .where(eq(orders.id, input.id));
      await writeAudit({
        organizationId: orgId,
        userId,
        moduleKey: "operations",
        entityType: "order",
        entityId: input.id,
        action: "softDelete",
      });
      return { success: true };
    }),
  },
};
