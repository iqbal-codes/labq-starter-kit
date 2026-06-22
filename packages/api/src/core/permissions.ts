import type { PermissionKey } from "@admin-template/types";
import type { SessionContext } from "../index";
import { throwForbidden } from "./errors";

export function requirePermission(
  context: Pick<SessionContext, "permissions">,
  permission: PermissionKey,
): void {
  if (!context.permissions.includes(permission)) {
    throwForbidden(`Missing permission: ${permission}`);
  }
}
