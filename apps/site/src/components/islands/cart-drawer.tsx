"use client";

import { Minus, Plus, Trash2, X } from "lucide-react";
import { formatPrice } from "../../lib/format";
import { cartStore, useCartStore } from "./cart-store";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, totalItems, totalPriceCents } = useCartStore();

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-xl transition-transform duration-300"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-medium text-foreground">Your Cart ({totalItems})</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-4xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close cart"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <EmptyCartIcon className="mb-4 size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.slug} className="flex gap-4 rounded-2xl border border-border p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatPrice(item.priceCents)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => cartStore.updateQuantity(item.slug, item.quantity - 1)}
                      className="inline-flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => cartStore.updateQuantity(item.slug, item.quantity + 1)}
                      className="inline-flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => cartStore.removeItem(item.slug)}
                    className="self-start p-1 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-3 border-t border-border px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatPrice(totalPriceCents)}</span>
            </div>
            <a
              href="/checkout"
              className="inline-flex w-full items-center justify-center rounded-4xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Checkout
            </a>
          </div>
        )}
      </aside>
    </>
  );
}

function EmptyCartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
