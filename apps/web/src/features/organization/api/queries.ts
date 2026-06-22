import { orpc } from "../../../runtime";

export const organizationKeys = {
  all: ["organization"] as const,
  context: () => [...organizationKeys.all, "context"] as const,
};

export function organizationContextQueryOptions() {
  return orpc.organization.getContext.queryOptions();
}
