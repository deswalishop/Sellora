/**
 * Shared TypeScript types. Phase 1 will extend these from the real
 * Supabase schema (via `supabase gen types`).
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export type PaymentMethod =
  | "cod"
  | "bank_transfer"
  | "raast"
  | "easypaisa"
  | "jazzcash";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type PlanSlug = "free" | "starter" | "business" | "pro";

export interface PlanLimits {
  /** -1 = unlimited */
  products: number;
  staff: number;
  ai_credits: number;
  themes: number;
  custom_domain: boolean;
}
