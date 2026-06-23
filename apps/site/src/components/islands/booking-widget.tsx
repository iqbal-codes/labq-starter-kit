"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { formatPrice } from "../../lib/format";
import { cartStore } from "./cart-store";
import type { Service } from "../../data/services";

interface BookingWidgetProps {
  service: Service;
}

export function BookingWidget({ service }: BookingWidgetProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (service.priceCents === null) return;

    cartStore.addItem({
      slug: service.slug,
      title: service.title,
      priceCents: service.priceCents,
      imageUrl: service.imageUrl,
    });
    setAdded(true);
  };

  return (
    <div className="sticky top-24 rounded-3xl border bg-card p-6 shadow-md ring-1 ring-foreground/5">
      <div className="mb-4">
        <p className="text-2xl font-semibold text-foreground">
          {service.priceCents === null ? "Contact us for pricing" : formatPrice(service.priceCents)}
        </p>
      </div>

      <div className="mb-6 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>{service.durationLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0" />
          <span>Available this week</span>
        </div>
      </div>

      {service.priceCents === null ? (
        <a
          href="/contact#contact-form"
          className="inline-flex w-full items-center justify-center rounded-4xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Book Now
        </a>
      ) : added ? (
        <div className="rounded-2xl bg-muted/50 px-4 py-3 text-center text-sm font-medium text-foreground">
          Added to cart!
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-4xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Book Now
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-4xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}
