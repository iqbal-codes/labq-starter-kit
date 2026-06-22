import type { ReactNode } from "react";

import { cn } from "@labq-modules/ui/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  backButton?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

function PageHeader({ title, subtitle, backButton, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backButton ? <div className="flex shrink-0 items-center">{backButton}</div> : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export { PageHeader };
