import { z } from "zod";

export const productSchema = z.object({
  title: z.string().trim().min(2, "Product name is required").max(200),
  description: z.string().max(5000).optional().default(""),
  categoryName: z.string().trim().max(100).optional().default(""),
  regularPrice: z.coerce.number().int().positive("Price must be positive").max(100_000_000),
  salePrice: z.coerce.number().int().positive().max(100_000_000).optional().nullable(),
  costPrice: z.coerce.number().int().min(0).max(100_000_000).optional().nullable(),
  sku: z.string().trim().max(50).optional().default(""),
  stock: z.coerce.number().int().min(0, "Stock can't be negative").max(1_000_000).default(0),
  weightGrams: z.coerce.number().int().min(0).max(100_000_000).optional().nullable(),
  brand: z.string().trim().max(100).optional().default(""),
  status: z.enum(["active", "hidden", "archived"]).default("active"),
  isFeatured: z.boolean().default(false),
});

export type ProductInput = z.infer<typeof productSchema>;

/** One variant row: up to two free-text options (Size, Color, …). */
export const variantSchema = z.object({
  id: z.string().optional(),
  option1: z.string().trim().max(50).default(""),
  option2: z.string().trim().max(50).default(""),
  priceOverride: z.coerce.number().int().positive().max(100_000_000).optional().nullable(),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  sku: z.string().trim().max(50).optional().default(""),
});

export type VariantInput = z.infer<typeof variantSchema>;

export const MAX_IMAGES_PER_PRODUCT = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB (Decision D8)
