"use server";

import { createClient } from "@/lib/supabase/server";
import {
  onboardingSchema,
  slugify,
  RESERVED_SLUGS,
  type OnboardingInput,
} from "./schemas";

export interface SlugCheck {
  available: boolean;
  message: string;
}

export type OnboardingResult = { ok: true; slug: string } | { ok: false; error: string };

/** Live slug availability check for Step 2 (also re-checked server-side on submit). */
export async function checkSlugAvailability(raw: string): Promise<SlugCheck> {
  const slug = raw.trim().toLowerCase();
  if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
    return { available: false, message: "3–30 characters: a–z, 0–9 and hyphens." };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { available: false, message: "This URL is reserved." };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("stores").select("id").eq("slug", slug).limit(1);
  if (data && data.length > 0) {
    return { available: false, message: "Taken — try another one." };
  }
  return { available: true, message: `${slug}.sellora.com is available!` };
}

/**
 * Creates everything for a new seller in one go:
 * store → store_settings → 14-day Business trial subscription → first product.
 * All writes run as the signed-in user; RLS enforces ownership.
 */
export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your input." };
  }
  const d = parsed.data;

  // MVP: one store per account.
  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);
  if (existing && existing.length > 0) {
    return { ok: false, error: "You already have a store." };
  }

  // Never trust the client's availability check — re-verify here.
  if (RESERVED_SLUGS.has(d.slug)) return { ok: false, error: "This URL is reserved." };
  const { data: taken } = await supabase.from("stores").select("id").eq("slug", d.slug).limit(1);
  if (taken && taken.length > 0) {
    return { ok: false, error: "This store URL was just taken. Try another." };
  }

  const { data: plan } = await supabase.from("plans").select("id").eq("slug", "business").single();
  if (!plan) return { ok: false, error: "Plans are not set up yet. Contact support." };

  // 1. Store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .insert({
      owner_id: user.id,
      name: d.storeName,
      slug: d.slug,
      brand_color: d.brandColor,
    })
    .select("id, slug")
    .single();
  if (storeError || !store) return { ok: false, error: "Could not create your store. Try again." };

  // 2. Settings (payment preferences)
  const { error: settingsError } = await supabase.from("store_settings").insert({
    store_id: store.id,
    whatsapp_number: d.whatsapp,
    instagram_handle: d.instagram?.replace(/^@/, "") || null,
    cod_enabled: d.codEnabled,
    bank_transfer_enabled: d.bankEnabled,
    bank_details: d.bankDetails || null,
    raast_enabled: d.raastEnabled,
    raast_id: d.raastId || null,
    easypaisa_enabled: d.easypaisaEnabled,
    easypaisa_details: d.easypaisaDetails || null,
    jazzcash_enabled: d.jazzcashEnabled,
    jazzcash_details: d.jazzcashDetails || null,
  });
  if (settingsError) {
    await supabase.from("stores").delete().eq("id", store.id);
    return { ok: false, error: "Could not save payment settings. Try again." };
  }

  // 3. 14-day Business trial
  const trialEnds = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  await supabase.from("subscriptions").insert({
    store_id: store.id,
    plan_id: plan.id,
    status: "trialing",
    trial_ends_at: trialEnds,
    current_period_ends_at: trialEnds,
  });

  // 4. First product (unique slug within the store)
  let productSlug = slugify(d.productName) || "product";
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = attempt === 0 ? productSlug : `${productSlug}-${attempt + 1}`;
    const { error } = await supabase.from("products").insert({
      store_id: store.id,
      title: d.productName,
      slug: candidate,
      description: "",
      regular_price: d.productPrice,
      stock: d.productStock,
      status: "active",
    });
    if (!error) {
      productSlug = candidate;
      break;
    }
    if (attempt === 2) {
      // Product is optional for launch — store is already live.
      break;
    }
  }

  return { ok: true, slug: store.slug };
}
