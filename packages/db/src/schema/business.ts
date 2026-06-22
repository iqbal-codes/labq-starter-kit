import {
  pgTable,
  text,
  timestamp,
  index,
  decimal,
  integer,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────

export const moduleKeyEnum = pgEnum("module_key", ["crm", "inventory"]);
export const dealStageKindEnum = pgEnum("deal_stage_kind", ["open", "won", "lost"]);
export const crmActivityTypeEnum = pgEnum("crm_activity_type", ["note", "task", "call", "meeting"]);
export const crmActivityEntityTypeEnum = pgEnum("crm_activity_entity_type", [
  "lead",
  "contact",
  "company",
  "deal",
]);

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

// ── CRM: Leads ─────────────────────────────────────────────────

export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    companyName: text("company_name"),
    status: text("status").notNull().default("new"),
    source: text("source"),
    notes: text("notes"),
    convertedAt: timestamp("converted_at"),
    convertedContactId: text("converted_contact_id"),
    convertedCompanyId: text("converted_company_id"),
    convertedDealId: text("converted_deal_id"),
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
    index("leads_orgId_idx").on(table.organizationId),
    index("leads_status_idx").on(table.organizationId, table.status),
  ],
);

// ── CRM: Contacts ──────────────────────────────────────────────

export const contacts = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    companyId: text("company_id"),
    status: text("status").notNull().default("active"),
    source: text("source"),
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
  (table) => [index("contacts_orgId_idx").on(table.organizationId)],
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

// ── CRM: Companies ─────────────────────────────────────────────

export const companies = pgTable(
  "companies",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("prospect"),
    industry: text("industry"),
    website: text("website"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
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
    index("companies_orgId_idx").on(table.organizationId),
    index("companies_status_idx").on(table.organizationId, table.status),
  ],
);

// ── CRM: Deal Stages ──────────────────────────────────────────

export const dealStages = pgTable(
  "deal_stages",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    kind: dealStageKindEnum("kind").notNull().default("open"),
    sortOrder: integer("sort_order").notNull().default(0),
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
    index("deal_stages_orgId_idx").on(table.organizationId),
    unique("deal_stages_orgId_name_unique").on(table.organizationId, table.name),
  ],
);

// ── CRM: Deals ─────────────────────────────────────────────────

export const deals = pgTable(
  "deals",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    title: text("title").notNull(),
    companyId: text("company_id"),
    contactId: text("contact_id"),
    value: decimal("value", { precision: 15, scale: 2 }),
    stageId: text("stage_id"),
    expectedCloseDate: text("expected_close_date"),
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
  (table) => [index("deals_orgId_idx").on(table.organizationId)],
);

// ── CRM: Activities ────────────────────────────────────────────

export const crmActivities = pgTable(
  "crm_activities",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    entityType: crmActivityEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    type: crmActivityTypeEnum("type").notNull().default("note"),
    title: text("title").notNull(),
    details: text("details"),
    dueAt: timestamp("due_at"),
    occurredAt: timestamp("occurred_at"),
    completedAt: timestamp("completed_at"),
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
    index("crm_activities_orgId_idx").on(table.organizationId),
    index("crm_activities_entity_idx").on(table.organizationId, table.entityType, table.entityId),
  ],
);

