import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const leadConvertSchema = z
  .object({
    contactName: z.string().min(1, "Contact name is required"),
    companyName: z.string().optional(),
    createCompany: z.boolean(),
    createDeal: z.boolean(),
    dealTitle: z.string().optional(),
    dealValue: z.union([z.string(), z.number()]).optional(),
    stageId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.createCompany && !(value.companyName ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Company name is required when creating a company",
      });
    }
    if (value.createDeal && !(value.dealTitle ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dealTitle"],
        message: "Deal title is required when creating a deal",
      });
    }
  });

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyId: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const companyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.string().min(1, "Status is required"),
  industry: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const dealFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  stageId: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

export const stageFormSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  kind: z.enum(["open", "won", "lost"]),
});

export const activityFormSchema = z.object({
  type: z.enum(["note", "task", "call", "meeting"]),
  title: z.string().min(1, "Title is required"),
  details: z.string().optional(),
  dueAt: z.string().optional(),
  occurredAt: z.string().optional(),
  completed: z.boolean(),
});
