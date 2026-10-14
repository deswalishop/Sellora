"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { productImageUrl } from "@/lib/supabase/storage";
import { formatRs } from "@/lib/format";
import { useCart } from "@/features/storefront/cart-context";

/** Cart page (PRD section 27). */
export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const { items, setQty, remove, subtotal, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-xl font-bold text-ink">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted">Add some products to get started.</p>
        <Link
          href={`/s/${slug}/products`}
          className="mt-6 inline-block rounded-full bg-emerald-950 px-8 py-3 text-sm font-bold text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Your cart ({count})</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImageUrl(item.image, 200)}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-canvas text-xl font-bold text-muted">
                {item.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
              {item.variantName && <p className="text-xs text-muted">{item.variantName}</p>}
              <p className="mt-1 text-sm font-bold text-emerald-950">{formatRs(item.price)}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center rounded-full border border-slate-300">
                  <button
                    onClick={() => setQty(item.key, item.qty - 1)}
                    className="flex h-8 w-8 items-center justify-center font-bold text-muted hover:text-ink"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                  <button
                    onClick={() => setQty(item.key, item.qty + 1)}
                    className="flex h-8 w-8 items-center justify-center font-bold text-muted hover:text-ink"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(item.key)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-sm font-bold text-ink">{formatRs(item.price * item.qty)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-semibold text-ink">{formatRs(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">Delivery fee calculated at checkout.</p>
        <Link
          href={`/s/${slug}/checkout`}
          className="mt-4 block h-12 rounded-xl bg-emerald-950 text-center text-[15px] font-semibold leading-[3rem] text-white transition hover:bg-emerald-950/90"
        >
          Proceed to checkout
        </Link>
        <Link
          href={`/s/${slug}/products`}
          className="mt-2 block text-center text-sm font-medium text-muted hover:text-ink"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
