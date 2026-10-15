"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./cart-context";
import { productImageUrl } from "@/lib/supabase/storage";
import { formatRs } from "@/lib/format";

/** Dawn-style slide-in cart drawer. Opens automatically when items are added. */
export function CartDrawer({ slug, brandColor }: { slug: string; brandColor: string }) {
  const { items, setQty, remove, subtotal, count, drawerOpen, setDrawerOpen } = useCart();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Your cart {count > 0 && <span className="text-neutral-500">({count})</span>}
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close cart"
            className="rounded-full p-2 hover:bg-neutral-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-lg font-medium text-neutral-900">Your cart is empty</p>
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded px-8 py-3 text-[15px] font-medium text-white"
              style={{ backgroundColor: brandColor }}
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-5">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-50">
                    {i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={productImageUrl(i.image, 200)} alt={i.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-neutral-300">
                        {i.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-[15px] font-medium text-neutral-900">{i.title}</p>
                    {i.variantName && <p className="text-[13px] text-neutral-500">{i.variantName}</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded border border-neutral-300">
                        <button
                          aria-label="Decrease quantity"
                          className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100"
                          onClick={() => setQty(i.key, i.qty - 1)}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm">{i.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100"
                          onClick={() => setQty(i.key, i.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-[15px] font-medium text-neutral-900">{formatRs(i.price * i.qty)}</p>
                    </div>
                  </div>
                  <button
                    aria-label={`Remove ${i.title}`}
                    className="self-start rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                    onClick={() => remove(i.key)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-neutral-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[15px] text-neutral-700">Subtotal</p>
                <p className="text-lg font-semibold text-neutral-900">{formatRs(subtotal)}</p>
              </div>
              <p className="mt-1 text-[13px] text-neutral-500">Shipping calculated at checkout. Cash on delivery available.</p>
              <Link
                href={`/s/${slug}/checkout`}
                onClick={() => setDrawerOpen(false)}
                className="mt-3 block rounded py-3.5 text-center text-[15px] font-medium text-white"
                style={{ backgroundColor: brandColor }}
              >
                Check out
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="mt-2 w-full py-2 text-center text-sm text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
