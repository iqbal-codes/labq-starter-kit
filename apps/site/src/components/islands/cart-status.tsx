"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "./cart-store";

interface CartStatusProps {
  onOpenDrawer: () => void;
}

export function CartStatus({ onOpenDrawer }: CartStatusProps) {
  const { totalItems } = useCartStore();

  return (
    <button
      type="button"
      onClick={onOpenDrawer}
      className="relative inline-flex items-center justify-center rounded-4xl p-2 text-foreground transition-colors hover:bg-muted"
      aria-label={`Shopping cart, ${totalItems} items`}
    >
      <ShoppingBag className="size-5" strokeWidth={1.5} />
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
