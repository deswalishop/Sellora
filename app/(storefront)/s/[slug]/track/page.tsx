"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRs } from "@/lib/format";
import { trackOrder } from "@/features/storefront/actions";

interface TrackedOrder {
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: { title: string; variant_name: string | null; quantity: number; unit_price: number }[];
}

const TIMELINE = [
  { key: "pending", label: "Order received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

const END_STATES: Record<string, string> = {
  cancelled: "This order was cancelled.",
  returned: "This order was returned.",
  refunded: "This order was refunded.",
};

/** Public order tracking (PRD section 30): order number + phone. */
export default function TrackPage() {
  const { slug } = useParams<{ slug: string }>();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setOrder(null);
    const res = await trackOrder({ slug, orderNumber, phone });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOrder(res.order as TrackedOrder);
  }

  const stepIndex = TIMELINE.findIndex((t) => t.key === order?.status);
  const endState = order ? END_STATES[order.status] : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Track your order</h1>
      <p className="mt-1 text-sm text-muted">Enter your order number and mobile number.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <Input label="Order number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. SLR-1001" required />
        <Input label="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" required />
        <Button type="submit" loading={pending} size="lg">
          Track order
        </Button>
      </form>

      {order && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono font-bold text-ink">{order.order_number}</p>
            <p className="text-sm font-bold text-emerald-950">{formatRs(order.total)}</p>
          </div>

          {endState ? (
            <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-sm text-muted">{endState}</p>
          ) : (
            <ol className="mt-6 space-y-0">
              {TIMELINE.map((t, i) => {
                const done = i <= stepIndex;
                const current = i === stepIndex;
                return (
                  <li key={t.key} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < TIMELINE.length - 1 && (
                      <span
                        className={`absolute left-[13px] top-7 h-full w-0.5 ${i < stepIndex ? "bg-emerald-950" : "bg-slate-200"}`}
                      />
                    )}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        done ? "bg-emerald-950 text-white" : "bg-slate-200 text-muted"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={`pt-1 text-sm ${current ? "font-bold text-ink" : done ? "font-medium text-ink" : "text-muted"}`}>
                      {t.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm font-semibold text-ink">Items</p>
            <div className="space-y-1 text-sm">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted">
                    {it.title} {it.variant_name && `(${it.variant_name})`} × {it.quantity}
                  </span>
                  <span className="font-medium text-ink">{formatRs(it.unit_price * it.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
