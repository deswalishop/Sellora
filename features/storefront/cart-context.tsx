"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  key: string; // productId:variantId
  productId: string;
  variantId: string | null;
  title: string;
  variantName: string | null;
  price: number;
  qty: number;
  image: string | null;
}

interface CartContextValue {
  items: CartItem[];
  add: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const Ctx = createContext<CartContextValue | null>(null);

/** Cart lives in localStorage, namespaced per store. */
export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const storageKey = `sellora-cart-${slug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* corrupted cart — start fresh */
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch {
        /* storage full — ignore */
      }
    }
  }, [items, loaded, storageKey]);

  const add: CartContextValue["add"] = (item, qty = 1) => {
    const key = `${item.productId}:${item.variantId ?? "-"}`;
    setItems((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, 100) } : i));
      return [...prev, { ...item, key, qty: Math.min(qty, 100) }];
    });
  };

  const remove = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const setQty = (key: string, qty: number) => {
    if (qty <= 0) return remove(key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.min(qty, 100) } : i)));
  };

  const clear = () => setItems([]);

  return (
    <Ctx.Provider
      value={{
        items,
        add,
        remove,
        setQty,
        clear,
        count: items.reduce((n, i) => n + i.qty, 0),
        subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
