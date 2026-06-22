import { describe, expect, it } from "vite-plus/test";
import { buildBreadcrumbs, isBreadcrumbNavigable } from "./header-breadcrumbs";

describe("buildBreadcrumbs", () => {
  it("keeps module and list parents in the breadcrumb trail", () => {
    expect(buildBreadcrumbs("/orders/order_123", "Acme")).toEqual([
      { title: "Acme", href: "/" },
      { title: "Orders", href: "/orders" },
      { title: "Order_123", href: "/orders/order_123" },
    ]);
  });

  it("falls back to Admin when organization is missing", () => {
    expect(buildBreadcrumbs("/overview")[0]).toEqual({ title: "Admin", href: "/" });
  });
});

describe("isBreadcrumbNavigable", () => {
  it("keeps list breadcrumbs clickable on detail-like paths", () => {
    const breadcrumbs = buildBreadcrumbs("/orders/order_123", "Acme");
    const ordersBreadcrumb = breadcrumbs[1]!;

    expect(isBreadcrumbNavigable(ordersBreadcrumb.href, false)).toBe(true);
  });

  it("keeps non-routable settings parent muted", () => {
    expect(isBreadcrumbNavigable("/settings", false)).toBe(false);
  });

  it("never makes the current page clickable", () => {
    expect(isBreadcrumbNavigable("/orders/order_123", true)).toBe(false);
  });
});
