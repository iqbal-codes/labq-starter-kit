import { orpc } from "../../../runtime";

export const operationsKeys = {
  all: ["operations"] as const,
  summary: () => [...operationsKeys.all, "summary"] as const,
  customerList: (input: CustomerListInput) =>
    [...operationsKeys.all, "customers", "list", input] as const,
  serviceList: (input: ServiceListInput) =>
    [...operationsKeys.all, "services", "list", input] as const,
  orderList: (input: OrderListInput) => [...operationsKeys.all, "orders", "list", input] as const,
};

type CustomerListInput = {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  status?: string;
};
type ServiceListInput = {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  status?: string;
};
type OrderListInput = {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  status?: string;
};

export function operationsSummaryQueryOptions() {
  return orpc.operations.summary.queryOptions();
}

export function operationsCustomerListQueryOptions(input: CustomerListInput) {
  return orpc.operations.customers.list.queryOptions({ input });
}

export function operationsServiceListQueryOptions(input: ServiceListInput) {
  return orpc.operations.services.list.queryOptions({ input });
}

export function operationsOrderListQueryOptions(input: OrderListInput) {
  return orpc.operations.orders.list.queryOptions({ input });
}
