"use client";

import { useState } from "react";
import { Calendar, Clock, Check } from "lucide-react";
import { cartStore } from "./cart-store";

/**
 * Lightweight booking widget for the service detail page.
 * Accepts the same string-based props the Astro page already has.
 */
interface BookingWidgetInlineProps {
  slug: string;
  title: string;
  price: string;
  duration: string;
  /** Numeric price for the cart; omit when this service needs custom pricing. */
  priceCents?: number | null;
}

export function BookingWidgetInline({
  slug,
  title,
  price,
  duration,
  priceCents,
}: BookingWidgetInlineProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (priceCents === null || priceCents === undefined) return;
    cartStore.addItem({ slug, title, priceCents });
    setAdded(true);
  };

  const bookingHref = "/contact#contact-form";
  const canAddToCart = priceCents !== null && priceCents !== undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-2xl font-bold text-foreground">{price}</p>
      <p className="mt-1 text-sm text-muted-foreground">Estimated duration: {duration}</p>

      <div className="mt-6 space-y-3">
        <a
          href={bookingHref}
          className="inline-flex w-full items-center justify-center rounded-4xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Book Now
        </a>

        {canAddToCart ? (
          added ? (
            <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">
              <Check className="size-4 shrink-0" />
              Added to cart
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="w-full rounded-4xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Add to Cart
            </button>
          )
        ) : (
          <p className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Contact us to receive a tailored quote for this engagement.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>{duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0" />
          <span>Available this week</span>
        </div>
      </div>
    </div>
  );
}
