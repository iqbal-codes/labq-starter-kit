import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarTrigger } from "@labq-modules/ui/components/sidebar";
import { Separator } from "@labq-modules/ui/components/separator";
import { AnimatedThemeToggler } from "@labq-modules/ui/components/animated-theme-toggler";
import { useOrganization } from "../../hooks/use-organization";
import { buildBreadcrumbs, isBreadcrumbNavigable } from "./header-breadcrumbs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@labq-modules/ui/components/breadcrumb";

export function Header() {
  const location = useLocation();
  const { organization } = useOrganization();

  const breadcrumbs = React.useMemo(
    () => buildBreadcrumbs(location.pathname, organization?.name),
    // eslint-disable-next-line react-doctor/no-mutable-in-deps -- useLocation re-renders on pathname change
    [location.pathname, organization?.name],
  );

  return (
    <header className="bg-background/60 border-b sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const isClickable = isBreadcrumbNavigable(item.href, isLast);

              return (
                <React.Fragment key={item.href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    ) : isClickable ? (
                      <BreadcrumbLink render={<Link to={item.href} />}>{item.title}</BreadcrumbLink>
                    ) : (
                      <span className="text-muted-foreground text-sm">{item.title}</span>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 px-4">
        <AnimatedThemeToggler
          variant="circle"
          className="h-9 w-9 border border-border bg-background text-foreground hover:bg-muted hover:text-foreground transition-colors"
        />
      </div>
    </header>
  );
}
