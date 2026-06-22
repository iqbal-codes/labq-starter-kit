import { describe, expect, it } from "vite-plus/test";
import { buildBreadcrumbs, isBreadcrumbNavigable } from "./header-breadcrumbs";

describe("buildBreadcrumbs", () => {
  it("keeps module and list parents in the breadcrumb trail", () => {
    expect(buildBreadcrumbs("/crm/leads/lead_123", "Acme")).toEqual([
      { title: "Acme", href: "/" },
      { title: "CRM", href: "/crm" },
      { title: "Leads", href: "/crm/leads" },
      { title: "Lead_123", href: "/crm/leads/lead_123" },
    ]);
  });
});

describe("isBreadcrumbNavigable", () => {
  it("keeps list breadcrumbs clickable on detail pages", () => {
    const breadcrumbs = buildBreadcrumbs("/crm/leads/lead_123", "Acme");
    const leadsBreadcrumb = breadcrumbs[2]!;

    expect(isBreadcrumbNavigable(leadsBreadcrumb.href, false)).toBe(true);
  });

  it("keeps non-routable settings parent muted", () => {
    expect(isBreadcrumbNavigable("/settings", false)).toBe(false);
  });

  it("never makes the current page clickable", () => {
    expect(isBreadcrumbNavigable("/crm/leads/lead_123", true)).toBe(false);
  });
});
