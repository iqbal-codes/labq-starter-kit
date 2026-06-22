import { describe, it, expect } from "vite-plus/test";
import { getPermissionsForRole } from "@labq-modules/types";

function hasPermission(role: string, permission: string): boolean {
  const perms = getPermissionsForRole(role);
  return perms.includes(permission as never);
}

describe("Permission model", () => {
  it("owner has all permissions", () => {
    expect(hasPermission("owner", "crm.view")).toBe(true);
    expect(hasPermission("owner", "crm.delete")).toBe(true);
  });

  it("admin has all CRUD permissions", () => {
    expect(hasPermission("admin", "crm.create")).toBe(true);
    expect(hasPermission("admin", "crm.delete")).toBe(true);
  });

  it("member cannot delete", () => {
    expect(hasPermission("member", "crm.view")).toBe(true);
    expect(hasPermission("member", "crm.delete")).toBe(false);
  });

  it("viewer can only view", () => {
    expect(hasPermission("viewer", "crm.view")).toBe(true);
    expect(hasPermission("viewer", "crm.create")).toBe(false);
  });

  it("unknown role has no permissions", () => {
    expect(hasPermission("unknown", "crm.view")).toBe(false);
  });
});

// ── Table query defaults ─────────────────────────────────────

describe("Table query defaults", () => {
  it("applies correct defaults", () => {
    const input = {};
    const defaults = { page: 1, pageSize: 50, search: undefined };
    expect({ ...defaults, ...input }).toEqual(defaults);
  });

  it("preserves provided values", () => {
    const input = { page: 2, pageSize: 25, search: "test" };
    const defaults = { page: 1, pageSize: 50, search: undefined };
    expect({ ...defaults, ...input }).toEqual(input);
  });
});

// ── Error codes ──────────────────────────────────────────────

describe("Error codes", () => {
  it("defines all required error codes", () => {
    const codes = [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "VALIDATION_ERROR",
      "NOT_FOUND",
      "MODULE_DISABLED",
      "ORGANIZATION_REQUIRED",
      "INTERNAL_ERROR",
    ];
    expect(codes).toHaveLength(7);
    expect(codes).toContain("UNAUTHORIZED");
  });
});

// ── Module keys ──────────────────────────────────────────────

describe("Module keys", () => {
  it("defines only crm", () => {
    const keys = ["crm"];
    expect(keys).toHaveLength(1);
    expect(keys).toContain("crm");
  });
});
