import { orpc } from "../../../runtime";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (input: CustomerListInput) => [...customerKeys.lists(), input] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

type CustomerListInput = {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  status?: string;
};

export function customerListQueryOptions(input: CustomerListInput) {
  return orpc.operations.customers.list.queryOptions({ input });
}
