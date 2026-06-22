"use client";

import * as React from "react";

import { cn } from "@labq-modules/ui/lib/utils";

// eslint-disable-next-line react-doctor/label-has-associated-control -- base label component, consumers associate with control via htmlFor or wrapper pattern
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
