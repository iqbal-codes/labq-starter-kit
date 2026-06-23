import React from "react";
import { cn } from "@admin-template/ui/lib/utils";

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} role="radiogroup" className={cn("grid gap-3", className)} {...props} />;
  },
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  error?: boolean;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, error, children, name, ...props }, ref) => {
    return (
      <label className="group flex items-start gap-2.5 cursor-pointer select-none">
        <div className="relative flex items-center pt-0.5">
          <input type="radio" ref={ref} name={name} className="peer sr-only" {...props} />
          <div
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-full border border-transparent bg-input/90 transition-shadow outline-none",
              "peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/30",
              "peer-checked:border-primary peer-checked:bg-primary",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "border-destructive peer-focus-visible:ring-destructive/20",
              className,
            )}
          >
            <span className="size-2 rounded-full bg-primary-foreground hidden peer-checked:block" />
          </div>
        </div>
        {children && (
          <span className="text-sm font-medium text-foreground leading-tight group-has-disabled/field:opacity-50">
            {children}
          </span>
        )}
      </label>
    );
  },
);
RadioGroupItem.displayName = "RadioGroupItem";
