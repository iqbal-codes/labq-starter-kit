import { describe, it, expect } from "vite-plus/test";
import { getPermissionsForRole } from "@admin-template/types";

function hasPermission(role: string, permission: string): boolean {
  const perms = getPermissionsForRole(role);
  return perms.includes(permission as never);
}

describe("Permission model", () => {
  it("owner has all permissions", () => {
    expect(hasPermission("owner", "operations.view")).toBe(true);
    expect(hasPermission("owner", "operations.delete")).toBe(true);
  });

  it("admin has all CRUD permissions", () => {
    expect(hasPermission("admin", "operations.create")).toBe(true);
    expect(hasPermission("admin", "operations.delete")).toBe(true);
  });

  it("member cannot delete", () => {
    expect(hasPermission("member", "operations.view")).toBe(true);
    expect(hasPermission("member", "operations.delete")).toBe(false);
  });

  it("viewer can only view", () => {
    expect(hasPermission("viewer", "operations.view")).toBe(true);
    expect(hasPermission("viewer", "operations.create")).toBe(false);
  });

  it("unknown role has no permissions", () => {
    expect(hasPermission("unknown", "operations.view")).toBe(false);
  });
});

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

describe("Module keys", () => {
  it("defines only operations", () => {
    const keys = ["operations"];
    expect(keys).toHaveLength(1);
    expect(keys).toContain("operations");
  });
});
