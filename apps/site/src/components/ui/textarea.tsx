import React from "react";
import { cn } from "@admin-template/ui/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-2xl border bg-input/50 p-4 text-sm placeholder:text-muted-foreground transition-all outline-none resize-y",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
            : "border-border",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
