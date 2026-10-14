"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatRs } from "@/lib/format";
import { trackOrder } from "@/features/storefront/actions";

interface OrderItem {
  title: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
}

interface OrderData {
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  payment_method: string;
  customer_name: string;
  items: OrderItem[];
}

const METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
  raast: "Raast",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
};

/** Order confirmation (PRD section 29). Loads via the saved phone number. */
export default function OrderConfirmationPage() {
  const { slug, orderNumber } = useParams<{ slug: string; orderNumber: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let saved: { orderNumber: string; phone: string } | null = null;
    try {
      const raw = sessionStorage.getItem(`sellora-last-order-${slug}`);
      if (raw) saved = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    if (!saved || saved.orderNumber !== orderNumber) {
      setFailed(true);
      return;
    }
    trackOrder({ slug, orderNumber, phone: saved.phone }).then((res) => {
      if (res.ok) setOrder(res.order as OrderData);
      else setFailed(true);
    });
  }, [slug, orderNumber]);

  if (failed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-xl font-bold text-ink">Order confirmed!</p>
        <p className="mt-2 text-sm text-muted">
          Your order <span className="font-mono font-semibold text-ink">{orderNumber}</span> was placed.
          Track it here:
        </p>
        <Link
          href={`/s/${slug}/track`}
          className="mt-6 inline-block rounded-full bg-emerald-950 px-8 py-3 text-sm font-bold text-white"
        >
          Track my order
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-muted">Loading your order…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-mint">
          <span className="text-2xl font-bold text-emerald-950">✓</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Order confirmed!</h1>
        <p className="mt-2 text-sm text-muted">
          Thank you, {order.customer_name}. The seller will contact you shortly on WhatsApp.
        </p>
        <div className="mt-6 space-y-2 rounded-2xl bg-canvas p-4 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Order number</span>
            <span className="font-mono font-bold text-ink">{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment</span>
            <span className="font-medium text-ink">{METHOD_LABELS[order.payment_method] ?? order.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Items</span>
            <span className="font-medium text-ink">
              {order.items.map((i) => `${i.title} × ${i.quantity}`).join(", ")}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span className="text-ink">Total</span>
            <span className="text-emerald-950">{formatRs(order.total)}</span>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/s/${slug}/track`}
            className="flex h-12 items-center justify-center rounded-xl bg-emerald-950 text-sm font-semibold text-white"
          >
            Track order
          </Link>
          <Link
            href={`/s/${slug}/products`}
            className="flex h-12 items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold text-ink"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
