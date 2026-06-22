// ── Module Keys ──────────────────────────────────────────────
export const MODULE_KEYS = ["crm"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

// ── Role Keys ────────────────────────────────────────────────
export const ROLE_KEYS = ["owner", "admin", "member", "viewer"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

// ── Permission Keys ──────────────────────────────────────────
export const PERMISSION_KEYS = [
  "crm.view",
  "crm.create",
  "crm.update",
  "crm.delete",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];


// ── Error Codes ──────────────────────────────────────────────
export const ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "MODULE_DISABLED",
  "ORGANIZATION_REQUIRED",
  "INTERNAL_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

// ── Role Permissions ─────────────────────────────────────────
export const ROLE_PERMISSION_MAP: Record<RoleKey, readonly PermissionKey[]> = {
  owner: [...PERMISSION_KEYS],
  admin: [...PERMISSION_KEYS],
  member: ["crm.view", "crm.create", "crm.update"],
  viewer: ["crm.view"],
};

export function getPermissionsForRole(role: string): readonly PermissionKey[] {
  return ROLE_PERMISSION_MAP[role as RoleKey] ?? [];
}
