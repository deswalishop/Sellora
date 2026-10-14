import { createClient } from "@/lib/supabase/server";
import { formatRs } from "@/lib/format";
import { requireAdmin } from "@/features/admin/actions";
import { redirect } from "next/navigation";

/** Admin overview (M1.6): platform-wide counts. */
export default async function AdminOverview() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  const supabase = await createClient();

  const [{ count: sellers }, { count: stores }, { count: orders }, { data: subs }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("status, plans!inner(price_monthly_pkr)"),
  ]);

  const mrr = ((subs ?? []) as unknown as { status: string; plans: { price_monthly_pkr: number } }[])
    .filter((s) => s.status === "active")
    .reduce((a, s) => a + s.plans.price_monthly_pkr, 0);
  const trialing = ((subs ?? []) as unknown as { status: string }[]).filter((s) => s.status === "trialing").length;

  const cards = [
    ["Sellers", String(sellers ?? 0)],
    ["Stores", String(stores ?? 0)],
    ["Total orders", String(orders ?? 0)],
    ["Active trials", String(trialing)],
    ["MRR (active plans)", formatRs(mrr)],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Platform overview</h1>
      <p className="mt-1 text-sm text-muted">Manual billing (D1): activate plans below after receiving payment.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-3xl border border-slate-200/70 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{l}</p>
            <p className="mt-2 text-2xl font-bold text-ink">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm">
        <p className="font-bold text-amber-900">Trial expiry job</p>
        <p className="mt-1 text-amber-800">
          Expired trials are downgraded by calling <code className="font-mono">POST /api/cron/expire-trials</code> with
          the <code className="font-mono">CRON_SECRET</code> bearer token. Schedule it daily (Vercel Cron or any scheduler).
        </p>
      </div>
    </div>
  );
}
