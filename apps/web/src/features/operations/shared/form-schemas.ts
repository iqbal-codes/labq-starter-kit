import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

export const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
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
