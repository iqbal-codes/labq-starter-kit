import { orpc } from "../../../runtime";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (input: OrderListInput) => [...orderKeys.lists(), input] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

type OrderListInput = {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  status?: string;
};

export function orderListQueryOptions(input: OrderListInput) {
  return orpc.operations.orders.list.queryOptions({ input });
}
