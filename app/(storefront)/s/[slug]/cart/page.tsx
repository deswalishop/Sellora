"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { productImageUrl } from "@/lib/supabase/storage";
import { formatRs } from "@/lib/format";
import { useCart } from "@/features/storefront/cart-context";

/** Dawn-style cart page. */
export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const { items, setQty, remove, subtotal, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-normal tracking-tight text-neutral-900">Your cart</h1>
        <p className="mt-2 text-[15px] text-neutral-500">Your cart is currently empty.</p>
        <Link
          href={`/s/${slug}/products`}
          className="mt-6 inline-block rounded bg-neutral-900 px-10 py-3.5 text-[15px] font-medium text-white hover:bg-neutral-800"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-normal tracking-tight text-neutral-900 sm:text-4xl">
        Your cart {count > 0 && <span className="text-neutral-500">({count})</span>}
      </h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 py-5 sm:gap-6">
              <Link
                href={`/s/${slug}/products`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 sm:h-28 sm:w-28"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={productImageUrl(item.image, 300)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-300">
                    {item.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[15px] font-medium text-neutral-900">{item.title}</p>
                {item.variantName && <p className="mt-0.5 text-[13px] text-neutral-500">{item.variantName}</p>}
                <p className="mt-1 text-sm text-neutral-500">{formatRs(item.price)} each</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded border border-neutral-300">
                    <button
                      onClick={() => setQty(item.key, item.qty - 1)}
                      className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.key, item.qty + 1)}
                      className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(item.key)}
                    className="text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-[15px] font-medium text-neutral-900">{formatRs(item.price * item.qty)}</p>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-lg border border-neutral-200 bg-neutral-50 p-6">
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] text-neutral-700">Subtotal</p>
            <p className="text-xl font-medium text-neutral-900">{formatRs(subtotal)}</p>
          </div>
          <p className="mt-1 text-[13px] text-neutral-500">
            Taxes and shipping calculated at checkout.
          </p>
          <Link
            href={`/s/${slug}/checkout`}
            className="mt-5 block rounded bg-neutral-900 py-4 text-center text-[15px] font-medium text-white hover:bg-neutral-800"
          >
            Check out
          </Link>
          <Link
            href={`/s/${slug}/products`}
            className="mt-3 block text-center text-sm text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
