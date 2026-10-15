import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";
import { OrderActions } from "@/features/orders/order-actions";
import { PageHeader, Card, Badge } from "@/features/dashboard/ui";

const STATUS_TONE: Record<string, "success" | "attention" | "warning" | "critical" | "info" | "neutral"> = {
  pending: "attention",
  confirmed: "info",
  packed: "info",
  shipped: "warning",
  delivered: "success",
  cancelled: "critical",
  returned: "neutral",
  refunded: "neutral",
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
    <div>
      <PageHeader
        title={`#${o.order_number}`}
        subtitle={`${new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })} · via ${o.source}`}
        actions={<Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>}
      />
      <p className="mb-5 -mt-3 text-sm">
        <Link href="/orders" className="text-neutral-500 hover:text-neutral-900 hover:underline">← All orders</Link>
      </p>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Items">
            <ul className="divide-y divide-neutral-100 px-5">
              {(items as { title: string; variant_name: string | null; quantity: number; unit_price: number }[] ?? []).map((it, i) => (
                <li key={i} className="flex justify-between gap-3 py-3 text-sm">
                  <span className="text-neutral-900">
                    <span className="font-medium">{it.title}</span>
                    {it.variant_name && <span className="text-neutral-500"> ({it.variant_name})</span>}
                    <span className="text-neutral-500"> × {it.quantity}</span>
                  </span>
                  <span className="font-medium text-neutral-900">{formatRs(it.unit_price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-neutral-100 px-5 py-4 text-sm">
              <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span>{formatRs(o.subtotal)}</span></div>
              <div className="flex justify-between text-neutral-600"><span>Delivery</span><span>{o.delivery_fee === 0 ? "Free" : formatRs(o.delivery_fee)}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-neutral-600"><span>Discount</span><span>−{formatRs(o.discount)}</span></div>}
              <div className="flex justify-between pt-1 text-base font-semibold text-neutral-900"><span>Total</span><span>{formatRs(o.total)}</span></div>
              <div className="flex justify-between text-neutral-600"><span>Payment</span><span>{METHOD_LABELS[o.payment_method] ?? o.payment_method} · {o.payment_status}</span></div>
            </div>
            {o.notes && (
              <p className="border-t border-neutral-100 px-5 py-3 text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">Note: </span>{o.notes}
              </p>
            )}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Customer">
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-neutral-900">{o.customer_name}</p>
                <p className="mt-1 text-sm text-neutral-600" dir="ltr">{o.customer_phone}</p>
                {o.customer_email && <p className="mt-1 text-sm text-neutral-600">{o.customer_email}</p>}
                <p className="mt-3 text-sm text-neutral-600">{o.shipping_address}{o.shipping_area ? `, ${o.shipping_area}` : ""}, {o.shipping_city}</p>
              </div>
            </Card>
            <Card title="Timeline">
              {(history as { from_status: string | null; to_status: string; note: string | null; created_at: string }[] ?? []).length === 0 ? (
                <p className="px-5 py-4 text-sm text-neutral-500">No updates yet.</p>
              ) : (
                <ul className="space-y-2.5 px-5 py-4 text-sm">
                  {(history as { from_status: string | null; to_status: string; note: string | null; created_at: string }[]).map((h, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="text-neutral-500">
                        {h.from_status ? `${h.from_status} → ` : ""}<span className="font-medium capitalize text-neutral-900">{h.to_status}</span>
                      </span>
                      <span className="shrink-0 text-xs text-neutral-400">
                        {new Date(h.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
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
