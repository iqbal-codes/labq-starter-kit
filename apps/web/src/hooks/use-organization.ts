import { useQuery } from "@tanstack/react-query";
import { orpc } from "../runtime";

export function useOrganization() {
  const { data: context, isLoading } = useQuery(
    orpc.organization.getContext.queryOptions(),
  );

  return {
    organization: context?.organization ?? null,
    isLoading,
  };
}
