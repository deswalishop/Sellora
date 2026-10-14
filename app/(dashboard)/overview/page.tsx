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

function pctChange(curr: number, prev: number): string | null {
  if (prev === 0) return curr > 0 ? "+100%" : null;
  const v = ((curr - prev) / prev) * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`;
}

function greeting(): string {
  const h = Number(
    new Intl.DateTimeFormat("en-PK", { hour: "numeric", hour12: false, timeZone: "Asia/Karachi" }).format(new Date())
  );
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Seller dashboard overview (PRD section 12, M1.5) — real store data. */
export default async function DashboardOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!store) redirect("/onboarding");
  const s = store as { id: string; name: string; slug: string };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const firstName = ((profile as { full_name?: string } | null)?.full_name ?? "").split(" ")[0] || "there";

  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
  const iso30 = d30.toISOString();
  const iso60 = d60.toISOString();

  // Orders (last 60 days) for KPI windows
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, status, created_at, customer_name, order_number, payment_method")
    .eq("store_id", s.id)
    .gte("created_at", iso60)
    .order("created_at", { ascending: false });
  const all = (orders ?? []) as {
    id: string; total: number; status: string; created_at: string;
    customer_name: string; order_number: string; payment_method: string;
  }[];
  const live = all.filter((o) => !["cancelled", "returned", "refunded"].includes(o.status));
  const curr = live.filter((o) => o.created_at >= iso30);
  const prev = live.filter((o) => o.created_at < iso30);
  const sales = (list: typeof live) => list.reduce((a, o) => a + o.total, 0);
  const salesCurr = sales(curr);
  const salesPrev = sales(prev);
  const aov = curr.length ? Math.round(salesCurr / curr.length) : 0;
  const aovPrev = prev.length ? Math.round(salesPrev / prev.length) : 0;

  const { count: customerCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("store_id", s.id);
  const { count: newCustomers } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("store_id", s.id)
    .gte("created_at", iso30);

  // 7-day revenue bars
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-PK", { weekday: "short" });
    const value = live
      .filter((o) => o.created_at.slice(0, 10) === key)
      .reduce((a, o) => a + o.total, 0);
    days.push({ label, value });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.value));

  // Top products by quantity sold (all time)
  const { data: items } = await supabase
    .from("order_items")
    .select("title, quantity, unit_price, orders!inner(store_id)")
    .eq("orders.store_id", s.id)
    .limit(500);
  const byProduct = new Map<string, { qty: number; revenue: number }>();
  for (const it of (items ?? []) as { title: string; quantity: number; unit_price: number }[]) {
    const e = byProduct.get(it.title) ?? { qty: 0, revenue: 0 };
    e.qty += it.quantity;
    e.revenue += it.quantity * it.unit_price;
    byProduct.set(it.title, e);
  }
  const topProducts = [...byProduct.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  // Low stock alerts
  const { data: lowStock } = await supabase
    .from("products")
    .select("id, title, stock")
    .eq("store_id", s.id)
    .is("deleted_at", null)
    .lte("stock", 5)
    .order("stock", { ascending: true })
    .limit(5);

  const kpis = [
    { label: "Total Sales", value: formatRs(salesCurr), delta: pctChange(salesCurr, salesPrev), sub: "vs last 30 days" },
    { label: "Orders", value: String(curr.length), delta: pctChange(curr.length, prev.length), sub: "vs last 30 days" },
    { label: "Customers", value: String(customerCount ?? 0), delta: newCustomers ? `+${newCustomers} new` : null, sub: "total customers" },
    { label: "Avg. Order Value", value: formatRs(aov), delta: pctChange(aov, aovPrev), sub: "vs last 30 days" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {greeting()}, {firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            {curr.length > 0
              ? "Your store is performing well. Here's a quick overview."
              : "Welcome to Sellora! Add products and share your store link to get your first order."}
          </p>
        </div>
        <Link
          href={`/s/${s.slug}`}
          target="_blank"
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-emerald-950"
        >
          View my store
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(6,95,70,0.06)]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink">{k.value}</p>
            <p className="mt-1 text-xs">
              {k.delta && <span className="font-semibold text-emerald-700">{k.delta} </span>}
              <span className="text-muted">{k.sub}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Sales chart */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(6,95,70,0.06)] xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Sales Overview</p>
              <p className="mt-1 text-xl font-bold text-ink">{formatRs(salesCurr)}</p>
            </div>
            <span className="text-xs text-muted">Last 7 days</span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3">
            {days.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-900 to-emerald-500/80 transition-all"
                    style={{ height: `${Math.max(4, (d.value / maxDay) * 100)}%` }}
                    title={`${d.label}: ${formatRs(d.value)}`}
                  />
                </div>
                <span className="text-[11px] text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(6,95,70,0.06)]">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">Low stock alerts</p>
            <Link href="/products" className="text-xs font-semibold text-emerald-950 hover:underline">
              View all
            </Link>
          </div>
          {(lowStock ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted">All products are well stocked. 🎉</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {(lowStock as { id: string; title: string; stock: number }[]).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-ink">{p.title}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${p.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Recent orders */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(6,95,70,0.06)] xl:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">Recent Orders</p>
            <Link href="/orders" className="text-xs font-semibold text-emerald-950 hover:underline">
              View All
            </Link>
          </div>
          {all.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-ink">No orders yet</p>
              <p className="mt-1 text-xs text-muted">Share your store link on WhatsApp to get your first order.</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {all.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-center gap-3 py-3 transition hover:bg-canvas/60">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-sm font-bold text-emerald-950">
                      {o.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        <span className="font-mono">#{o.order_number}</span> · {o.customer_name}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} · {o.payment_method.toUpperCase()}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink">{formatRs(o.total)}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[o.status] ?? "bg-slate-100 text-muted"}`}>
                      {o.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top products */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(6,95,70,0.06)]">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">Top Products</p>
            <Link href="/products" className="text-xs font-semibold text-emerald-950 hover:underline">
              View All
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No sales yet — your best sellers will appear here.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map(([title, v]) => (
                <li key={title} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{title}</p>
                    <p className="text-xs text-muted">{v.qty} orders</p>
                  </div>
                  <p className="shrink-0 font-bold text-ink">{formatRs(v.revenue)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
