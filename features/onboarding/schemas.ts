import { z } from "zod";

const phoneRegex = /^0?3\d{9}$/;
const slugRegex = /^[a-z0-9-]{3,30}$/;

export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  category: z.string().min(1, "Choose a category"),
  whatsapp: z.string().trim().regex(phoneRegex, "Enter a valid WhatsApp number (03XX-XXXXXXX)"),
  instagram: z.string().trim().max(30).regex(/^[a-zA-Z0-9._]*$/, "Letters, numbers, . and _ only").optional().default(""),
  storeName: z.string().trim().min(2, "Store name is required"),
  slug: z.string().trim().toLowerCase().regex(slugRegex, "3–30 chars: a–z, 0–9, hyphens"),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pick a brand color"),
  productName: z.string().trim().min(2, "Product name is required"),
  productPrice: z.coerce.number().int().positive("Price must be positive").max(100_000_000),
  productStock: z.coerce.number().int().min(0, "Stock can't be negative").max(1_000_000),
  codEnabled: z.boolean(),
  bankEnabled: z.boolean(),
  bankDetails: z.string().trim().max(500),
  raastEnabled: z.boolean(),
  raastId: z.string().trim().max(100),
  easypaisaEnabled: z.boolean(),
  easypaisaDetails: z.string().trim().max(500),
  jazzcashEnabled: z.boolean(),
  jazzcashDetails: z.string().trim().max(500),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const CATEGORIES = [
  "Fashion & Clothing",
  "Beauty & Cosmetics",
  "Electronics",
  "Food & Bakery",
  "Handmade & Crafts",
  "Home & Living",
  "Health & Fitness",
  "Other",
] as const;

export const BRAND_COLORS = [
  "#065F46", // emerald (default)
  "#0F766E", // teal
  "#4338CA", // indigo
  "#BE123C", // rose
  "#B45309", // amber
  "#334155", // slate
] as const;

/** Subdomains we never hand out. */
export const RESERVED_SLUGS = new Set([
  "www", "app", "admin", "api", "mail", "blog", "help", "support",
  "sellora", "demo", "test", "staging", "dev",
]);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}
