import { pgTable, text, timestamp, index, decimal, integer, unique } from "drizzle-orm/pg-core";

// ── Organization Settings ──────────────────────────────────────

export const organizationSettings = pgTable(
  "organization_settings",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    currency: text("currency").notNull().default("IDR"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("org_settings_orgId_idx").on(table.organizationId)],
);

// ── Audit Logs ─────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    actorUserId: text("actor_user_id").notNull(),
    moduleKey: text("module_key"),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("audit_logs_orgId_idx").on(table.organizationId)],
);

// ── Attachments ────────────────────────────────────────────────

export const attachments = pgTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  },
  (table) => [
    unique("attachments_storage_key_idx").on(table.storageKey),
    index("attachments_orgId_idx").on(table.organizationId),
    index("attachments_entity_idx").on(table.organizationId, table.entityType, table.entityId),
  ],
);

// ── Operations: Customers ─────────────────────────────────────

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  },
  (table) => [
    index("customers_orgId_idx").on(table.organizationId),
    index("customers_status_idx").on(table.organizationId, table.status),
  ],
);

// ── Operations: Services ──────────────────────────────────────

export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull().default("active"),
    price: decimal("price", { precision: 15, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  },
  (table) => [
    index("services_orgId_idx").on(table.organizationId),
    index("services_status_idx").on(table.organizationId, table.status),
  ],
);

// ── Operations: Orders ────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    title: text("title").notNull(),
    customerId: text("customer_id"),
    serviceId: text("service_id"),
    status: text("status").notNull().default("draft"),
    totalAmount: decimal("total_amount", { precision: 15, scale: 2 }),
    dueDate: text("due_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  },
  (table) => [
    index("orders_orgId_idx").on(table.organizationId),
    index("orders_status_idx").on(table.organizationId, table.status),
  ],
);
