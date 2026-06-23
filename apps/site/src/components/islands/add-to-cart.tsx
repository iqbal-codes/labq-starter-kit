"use client";

import { formatPrice } from "../../lib/format";
import { cartStore } from "./cart-store";

interface AddToCartButtonProps {
  slug: string;
  title: string;
  priceCents: number;
  imageUrl?: string;
}

export function AddToCartButton({ slug, title, priceCents, imageUrl }: AddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={() => cartStore.addItem({ slug, title, priceCents, imageUrl })}
      className="inline-flex items-center justify-center gap-2 rounded-4xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
    >
      Add to Cart · {formatPrice(priceCents)}
    </button>
  );
}
