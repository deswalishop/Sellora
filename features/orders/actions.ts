"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function getStoreId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  return (store as { id: string } | null)?.id ?? null;
}

const VALID_NEXT: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned", "refunded"],
  cancelled: [],
  returned: ["refunded"],
  refunded: [],
};

const statusSchema = z.object({
  orderId: z.string().uuid(),
  toStatus: z.string(),
});

/** Seller updates an order's status (RLS ensures they own the store). */
export async function updateOrderStatus(input: unknown) {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid request." };
  const storeId = await getStoreId();
  if (!storeId) return { ok: false as const, error: "Not signed in." };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, order_number")
    .eq("id", parsed.data.orderId)
    .eq("store_id", storeId)
    .maybeSingle();
  const o = order as { id: string; status: string; order_number: string } | null;
  if (!o) return { ok: false as const, error: "Order not found." };

  const allowed = VALID_NEXT[o.status] ?? [];
  if (!allowed.includes(parsed.data.toStatus)) {
    return { ok: false as const, error: `Cannot move order from ${o.status} to ${parsed.data.toStatus}.` };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.toStatus, updated_at: new Date().toISOString() })
    .eq("id", o.id);
  if (error) return { ok: false as const, error: "Could not update status. Try again." };

  await supabase.from("order_status_history").insert({
    order_id: o.id,
    from_status: o.status,
    to_status: parsed.data.toStatus,
    note: "Updated by seller",
  });

  // Restock on cancellation/return (mirror of the order_placed decrement)
  if (["cancelled", "returned"].includes(parsed.data.toStatus)) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, variant_id, quantity")
      .eq("order_id", o.id);
    for (const it of (items ?? []) as { product_id: string | null; variant_id: string | null; quantity: number }[]) {
      if (it.variant_id) {
        await supabase.rpc("increment_variant_stock", { p_variant_id: it.variant_id, p_qty: it.quantity }).then(
          () => {},
          () => {}
        );
      } else if (it.product_id) {
        const { data: p } = await supabase.from("products").select("stock").eq("id", it.product_id).maybeSingle();
        const stock = (p as { stock: number } | null)?.stock ?? 0;
        await supabase.from("products").update({ stock: stock + it.quantity }).eq("id", it.product_id);
      }
      await supabase.from("inventory_transactions").insert({
        store_id: storeId,
        product_id: it.product_id,
        variant_id: it.variant_id,
        change: it.quantity,
        reason: parsed.data.toStatus === "cancelled" ? "order_cancelled" : "order_returned",
        order_id: o.id,
      });
    }
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${o.id}`);
  revalidatePath("/");
  return { ok: true as const };
}

const manualOrderSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().regex(/^0?3\d{9}$/, "Enter a valid mobile number"),
  city: z.string().trim().min(2),
  address: z.string().trim().min(5),
  paymentMethod: z.enum(["cod", "bank_transfer", "raast", "easypaisa", "jazzcash"]),
  source: z.enum(["whatsapp", "instagram", "phone", "manual"]),
  notes: z.string().max(500).optional().default(""),
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
    qty: z.number().int().positive().max(100),
  })).min(1).max(50),
});

/** Seller creates an order manually (WhatsApp/Instagram/phone sale). */
export async function createManualOrder(input: unknown) {
  const parsed = manualOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the order details." };
  }
  const d = parsed.data;
  const storeId = await getStoreId();
  if (!storeId) return { ok: false as const, error: "Not signed in." };
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("place_order", {
    p_store_id: storeId,
    p_full_name: d.fullName,
    p_phone: d.phone,
    p_email: null,
    p_city: d.city,
    p_area: "",
    p_address: d.address,
    p_payment_method: d.paymentMethod,
    p_notes: d.notes || "",
    p_items: d.items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, qty: i.qty })),
  });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("INSUFFICIENT_STOCK")) return { ok: false as const, error: "Not enough stock for one of the items." };
    if (msg.includes("PRODUCT_UNAVAILABLE") || msg.includes("VARIANT_UNAVAILABLE"))
      return { ok: false as const, error: "A product is no longer available." };
    return { ok: false as const, error: "Could not create the order. Try again." };
  }
  const orderNumber = (data as { order_number: string } | null)?.order_number;
  if (!orderNumber) return { ok: false as const, error: "Could not create the order. Try again." };

  // Mark the true source (RPC defaults to storefront)
  await supabase.from("orders").update({ source: d.source }).eq("store_id", storeId).eq("order_number", orderNumber);
  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: true as const, orderNumber };
}
