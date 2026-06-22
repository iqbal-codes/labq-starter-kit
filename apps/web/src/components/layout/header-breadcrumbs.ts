export interface BreadcrumbItemDescriptor {
  title: string;
  href: string;
}

const NON_ROUTABLE_BREADCRUMB_PATHS: Record<string, true> = {
  "/settings": true,
};

export function buildBreadcrumbs(
  pathname: string,
  organizationName?: string | null,
): BreadcrumbItemDescriptor[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItemDescriptor[] = [
    {
      title: organizationName ?? "Admin",
      href: "/",
    },
  ];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;

    const title =
      segment === "settings" ? "Settings" : segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbs.push({
      title,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

export function isBreadcrumbNavigable(href: string, isLast: boolean): boolean {
  return !isLast && !NON_ROUTABLE_BREADCRUMB_PATHS[href];
}
