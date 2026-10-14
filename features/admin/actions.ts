"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Returns true if the signed-in user is a platform admin. */
export async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!(profile as { is_admin?: boolean } | null)?.is_admin) {
    return { ok: false, error: "Admin access required." };
  }
  return { ok: true, userId: user.id };
}

const extendSchema = z.object({
  subscriptionId: z.string().uuid(),
  days: z.number().int().min(1).max(365),
});

/** Admin: extend a trial/subscription by N days. */
export async function adminExtendSubscription(input: unknown) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin;
  const parsed = extendSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, trial_ends_at, current_period_ends_at, status")
    .eq("id", parsed.data.subscriptionId)
    .maybeSingle();
  const s = sub as { id: string; trial_ends_at: string | null; current_period_ends_at: string | null; status: string } | null;
  if (!s) return { ok: false as const, error: "Subscription not found." };
  const base = new Date(Math.max(Date.now(), new Date(s.trial_ends_at ?? s.current_period_ends_at ?? Date.now()).getTime()));
  base.setDate(base.getDate() + parsed.data.days);
  const { error } = await supabase
    .from("subscriptions")
    .update({
      trial_ends_at: s.status === "trialing" ? base.toISOString() : s.trial_ends_at,
      current_period_ends_at: s.status !== "trialing" ? base.toISOString() : s.current_period_ends_at,
      status: s.status === "expired" ? "active" : s.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", s.id);
  if (error) return { ok: false as const, error: "Could not extend. Try again." };
  revalidatePath("/admin");
  return { ok: true as const };
}

const planSchema = z.object({
  subscriptionId: z.string().uuid(),
  planSlug: z.enum(["free", "starter", "business", "pro"]),
});

/** Admin: change a store's plan (manual billing, D1). */
export async function adminChangePlan(input: unknown) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin;
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };
  const supabase = await createClient();
  const { data: plan } = await supabase.from("plans").select("id").eq("slug", parsed.data.planSlug).maybeSingle();
  if (!plan) return { ok: false as const, error: "Plan not found." };
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan_id: (plan as { id: string }).id,
      status: "active",
      trial_ends_at: null,
      current_period_ends_at: new Date(Date.now() + 30 * 864e5).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.subscriptionId);
  if (error) return { ok: false as const, error: "Could not change plan. Try again." };
  revalidatePath("/admin");
  return { ok: true as const };
}

const suspendSchema = z.object({
  storeId: z.string().uuid(),
  suspend: z.boolean(),
});

/** Admin: suspend / reactivate a store. */
export async function adminSuspendStore(input: unknown) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin;
  const parsed = suspendSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("stores")
    .update({ status: parsed.data.suspend ? "suspended" : "active" })
    .eq("id", parsed.data.storeId);
  if (error) return { ok: false as const, error: "Could not update store. Try again." };
  revalidatePath("/admin");
  return { ok: true as const };
}
