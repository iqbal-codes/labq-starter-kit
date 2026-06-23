"use client";

import { useState } from "react";
import { CartStatus } from "./cart-status";
import { CartDrawer } from "./cart-drawer";

/**
 * Combined cart island: status badge + slide-out drawer.
 * Sits in the Header as a single `client:load` boundary.
 */
export function CartShell() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CartStatus onOpenDrawer={() => setOpen(true)} />
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
