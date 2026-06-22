import type { CustomerFormValues, OptionItem, OrderFormValues, ServiceFormValues } from "./types";

export const CUSTOMER_STATUS_OPTIONS: OptionItem[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const SERVICE_STATUS_OPTIONS: OptionItem[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const ORDER_STATUS_OPTIONS: OptionItem[] = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  status: "active",
  notes: "",
};

export const EMPTY_SERVICE_FORM: ServiceFormValues = {
  name: "",
  description: "",
  status: "active",
  price: "",
};

export const EMPTY_ORDER_FORM: OrderFormValues = {
  title: "",
  customerId: "",
  serviceId: "",
  status: "draft",
  totalAmount: "",
  dueDate: "",
  notes: "",
};
