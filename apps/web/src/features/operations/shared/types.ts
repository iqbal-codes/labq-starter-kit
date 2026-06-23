export interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
}

export interface ServiceRow {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  status: string;
  price: string | number | null;
}

export interface OrderRow {
  id: string;
  title: string;
  customerId: string | null;
  serviceId: string | null;
  status: string;
  totalAmount: string | number | null;
  dueDate: string | null;
  notes: string | null;
}

export interface SummaryResponse {
  customers: number;
  services: number;
  orders: number;
  openOrders: number;
  completedOrders: number;
}

export interface OptionItem {
  value: string;
  label: string;
}

export type CustomerFormValues = {
  name: string;
  avatar?: File[];
  email?: string;
  phone?: string;
  status: string;
  notes?: string;
};

export type ServiceFormValues = {
  name: string;
  category?: string;
  photos?: File[];
  description?: string;
  status: string;
  price?: string | number;
};

export type OrderFormValues = {
  title: string;
  customerId?: string;
  serviceId?: string;
  status: string;
  totalAmount?: string | number;
  dueDate?: string;
  notes?: string;
};
