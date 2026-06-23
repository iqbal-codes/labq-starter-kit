import React from "react";
import { cn } from "@admin-template/ui/lib/utils";

export interface StarRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  max?: number;
  size?: number;
}

export const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  ({ className, rating, max = 5, size = 16, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-1", className)} {...props}>
        {Array.from({ length: max }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          const isHalf = !isFilled && starValue - 0.5 <= rating;

          return (
            <svg
              key={index}
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={isFilled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              className={cn(
                "shrink-0",
                isFilled || isHalf ? "text-yellow-500" : "text-muted-foreground/30",
              )}
            >
              {isHalf ? (
                <defs>
                  <linearGradient id={`half-${index}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                  </linearGradient>
                </defs>
              ) : null}
              <path
                fill={isHalf ? `url(#half-${index})` : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499c.196-.612 1.063-.612 1.259 0l1.83 5.71a1 1 0 00.95.69h5.952c.64 0 .907.82.389 1.206l-4.815 3.54a1 1 0 00-.363 1.118l1.83 5.71c.196.612-.51 1.127-1.035.748l-4.815-3.54a1 1 0 00-1.178 0l-4.815 3.54c-.525.38-1.23-.136-1.035-.748l1.83-5.71a1 1 0 00-.363-1.118L2.25 11.105c-.518-.387-.25-1.207.39-1.207h5.952a1 1 0 00.95-.69l1.83-5.71z"
              />
            </svg>
          );
        })}
      </div>
    );
  },
);

StarRating.displayName = "StarRating";
