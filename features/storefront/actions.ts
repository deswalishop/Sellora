"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const phoneRegex = /^0?3\d{9}$/;

const checkoutSchema = z.object({
  slug: z.string(),
  fullName: z.string().trim().min(2, "Please enter your full name"),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid mobile number (03XX-XXXXXXX)"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  city: z.string().trim().min(2, "Please enter your city"),
  area: z.string().trim().min(2, "Please enter your area"),
  address: z.string().trim().min(5, "Please enter your complete address"),
  paymentMethod: z.enum(["cod", "bank_transfer", "raast", "easypaisa", "jazzcash"]),
  notes: z.string().max(500).optional().default(""),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable(),
        qty: z.number().int().positive().max(100),
      })
    )
    .min(1, "Your cart is empty")
    .max(50),
});

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; total: number }
  | { ok: false; error: string };

/**
 * Places an order: validates everything server-side (never trusts the
 * client's prices), creates customer/order/items, decrements stock,
 * notifies the seller. MVP: stock decrements on placement (Phase 2 makes
 * the decrement point configurable).
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const d = parsed.data;
  const db = await createClient();

  // Resolve store from slug (public read). Everything else happens inside the
  // secure place_order RPC, because RLS forbids anonymous writes to
  // customers/orders/order_items.
  const { data: storeRow } = await db
    .from("stores")
    .select("id")
    .eq("slug", d.slug)
    .eq("status", "active")
    .maybeSingle();
  if (!storeRow) return { ok: false, error: "Store not found." };
  const storeId = (storeRow as { id: string }).id;

  const { data, error } = await db.rpc("place_order", {
    p_store_id: storeId,
    p_full_name: d.fullName,
    p_phone: d.phone,
    p_email: d.email || null,
    p_city: d.city,
    p_area: d.area,
    p_address: d.address,
    p_payment_method: d.paymentMethod,
    p_notes: d.notes || "",
    p_items: d.items.map((i) => ({
      product_id: i.productId,
      variant_id: i.variantId,
      qty: i.qty,
    })),
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("PRODUCT_UNAVAILABLE") || msg.includes("VARIANT_UNAVAILABLE")) {
      return { ok: false, error: "A product in your cart is no longer available." };
    }
    if (msg.includes("INSUFFICIENT_STOCK")) {
      const title = msg.split("INSUFFICIENT_STOCK:")[1]?.trim();
      return {
        ok: false,
        error: title
          ? `"${title}" just went out of stock. Please update your cart.`
          : "Some items just went out of stock. Please update your cart.",
      };
    }
    if (msg.includes("PAYMENT_METHOD")) {
      return { ok: false, error: "This payment method is not available." };
    }
    if (msg.includes("STORE_")) {
      return { ok: false, error: "Store not found." };
    }
    if (msg.includes("CART_INVALID")) {
      return { ok: false, error: "Your cart is invalid. Please try again." };
    }
    return { ok: false, error: "Could not place your order. Please try again." };
  }

  const result = data as { order_number: string; total: number } | null;
  if (!result?.order_number) {
    return { ok: false, error: "Could not place your order. Please try again." };
  }
  return { ok: true, orderNumber: result.order_number, total: result.total };
}

const trackSchema = z.object({
  slug: z.string(),
  orderNumber: z.string().trim().min(1, "Enter your order number"),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid mobile number"),
});

export type TrackOrderResult =
  | { ok: true; order: unknown }
  | { ok: false; error: string };

/** Public order tracking via the security-definer lookup function. */
export async function trackOrder(input: unknown): Promise<TrackOrderResult> {
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your input." };
  }
  const db = await createClient();
  const { data, error } = await db.rpc("lookup_order", {
    p_slug: parsed.data.slug,
    p_order_number: parsed.data.orderNumber.toUpperCase(),
    p_phone: parsed.data.phone,
  });
  const found = (data as { found?: boolean } | null)?.found;
  if (error || !found) {
    return { ok: false, error: "Order not found. Check the order number and phone number." };
  }
  return { ok: true, order: data };
}
