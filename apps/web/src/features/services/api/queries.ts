import { orpc } from "../../../runtime";

export const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: (input: ServiceListInput) => [...serviceKeys.lists(), input] as const,
  details: () => [...serviceKeys.all, "detail"] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

type ServiceListInput = {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  status?: string;
};

export function serviceListQueryOptions(input: ServiceListInput) {
  return orpc.operations.services.list.queryOptions({ input });
}

export const servicePhotosKeys = {
  all: [...serviceKeys.all, "photos"] as const,
  detail: (serviceId: string) => [...servicePhotosKeys.all, serviceId] as const,
};

export function servicePhotosQueryOptions(serviceId: string) {
  return orpc.operations.services.photos.list.queryOptions({ input: { serviceId } });
}
