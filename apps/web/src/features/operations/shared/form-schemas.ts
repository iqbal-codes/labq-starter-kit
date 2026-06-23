import { optionalEmailSchema, optionalPhoneSchema } from "@admin-template/schemas";
import { z } from "zod";

const fileFieldSchema = z.array(z.custom<File>()).optional();

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatar: fileFieldSchema,
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

export const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  photos: fileFieldSchema,
  description: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  price: z.union([z.string(), z.number()]).optional(),
});

export const orderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customerId: z.string().optional(),
  serviceId: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  totalAmount: z.union([z.string(), z.number()]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});
