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

const optionalString = z.string().optional();

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function hasValidPhoneNumber(value: string) {
  if (!/^\+?[0-9\s().-]+(?:\s?(?:ext\.?|x)\s?\d+)?$/i.test(value)) {
    return false;
  }

  const mainNumber = value.replace(/\s?(?:ext\.?|x)\s?\d+$/i, "").trim();
  const digits = mainNumber.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export const optionalEmailSchema = z.preprocess(
  normalizeOptionalString,
  z.email("Invalid email address").optional(),
);

export const optionalPhoneSchema = z.preprocess(
  normalizeOptionalString,
  z.string().refine(hasValidPhoneNumber, "Invalid phone number").optional(),
);

export const CUSTOMER_STATUSES = ["active", "inactive"] as const;
export const SERVICE_STATUSES = ["active", "inactive"] as const;
export const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

// ── Customers ────────────────────────────────────────────────
export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  status: z.enum(CUSTOMER_STATUSES).default("active"),
  notes: optionalString,
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().min(1),
});

// ── Services ─────────────────────────────────────────────────
export const createServiceSchema = z.object({
  name: z.string().min(1),
  category: optionalString,
  description: optionalString,
  status: z.enum(SERVICE_STATUSES).default("active"),
  price: z.number().nonnegative().nullable().optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().min(1),
});

// ── Orders ───────────────────────────────────────────────────
export const createOrderSchema = z.object({
  title: z.string().min(1),
  customerId: optionalString,
  serviceId: optionalString,
  status: z.enum(ORDER_STATUSES).default("draft"),
  totalAmount: z.number().nonnegative().optional(),
  dueDate: optionalString,
  notes: optionalString,
});

export const updateOrderSchema = createOrderSchema.partial().extend({
  id: z.string().min(1),
});

// ── Organization ──────────────────────────────────────────────
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
