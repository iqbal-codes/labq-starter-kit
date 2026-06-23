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

export const customerAvatarKeys = {
  all: [...customerKeys.all, "avatar"] as const,
  detail: (customerId: string) => [...customerAvatarKeys.all, customerId] as const,
};

export function customerAvatarQueryOptions(customerId: string) {
  return orpc.operations.customers.avatar.get.queryOptions({ input: { customerId } });
}
