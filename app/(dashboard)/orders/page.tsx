import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";
import { PageHeader, Card, Badge, DataTable, EmptyState } from "@/features/dashboard/ui";

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
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} orders`}
        actions={
          <Link
            href="/orders/new"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Create order
          </Link>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-neutral-100 px-5 py-4 sm:flex-row">
          <form className="flex flex-1 gap-2" action="/orders" method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search order #, name, phone…"
              className="h-10 flex-1 rounded-lg border border-neutral-300 px-3.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <button
              type="submit"
              className="h-10 rounded-lg border border-neutral-300 px-5 text-sm font-medium text-neutral-800 transition hover:border-neutral-500"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-5 py-2">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/orders?${new URLSearchParams({ ...(q ? { q } : {}), ...(t !== "all" ? { status: t } : {}) }).toString()}`}
              className={`shrink-0 rounded-md px-3 py-1.5 text-[13px] capitalize transition ${
                status === t ? "bg-neutral-100 font-semibold text-neutral-900" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            hint={q || status !== "all" ? "Try a different search or filter." : "Orders from your store will appear here."}
          />
        ) : (
          <DataTable headers={["Order", "Date", "Customer", "Payment", "Total", "Status"]}>
            {orders.map((o) => (
              <tr key={o.id} className="transition hover:bg-neutral-50">
                <td className="px-5 py-3">
                  <Link href={`/orders/${o.id}`} className="font-mono font-medium text-neutral-900 hover:underline">
                    #{o.order_number}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-neutral-600">
                  {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-neutral-900">{o.customer_name}</p>
                  <p className="text-xs text-neutral-500" dir="ltr">{o.customer_phone}</p>
                </td>
                <td className="px-5 py-3 text-neutral-600">{o.payment_method.toUpperCase()}</td>
                <td className="whitespace-nowrap px-5 py-3 font-medium text-neutral-900">{formatRs(o.total)}</td>
                <td className="px-5 py-3">
                  <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>{o.status}</Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
    </div>
  );
}
