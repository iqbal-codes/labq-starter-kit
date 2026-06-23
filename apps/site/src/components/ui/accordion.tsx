import React from "react";
import { cn } from "@admin-template/ui/lib/utils";

export interface AccordionItemProps extends React.DetailsHTMLAttributes<HTMLDetailsElement> {
  trigger: React.ReactNode;
}

export const AccordionItem = React.forwardRef<HTMLDetailsElement, AccordionItemProps>(
  ({ className, trigger, children, ...props }, ref) => {
    return (
      <details
        ref={ref}
        className={cn("group border-b border-border py-4 last:border-b-0", className)}
        {...props}
      >
        <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-foreground outline-none list-none [&::-webkit-details-marker]:hidden focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none focus-visible:rounded-lg px-2 -mx-2 py-1">
          <span>{trigger}</span>
          <svg
            className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-3 text-sm leading-relaxed text-muted-foreground transition-all duration-300">
          {children}
        </div>
      </details>
    );
  },
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("divide-y divide-border border-y border-border", className)}
        {...props}
      />
    );
  },
);
Accordion.displayName = "Accordion";
