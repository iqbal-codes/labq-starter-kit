import React from "react";
import { cn } from "@admin-template/ui/lib/utils";
import { CheckIcon } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <label className="group flex items-start gap-2.5 cursor-pointer select-none">
        <div className="relative flex items-center pt-0.5">
          <input type="checkbox" ref={ref} className="peer sr-only" {...props} />
          <div
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-transparent bg-input/90 transition-shadow outline-none",
              "peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/30",
              "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "border-destructive peer-focus-visible:ring-destructive/20",
              className,
            )}
          >
            <CheckIcon className="size-3 hidden peer-checked:block stroke-[3]" />
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

Checkbox.displayName = "Checkbox";

export interface CheckboxGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} role="group" className={cn("grid gap-3", className)} {...props} />;
  },
);
CheckboxGroup.displayName = "CheckboxGroup";
