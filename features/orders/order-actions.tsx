"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/features/orders/actions";
import { waLink, waTemplate } from "@/features/orders/whatsapp";
import { formatRs } from "@/lib/format";

const NEXT_LABELS: Record<string, string> = {
  confirmed: "Confirm order",
  packed: "Mark as packed",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
  returned: "Mark as returned",
  refunded: "Mark as refunded",
};

const TIMELINE = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;

/** Status updater + WhatsApp actions on the order detail page. */
export function OrderActions({
  orderId,
  currentStatus,
  customerName,
  customerPhone,
  orderNumber,
  storeName,
  total,
}: {
  orderId: string;
  currentStatus: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  storeName: string;
  total: number;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const NEXT: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["delivered", "returned"],
    delivered: ["returned", "refunded"],
    cancelled: [],
    returned: ["refunded"],
    refunded: [],
  };
  const next = NEXT[currentStatus] ?? [];
  const vars = { customerName, orderNumber, storeName, total: formatRs(total) };
  const stepIndex = TIMELINE.indexOf(currentStatus as (typeof TIMELINE)[number]);

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {next.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-ink">Update status</p>
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <button
                key={s}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setError(null);
                    const res = await updateOrderStatus({ orderId, toStatus: s });
                    if (!res.ok) setError(res.error);
                  })
                }
                className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                  s === "cancelled"
                    ? "border border-red-300 text-red-700 hover:bg-red-50"
                    : "bg-emerald-950 text-white hover:bg-emerald-950/90"
                }`}
              >
                {NEXT_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="mb-1 text-sm font-semibold text-ink">Message customer on WhatsApp</p>
        <p className="mb-3 text-xs text-muted">Opens WhatsApp with a prefilled message — free, no API needed.</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["confirmed", "Order confirmed"],
              ["shipped", "Order shipped"],
              ["delivered", "Order delivered"],
              ["payment", "Payment reminder"],
              ["custom", "Custom message"],
            ] as const
          ).map(([kind, label]) => (
            <a
              key={kind}
              href={waLink(customerPhone, waTemplate(kind, vars))}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-emerald-800/30 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100"
            >
              {label} 💬
            </a>
          ))}
        </div>
      </div>

      {stepIndex >= 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-ink">Progress</p>
          <ol>
            {TIMELINE.map((t, i) => (
              <li key={t} className="relative flex gap-3 pb-5 last:pb-0">
                {i < TIMELINE.length - 1 && (
                  <span className={`absolute left-[11px] top-6 h-full w-0.5 ${i < stepIndex ? "bg-emerald-800" : "bg-slate-200"}`} />
                )}
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i <= stepIndex ? "bg-emerald-950 text-white" : "bg-slate-200 text-muted"}`}>
                  {i <= stepIndex ? "✓" : i + 1}
                </span>
                <span className={`pt-0.5 text-sm capitalize ${i === stepIndex ? "font-bold text-ink" : i < stepIndex ? "text-ink" : "text-muted"}`}>
                  {t}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
