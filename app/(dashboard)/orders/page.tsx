import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";

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

const TABS = ["all", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;

/** Orders list (PRD section 28, M1.5) — search + status filter. */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "all" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!store) redirect("/onboarding");
  const storeId = (store as { id: string }).id;

  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, total, status, payment_method, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);
  const needle = q.trim();
  if (needle) {
    query = query.or(
      `order_number.ilike.%${needle}%,customer_name.ilike.%${needle}%,customer_phone.ilike.%${needle}%`
    );
  }
  const { data } = await query;
  const orders = (data ?? []) as {
    id: string; order_number: string; customer_name: string; customer_phone: string;
    total: number; status: string; payment_method: string; created_at: string;
  }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Orders</h1>
          <p className="mt-1 text-sm text-muted">{orders.length} orders</p>
        </div>
        <Link
          href="/orders/new"
          className="rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950/90"
        >
          + Manual order
        </Link>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row" action="/orders" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order #, name, phone…"
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-ink placeholder:text-muted/60 focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/30"
        />
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <button
          type="submit"
          className="h-11 rounded-xl border border-slate-300 px-6 text-sm font-semibold text-ink transition hover:border-emerald-950"
        >
          Search
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/orders?${new URLSearchParams({ ...(q ? { q } : {}), ...(t !== "all" ? { status: t } : {}) }).toString()}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
              status === t ? "bg-emerald-950 text-white" : "bg-white text-muted border border-slate-200 hover:text-ink"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-semibold text-ink">No orders found</p>
          <p className="mt-1 text-sm text-muted">
            {q || status !== "all" ? "Try a different search or filter." : "Orders from your store will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_30px_rgba(6,95,70,0.06)]">
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-canvas/60">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas text-sm font-bold text-emerald-950">
                    {o.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      <span className="font-mono">#{o.order_number}</span> · {o.customer_name}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      {" · "}{o.customer_phone} · {o.payment_method.toUpperCase()}
                    </p>
                  </div>
                  <p className="hidden shrink-0 text-sm font-bold text-ink sm:block">{formatRs(o.total)}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[o.status] ?? "bg-slate-100 text-muted"}`}>
                    {o.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
