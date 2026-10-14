"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { formatRs } from "@/lib/format";
import { useCart } from "@/features/storefront/cart-context";
import { placeOrder } from "@/features/storefront/actions";

export interface PaymentOption {
  method: "cod" | "bank_transfer" | "raast" | "easypaisa" | "jazzcash";
  label: string;
  instructions: string | null;
}

const METHOD_LABELS: Record<PaymentOption["method"], string> = {
  cod: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
  raast: "Raast",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
};

/** Checkout form (PRD section 28): simple address + payment method. */
export function CheckoutForm({
  options,
  shippingFee,
  freeThreshold,
  brandColor,
}: {
  options: PaymentOption[];
  shippingFee: number;
  freeThreshold: number | null;
  brandColor: string;
}) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [method, setMethod] = useState<PaymentOption["method"]>(options[0]?.method ?? "cod");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <p className="font-semibold text-ink">Your cart is empty</p>
        <p className="mt-1 text-sm text-muted">Add products before checking out.</p>
      </div>
    );
  }

  const deliveryFee = freeThreshold != null && subtotal >= freeThreshold ? 0 : shippingFee;
  const total = subtotal + deliveryFee;
  const selected = options.find((o) => o.method === method);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await placeOrder({
      slug,
      fullName: fd.get("fullName"),
      phone: fd.get("phone"),
      email: fd.get("email") || "",
      city: fd.get("city"),
      area: fd.get("area"),
      address: fd.get("address"),
      paymentMethod: method,
      notes: fd.get("notes") || "",
      items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
    });
    if (!res.ok) {
      setPending(false);
      setError(res.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    try {
      sessionStorage.setItem(
        `sellora-last-order-${slug}`,
        JSON.stringify({ orderNumber: res.orderNumber, phone: String(fd.get("phone")) })
      );
    } catch {
      /* ignore */
    }
    clear();
    router.push(`/s/${slug}/order/${res.orderNumber}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-bold text-ink">Delivery details</h2>
          <div className="space-y-4">
            <Input label="Full name" name="fullName" autoComplete="name" placeholder="e.g. Ahmed Raza" required />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Mobile number" name="phone" type="tel" autoComplete="tel" placeholder="03XX-XXXXXXX" required />
              <Input label="Email (optional)" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="City" name="city" autoComplete="address-level2" placeholder="e.g. Karachi" required />
              <Input label="Area" name="area" placeholder="e.g. Gulshan-e-Iqbal" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="address">
                Complete address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                required
                placeholder="House, street, landmark…"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="notes">
                Order notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Anything the seller should know…"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/30"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-bold text-ink">Payment method</h2>
          <div className="space-y-2">
            {options.map((o) => (
              <label
                key={o.method}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  method === o.method ? "border-transparent bg-canvas" : "border-slate-200"
                }`}
                style={method === o.method ? { boxShadow: `inset 0 0 0 2px ${brandColor}` } : undefined}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={method === o.method}
                  onChange={() => setMethod(o.method)}
                  className="h-4 w-4 accent-emerald-800"
                />
                <span className="text-sm font-medium text-ink">{METHOD_LABELS[o.method]}</span>
              </label>
            ))}
          </div>
          {selected?.instructions && (
            <div className="mt-3 rounded-xl bg-canvas p-4 text-sm text-muted">
              <p className="font-semibold text-ink">Payment instructions</p>
              <p className="mt-1 whitespace-pre-line">{selected.instructions}</p>
              <p className="mt-2 text-xs">
                The seller will confirm your payment on WhatsApp before dispatch.
              </p>
            </div>
          )}
          {method !== "cod" && !selected?.instructions && (
            <p className="mt-3 text-xs text-muted">The seller will share payment details on WhatsApp.</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 font-bold text-ink">Order summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((i) => (
              <div key={i.key} className="flex justify-between gap-2">
                <span className="text-muted">
                  {i.title} {i.variantName && <span className="text-xs">({i.variantName})</span>} × {i.qty}
                </span>
                <span className="font-medium text-ink">{formatRs(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-2">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-ink">{formatRs(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span className="font-medium text-ink">
                  {deliveryFee === 0 ? "FREE" : formatRs(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold">
                <span className="text-ink">Total</span>
                <span style={{ color: brandColor }}>{formatRs(total)}</span>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-5 h-12 w-full rounded-xl font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            style={{ backgroundColor: brandColor }}
          >
            {pending ? "Placing your order…" : `Place order — ${formatRs(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            {method === "cod"
              ? "Pay in cash when your order arrives."
              : "Follow the payment instructions above."}
          </p>
        </div>
      </div>
    </form>
  );
}
