"use client";

import { formatPrice } from "../../lib/format";
import { useCartStore } from "./cart-store";

export function CheckoutSummary() {
  const { items, totalItems, totalPriceCents } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8">
        <h2 className="text-xl font-semibold text-foreground">Your cart is empty</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Add a service from the catalog, then return here to review your request.
        </p>
        <a
          href="/services"
          className="mt-6 inline-flex h-11 items-center rounded-4xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Browse services
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Checkout summary</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review your selected services before reaching out to finalize scope.
          </p>
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
          {totalItems} item{totalItems === 1 ? "" : "s"}
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li
            key={item.slug}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">Quantity {item.quantity}</p>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatPrice(item.priceCents * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Estimated subtotal</span>
        <span className="text-lg font-semibold text-foreground">
          {formatPrice(totalPriceCents)}
        </span>
      </div>

      <div className="mt-6 rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
        Checkout is currently concierge-led while the public commerce API is being wired. Use the
        contact action below and we’ll turn this request into a scoped engagement.
      </div>

      <a
        href="/contact#contact-form"
        className="mt-6 inline-flex h-11 items-center rounded-4xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Continue to contact
      </a>
    </div>
  );
}
