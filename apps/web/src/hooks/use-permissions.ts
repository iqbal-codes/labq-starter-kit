import { useOrganization } from "./use-organization";
import type { PermissionKey } from "@labq-modules/types";

export function usePermissions() {
  const { organization, isLoading } = useOrganization();

  const permissions = (organization as { permissions?: PermissionKey[] } | null)?.permissions ?? [];

  const hasPermission = (key: PermissionKey) => permissions.includes(key);

  return { permissions, hasPermission, isLoading };
}
