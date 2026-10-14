"use client";

import { useState, useTransition } from "react";
import { adminExtendSubscription, adminChangePlan } from "@/features/admin/actions";

const PLANS = ["free", "starter", "business", "pro"] as const;

/** Admin subscription actions: extend trial / change plan. */
export function SubscriptionActions({ subscriptionId }: { subscriptionId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState("14");
  const [plan, setPlan] = useState<string>("business");
  const [done, setDone] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, label: string) {
    start(async () => {
      setError(null);
      setDone(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Failed.");
      else setDone(label);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
      {done && <span className="w-full text-xs font-semibold text-emerald-700">{done} ✓</span>}
      <input
        value={days}
        onChange={(e) => setDays(e.target.value)}
        type="number"
        min={1}
        max={365}
        aria-label="Days to extend"
        className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-xs"
      />
      <button
        disabled={pending}
        onClick={() => run(() => adminExtendSubscription({ subscriptionId, days: Number(days) || 14 }), `Extended ${days} days`)}
        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:border-emerald-950 disabled:opacity-50"
      >
        Extend
      </button>
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        aria-label="Plan"
        className="h-8 rounded-lg border border-slate-200 px-2 text-xs"
      >
        {PLANS.map((p) => (
          <option key={p} value={p} className="capitalize">{p}</option>
        ))}
      </select>
      <button
        disabled={pending}
        onClick={() => run(() => adminChangePlan({ subscriptionId, planSlug: plan as (typeof PLANS)[number] }), `Plan → ${plan}`)}
        className="rounded-full bg-emerald-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-950/90 disabled:opacity-50"
      >
        Set plan
      </button>
    </div>
  );
}
