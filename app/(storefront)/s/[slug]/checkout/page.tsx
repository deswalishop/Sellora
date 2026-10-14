import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm, type PaymentOption } from "@/features/storefront/checkout-form";

/** Checkout page (PRD section 28) — server wrapper loads payment config. */
export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, brand_color")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!store) notFound();
  const s = store as { id: string; brand_color: string };

  const { data: settings } = await supabase
    .from("store_settings")
    .select(
      "cod_enabled, bank_transfer_enabled, bank_details, raast_enabled, raast_id, easypaisa_enabled, easypaisa_details, jazzcash_enabled, jazzcash_details, shipping_fee_flat, free_shipping_threshold"
    )
    .eq("store_id", s.id)
    .maybeSingle();
  const st = (settings ?? {}) as Record<string, unknown>;

  const options: PaymentOption[] = [];
  if (st.cod_enabled) options.push({ method: "cod", label: "Cash on Delivery", instructions: null });
  if (st.bank_transfer_enabled)
    options.push({ method: "bank_transfer", label: "Bank Transfer", instructions: (st.bank_details as string) ?? null });
  if (st.raast_enabled)
    options.push({ method: "raast", label: "Raast", instructions: (st.raast_id as string) ?? null });
  if (st.easypaisa_enabled)
    options.push({
      method: "easypaisa",
      label: "Easypaisa",
      instructions: (st.easypaisa_details as string) ?? null,
    });
  if (st.jazzcash_enabled)
    options.push({
      method: "jazzcash",
      label: "JazzCash",
      instructions: (st.jazzcash_details as string) ?? null,
    });

  if (options.length === 0) redirect(`/s/${slug}`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Checkout</h1>
      <CheckoutForm
        options={options}
        shippingFee={(st.shipping_fee_flat as number) ?? 0}
        freeThreshold={(st.free_shipping_threshold as number | null) ?? null}
        brandColor={(s.brand_color as string) || "#065F46"}
      />
    </div>
  );
}
