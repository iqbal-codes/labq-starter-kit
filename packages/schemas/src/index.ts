import { z } from "zod";

// ── Common Table Query ───────────────────────────────────────
export const tableQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

export type TableQueryInput = z.infer<typeof tableQuerySchema>;

export const CRM_ENTITY_TYPES = ["lead", "contact", "company", "deal"] as const;
export const CRM_ACTIVITY_TYPES = ["note", "task", "call", "meeting"] as const;
export const DEAL_STAGE_KINDS = ["open", "won", "lost"] as const;

const optionalString = z.string().optional();

// ── Lead ─────────────────────────────────────────────────────
export const createLeadSchema = z.object({
  name: z.string().min(1),
  email: optionalString,
  phone: optionalString,
  companyName: optionalString,
  status: z.string().default("new"),
  source: optionalString,
  notes: optionalString,
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().min(1),
});

export const convertLeadSchema = z.object({
  id: z.string().min(1),
  contactName: optionalString,
  companyName: optionalString,
  createCompany: z.boolean().default(true),
  createDeal: z.boolean().default(false),
  dealTitle: optionalString,
  dealValue: z.number().nonnegative().optional(),
  stageId: optionalString,
});

// ── Contact ──────────────────────────────────────────────────
export const createContactSchema = z.object({
  name: z.string().min(1),
  email: optionalString,
  phone: optionalString,
  companyId: optionalString,
  status: z.string().default("active"),
  source: optionalString,
  notes: optionalString,
});

export const CONTACT_IMPORT_EXPORT_FIELDS = [
  "name",
  "email",
  "phone",
  "status",
  "source",
  "notes",
] as const;

export const contactImportRowSchema = createContactSchema.omit({ companyId: true });
export type ContactImportRow = z.infer<typeof contactImportRowSchema>;

export const bulkCreateContactsSchema = z.object({
  records: z.array(contactImportRowSchema).min(1),
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().min(1),
});

// ── Company ──────────────────────────────────────────────────
export const createCompanySchema = z.object({
  name: z.string().min(1),
  status: z.string().default("prospect"),
  industry: optionalString,
  website: optionalString,
  email: optionalString,
  phone: optionalString,
  address: optionalString,
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().min(1),
});

// ── Deal Stages ──────────────────────────────────────────────
export const createDealStageSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(DEAL_STAGE_KINDS).default("open"),
});

export const updateDealStageSchema = createDealStageSchema.partial().extend({
  id: z.string().min(1),
});

export const reorderDealStagesSchema = z.object({
  stageIds: z.array(z.string().min(1)).min(1),
});

// ── Deal ─────────────────────────────────────────────────────
export const createDealSchema = z.object({
  title: z.string().min(1),
  companyId: optionalString,
  contactId: optionalString,
  value: z.number().nonnegative().optional(),
  stageId: optionalString,
  expectedCloseDate: optionalString,
  notes: optionalString,
});

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().min(1),
});

// ── CRM Activity ─────────────────────────────────────────────
export const createCrmActivitySchema = z.object({
  entityType: z.enum(CRM_ENTITY_TYPES),
  entityId: z.string().min(1),
  type: z.enum(CRM_ACTIVITY_TYPES).default("note"),
  title: z.string().min(1),
  details: optionalString,
  dueAt: optionalString,
  occurredAt: optionalString,
  completed: z.boolean().default(false),
});

export const updateCrmActivitySchema = createCrmActivitySchema
  .omit({ entityType: true, entityId: true })
  .partial()
  .extend({
    id: z.string().min(1),
    completed: z.boolean().optional(),
  });


// ── Contact Attachments ────────────────────────────────────────
export const CONTACT_ATTACHMENT_ENTITY_TYPE = "crm_contact" as const;

export const contactAttachmentListInputSchema = z.object({
  contactId: z.string().min(1),
});

export const deleteAttachmentSchema = z.object({
  id: z.string().min(1),
});

export const contactAttachmentItemSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  entityType: z.literal(CONTACT_ATTACHMENT_ENTITY_TYPE),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  uploadedByName: z.string().nullable(),
  createdAt: z.string(),
});

export const contactAttachmentItemsSchema = z.array(contactAttachmentItemSchema);

export type ContactAttachmentItem = z.infer<typeof contactAttachmentItemSchema>;

// ── Organization ──────────────────────────────────────────────
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
