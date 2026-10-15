import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";
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
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle={
          curr.length > 0
            ? "Here's what's happening across your store today."
            : "Welcome to Sellora! Add products and share your store link to get your first order."
        }
        actions={
          <a
            href={`/s/${s.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-500"
          >
            View store
          </a>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-[13px] text-neutral-500">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">{k.value}</p>
            <p className="mt-1 text-xs">
              {k.delta && <span className="font-medium text-neutral-700">{k.delta} </span>}
              <span className="text-neutral-500">{k.sub}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Sales chart */}
        <Card title="Sales" className="xl:col-span-2" actions={<span className="text-xs text-neutral-500">Last 7 days</span>}>
          <div className="px-5 py-5">
            <p className="text-xl font-semibold text-neutral-900">{formatRs(salesCurr)}</p>
            <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3">
              {days.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-neutral-900/90"
                      style={{ height: `${Math.max(4, (d.value / maxDay) * 100)}%` }}
                      title={`${d.label}: ${formatRs(d.value)}`}
                    />
                  </div>
                  <span className="text-[11px] text-neutral-500">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Low stock */}
        <Card
          title="Low stock"
          actions={
            <Link href="/products" className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 hover:underline">
              View all
            </Link>
          }
        >
          {(lowStock ?? []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-500">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {(lowStock as { id: string; title: string; stock: number }[]).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span className="truncate font-medium text-neutral-900">{p.title}</span>
                  <Badge tone={p.stock === 0 ? "critical" : "attention"}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Recent orders */}
        <Card
          title="Recent orders"
          className="xl:col-span-2"
          actions={
            <Link href="/orders" className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 hover:underline">
              View all
            </Link>
          }
        >
          {all.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-neutral-900">No orders yet</p>
              <p className="mt-1 text-[13px] text-neutral-500">Share your store link on WhatsApp to get your first order.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {all.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-neutral-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        <span className="font-mono">#{o.order_number}</span> · {o.customer_name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} · {o.payment_method.toUpperCase()}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-neutral-900">{formatRs(o.total)}</p>
                    <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Top products */}
        <Card
          title="Top products"
          actions={
            <Link href="/products" className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 hover:underline">
              View all
            </Link>
          }
        >
          {topProducts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-500">No sales yet — your best sellers will appear here.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {topProducts.map(([title, v]) => (
                <li key={title} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900">{title}</p>
                    <p className="text-xs text-neutral-500">{v.qty} sold</p>
                  </div>
                  <p className="shrink-0 font-medium text-neutral-900">{formatRs(v.revenue)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
