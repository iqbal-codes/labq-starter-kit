import { useSyncExternalStore } from "react";

export interface CartItem {
  slug: string;
  title: string;
  priceCents: number;
  quantity: number;
  imageUrl?: string;
}

type Listener = () => void;

const STORAGE_KEY = "labq-storefront-cart";
const listeners = new Set<Listener>();

function loadItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let items: CartItem[] = loadItems();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function emit() {
  persist();
  for (const listener of listeners) listener();
}

export const cartStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): CartItem[] {
    return items;
  },

  addItem(incoming: Omit<CartItem, "quantity">) {
    const existing = items.find((item) => item.slug === incoming.slug);

    if (existing) {
      items = items.map((item) =>
        item.slug === incoming.slug ? { ...item, quantity: item.quantity + 1 } : item,
      );
    } else {
      items = [...items, { ...incoming, quantity: 1 }];
    }

    emit();
  },

  removeItem(slug: string) {
    items = items.filter((item) => item.slug !== slug);
    emit();
  },

  updateQuantity(slug: string, quantity: number) {
    if (quantity <= 0) {
      items = items.filter((item) => item.slug !== slug);
    } else {
      items = items.map((item) => (item.slug === slug ? { ...item, quantity } : item));
    }

    emit();
  },

  clear() {
    items = [];
    emit();
  },
};

export function useCartStore(): {
  items: CartItem[];
  totalItems: number;
  totalPriceCents: number;
} {
  const snapshot = useSyncExternalStore(
    cartStore.subscribe,
    () => cartStore.getSnapshot(),
    () => cartStore.getSnapshot(),
  );

  return {
    items: snapshot,
    totalItems: snapshot.reduce((sum, item) => sum + item.quantity, 0),
    totalPriceCents: snapshot.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
  };
}
