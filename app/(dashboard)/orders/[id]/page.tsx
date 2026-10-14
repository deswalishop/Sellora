import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";
import { OrderActions } from "@/features/orders/order-actions";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-violet-100 text-violet-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-slate-200 text-slate-600",
  refunded: "bg-slate-200 text-slate-600",
};

const METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
  raast: "Raast",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  manual: "Manual",
};

/** Order detail (PRD section 28, M1.5): timeline, items, customer, status + WhatsApp. */
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!store) redirect("/onboarding");
  const s = store as { id: string; name: string };

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("store_id", s.id)
    .maybeSingle();
  if (!order) notFound();
  const o = order as {
    id: string; order_number: string; customer_name: string; customer_phone: string;
    customer_email: string | null; shipping_address: string; shipping_city: string;
    shipping_area: string | null; subtotal: number; delivery_fee: number; discount: number;
    total: number; payment_method: string; payment_status: string; status: string;
    notes: string | null; source: string; created_at: string;
  };

  const { data: items } = await supabase
    .from("order_items")
    .select("title, variant_name, quantity, unit_price")
    .eq("order_id", o.id);
  const { data: history } = await supabase
    .from("order_status_history")
    .select("from_status, to_status, note, created_at")
    .eq("order_id", o.id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm font-medium text-muted hover:text-ink">← Orders</Link>
          <h1 className="mt-1 font-mono text-2xl font-bold text-ink">#{o.order_number}</h1>
          <p className="mt-1 text-sm text-muted">
            {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}
            {" · via "}{o.source}
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${STATUS_STYLES[o.status] ?? "bg-slate-100 text-muted"}`}>
          {o.status}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="mb-4 font-semibold text-ink">Items</p>
            <ul className="divide-y divide-slate-100">
              {(items as { title: string; variant_name: string | null; quantity: number; unit_price: number }[] ?? []).map((it, i) => (
                <li key={i} className="flex justify-between gap-3 py-2.5 text-sm">
                  <span className="text-ink">
                    <span className="font-medium">{it.title}</span>
                    {it.variant_name && <span className="text-muted"> ({it.variant_name})</span>}
                    <span className="text-muted"> × {it.quantity}</span>
                  </span>
                  <span className="font-semibold text-ink">{formatRs(it.unit_price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatRs(o.subtotal)}</span></div>
              <div className="flex justify-between text-muted"><span>Delivery</span><span>{o.delivery_fee === 0 ? "FREE" : formatRs(o.delivery_fee)}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-muted"><span>Discount</span><span>−{formatRs(o.discount)}</span></div>}
              <div className="flex justify-between pt-1 text-base font-bold text-ink"><span>Total</span><span>{formatRs(o.total)}</span></div>
              <div className="flex justify-between text-muted"><span>Payment</span><span>{METHOD_LABELS[o.payment_method] ?? o.payment_method} · {o.payment_status}</span></div>
            </div>
            {o.notes && (
              <div className="mt-4 rounded-xl bg-canvas p-3 text-sm text-muted">
                <span className="font-semibold text-ink">Note: </span>{o.notes}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="mb-3 font-semibold text-ink">Customer</p>
              <p className="text-sm font-medium text-ink">{o.customer_name}</p>
              <p className="mt-1 text-sm text-muted" dir="ltr">{o.customer_phone}</p>
              {o.customer_email && <p className="mt-1 text-sm text-muted">{o.customer_email}</p>}
              <p className="mt-3 text-sm text-muted">{o.shipping_address}{o.shipping_area ? `, ${o.shipping_area}` : ""}, {o.shipping_city}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="mb-3 font-semibold text-ink">Status history</p>
              {(history as { from_status: string | null; to_status: string; note: string | null; created_at: string }[] ?? []).length === 0 ? (
                <p className="text-sm text-muted">No updates yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(history as { from_status: string | null; to_status: string; note: string | null; created_at: string }[]).map((h, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="text-muted">
                        {h.from_status ? `${h.from_status} → ` : ""}<span className="font-semibold capitalize text-ink">{h.to_status}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {new Date(h.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <OrderActions
          orderId={o.id}
          currentStatus={o.status}
          customerName={o.customer_name}
          customerPhone={o.customer_phone}
          orderNumber={o.order_number}
          storeName={s.name}
          total={o.total}
        />
      </div>
    </div>
  );
}
