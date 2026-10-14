import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/admin/actions";
import { SubscriptionActions } from "@/features/admin/subscription-actions";

/** Admin: subscriptions — manual activate/extend/change plan (D1 billing). */
export default async function AdminSubscriptions() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("id, status, trial_ends_at, current_period_ends_at, created_at, stores!inner(name, slug), plans!inner(slug, name, price_monthly_pkr)")
    .order("created_at", { ascending: false })
    .limit(100);

  const subs = (data ?? []) as unknown as {
    id: string; status: string; trial_ends_at: string | null; current_period_ends_at: string | null;
    created_at: string; stores: { name: string; slug: string }; plans: { slug: string; name: string; price_monthly_pkr: number };
  }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Subscriptions</h1>
      <p className="mt-1 text-sm text-muted">
        Manual billing: after receiving payment (bank/Easypaisa/JazzCash), set the plan here.
      </p>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white">
        <ul className="divide-y divide-slate-100">
          {subs.map((s) => (
            <li key={s.id} className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{s.stores.name}</p>
                  <p className="text-xs text-muted">
                    {s.plans.name} · Rs. {s.plans.price_monthly_pkr.toLocaleString("en-PK")}/mo
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${s.status === "active" ? "bg-emerald-100 text-emerald-800" : s.status === "trialing" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"}`}>
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-muted">
                {s.status === "trialing" && s.trial_ends_at
                  ? `Trial ends ${new Date(s.trial_ends_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}`
                  : s.current_period_ends_at
                    ? `Paid until ${new Date(s.current_period_ends_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}`
                    : "No period set"}
              </p>
              <SubscriptionActions subscriptionId={s.id} />
            </li>
          ))}
          {subs.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">No subscriptions yet.</li>}
        </ul>
      </div>
    </div>
  );
}
