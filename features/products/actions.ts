"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/features/onboarding/schemas";
import {
  productSchema,
  variantSchema,
  MAX_IMAGES_PER_PRODUCT,
  MAX_IMAGE_BYTES,
  type ProductInput,
  type VariantInput,
} from "./schemas";

type Db = Awaited<ReturnType<typeof createClient>>;

export interface ProductResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** The signed-in seller's store (MVP: one store per account). */
async function getOwnStore(db: Db) {
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: store } = await db
    .from("stores")
    .select("id, slug")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!store) redirect("/onboarding");
  return store as { id: string; slug: string };
}

/** Server-side plan enforcement (PRD section 40): Free = 20 products, etc. */
async function checkProductLimit(db: Db, storeId: string): Promise<string | null> {
  const { data: sub } = await db
    .from("subscriptions")
    .select("plans(limits)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const limits = (sub as { plans?: { limits?: { products?: number } } } | null)?.plans?.limits;
  const max = limits?.products ?? 20;
  if (max === -1) return null; // unlimited
  const { count } = await db
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .neq("status", "archived");
  if ((count ?? 0) >= max) {
    return `Your plan allows ${max} products. Upgrade to add more.`;
  }
  return null;
}

async function uniqueProductSlug(db: Db, storeId: string, title: string): Promise<string> {
  const base = slugify(title) || "product";
  let slug = base;
  for (let i = 1; i <= 6; i++) {
    const { data } = await db
      .from("products")
      .select("id")
      .eq("store_id", storeId)
      .eq("slug", slug)
      .limit(1);
    if (!data || data.length === 0) return slug;
    slug = `${base}-${i + 1}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function findOrCreateCategory(db: Db, storeId: string, name: string): Promise<string | null> {
  const clean = name.trim();
  if (!clean) return null;
  const { data: existing } = await db
    .from("categories")
    .select("id")
    .eq("store_id", storeId)
    .ilike("name", clean)
    .limit(1)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;
  const { data: created } = await db
    .from("categories")
    .insert({ store_id: storeId, name: clean, slug: slugify(clean) || "category" })
    .select("id")
    .single();
  return (created as { id: string } | null)?.id ?? null;
}

function firstIssue(parsed: { success: false; error: { issues: { message?: string }[] } }) {
  return parsed.error.issues[0]?.message ?? "Please check your input.";
}

export async function createProduct(input: ProductInput): Promise<ProductResult> {
  const db = await createClient();
  const store = await getOwnStore(db);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed) };
  const d = parsed.data;

  const limitError = await checkProductLimit(db, store.id);
  if (limitError) return { ok: false, error: limitError };
  if (d.salePrice != null && d.salePrice >= d.regularPrice) {
    return { ok: false, error: "Sale price must be lower than the regular price." };
  }

  const categoryId = await findOrCreateCategory(db, store.id, d.categoryName || "");
  const slug = await uniqueProductSlug(db, store.id, d.title);

  const { data: product, error } = await db
    .from("products")
    .insert({
      store_id: store.id,
      category_id: categoryId,
      title: d.title,
      slug,
      description: d.description || null,
      regular_price: d.regularPrice,
      sale_price: d.salePrice ?? null,
      cost_price: d.costPrice ?? null,
      sku: d.sku || null,
      stock: d.stock,
      weight_grams: d.weightGrams ?? null,
      brand: d.brand || null,
      status: d.status,
      is_featured: d.isFeatured,
    })
    .select("id")
    .single();

  if (error || !product) return { ok: false, error: "Could not create the product." };
  revalidatePath("/products");
  return { ok: true, id: (product as { id: string }).id };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductResult> {
  const db = await createClient();
  const store = await getOwnStore(db);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed) };
  const d = parsed.data;
  if (d.salePrice != null && d.salePrice >= d.regularPrice) {
    return { ok: false, error: "Sale price must be lower than the regular price." };
  }

  const categoryId = await findOrCreateCategory(db, store.id, d.categoryName || "");
  const { error } = await db
    .from("products")
    .update({
      category_id: categoryId,
      title: d.title,
      description: d.description || null,
      regular_price: d.regularPrice,
      sale_price: d.salePrice ?? null,
      cost_price: d.costPrice ?? null,
      sku: d.sku || null,
      stock: d.stock,
      weight_grams: d.weightGrams ?? null,
      brand: d.brand || null,
      status: d.status,
      is_featured: d.isFeatured,
    })
    .eq("id", id)
    .eq("store_id", store.id);

  if (error) return { ok: false, error: "Could not save the product." };
  revalidatePath("/products");
  return { ok: true, id };
}

export async function updateProductStatus(
  id: string,
  status: "active" | "hidden" | "archived"
): Promise<ProductResult> {
  const db = await createClient();
  const store = await getOwnStore(db);
  const { error } = await db
    .from("products")
    .update({ status })
    .eq("id", id)
    .eq("store_id", store.id);
  if (error) return { ok: false, error: "Could not update status." };
  revalidatePath("/products");
  return { ok: true, id };
}

/** Soft delete — the row stays for order history integrity. */
export async function deleteProduct(id: string): Promise<ProductResult> {
  const db = await createClient();
  const store = await getOwnStore(db);
  const { error } = await db
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", store.id);
  if (error) return { ok: false, error: "Could not delete the product." };
  revalidatePath("/products");
  return { ok: true, id };
}

export async function duplicateProduct(id: string): Promise<ProductResult> {
  const db = await createClient();
  const store = await getOwnStore(db);

  const limitError = await checkProductLimit(db, store.id);
  if (limitError) return { ok: false, error: limitError };

  const { data: src } = await db
    .from("products")
    .select("category_id, title, description, regular_price, sale_price, weight_grams, brand")
    .eq("id", id)
    .eq("store_id", store.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!src) return { ok: false, error: "Product not found." };
  const source = src as Record<string, unknown>;
  // cost_price is owner-only (0008): fetched via ownership-checked RPC.
  const { data: srcCost } = await db.rpc("get_product_cost", { p_product_id: id });

  const slug = await uniqueProductSlug(db, store.id, `${source.title} copy`);
  const { data: copy, error } = await db
    .from("products")
    .insert({
      store_id: store.id,
      category_id: source.category_id,
      title: `${source.title} (Copy)`,
      slug,
      description: source.description,
      regular_price: source.regular_price,
      sale_price: source.sale_price,
      cost_price: (srcCost as number | null) ?? null,
      sku: null,
      stock: 0,
      weight_grams: source.weight_grams,
      brand: source.brand,
      status: "hidden",
      is_featured: false,
    })
    .select("id")
    .single();
  if (error || !copy) return { ok: false, error: "Could not duplicate the product." };
  const newId = (copy as { id: string }).id;

  // Copy variants (images are copied too — same storage files, new rows)
  const { data: variants } = await db.from("product_variants").select("*").eq("product_id", id);
  if (variants && (variants as unknown[]).length > 0) {
    await db.from("product_variants").insert(
      (variants as Record<string, unknown>[]).map((v) => ({
        product_id: newId,
        name: v.name,
        options: v.options,
        price_override: v.price_override,
        stock: 0,
        sku: null,
      }))
    );
  }
  const { data: images } = await db
    .from("product_images")
    .select("storage_path, sort_order")
    .eq("product_id", id);
  if (images && (images as unknown[]).length > 0) {
    await db.from("product_images").insert(
      (images as Record<string, unknown>[]).map((img) => ({
        product_id: newId,
        storage_path: img.storage_path,
        sort_order: img.sort_order,
      }))
    );
  }

  revalidatePath("/products");
  return { ok: true, id: newId };
}

/** Replace all variants of a product (simplest correct sync). */
export async function saveVariants(
  productId: string,
  variants: VariantInput[]
): Promise<ProductResult> {
  const db = await createClient();
  const store = await getOwnStore(db);

  const { data: product } = await db
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", store.id)
    .limit(1)
    .maybeSingle();
  if (!product) return { ok: false, error: "Product not found." };

  const rows: Record<string, unknown>[] = [];
  for (const v of variants) {
    const parsed = variantSchema.safeParse(v);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed) };
    const d = parsed.data;
    const label = [d.option1, d.option2].filter(Boolean).join(" / ") || "Variant";
    rows.push({
      product_id: productId,
      name: label,
      options: { option1: d.option1 || null, option2: d.option2 || null },
      price_override: d.priceOverride ?? null,
      stock: d.stock,
      sku: d.sku || null,
    });
  }

  await db.from("product_variants").delete().eq("product_id", productId);
  if (rows.length > 0) {
    const { error } = await db.from("product_variants").insert(rows);
    if (error) return { ok: false, error: "Could not save variants." };
  }
  revalidatePath("/products");
  return { ok: true, id: productId };
}

export async function uploadProductImage(
  productId: string,
  formData: FormData
): Promise<ProductResult> {
  const db = await createClient();
  const store = await getOwnStore(db);

  const { data: product } = await db
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", store.id)
    .limit(1)
    .maybeSingle();
  if (!product) return { ok: false, error: "Product not found." };

  const { count } = await db
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if ((count ?? 0) >= MAX_IMAGES_PER_PRODUCT) {
    return { ok: false, error: `Maximum ${MAX_IMAGES_PER_PRODUCT} images per product.` };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image file." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Only image files are allowed." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Image must be under 5MB." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${store.id}/${productId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await db.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: "Upload failed. Try again." };

  const { error: rowError } = await db.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    sort_order: count ?? 0,
  });
  if (rowError) {
    await db.storage.from("product-images").remove([path]);
    return { ok: false, error: "Could not save the image." };
  }
  revalidatePath("/products");
  return { ok: true, id: productId };
}

export async function deleteProductImage(imageId: string): Promise<ProductResult> {
  const db = await createClient();
  const store = await getOwnStore(db);

  const { data: img } = await db
    .from("product_images")
    .select("id, storage_path, product_id, products!inner(store_id)")
    .eq("id", imageId)
    .limit(1)
    .maybeSingle();
  const row = img as { id: string; storage_path: string; product_id: string } | null;
  if (!row) return { ok: false, error: "Image not found." };

  // Verify the image belongs to this seller's store (RLS would block anyway; explicit is clearer)
  const { data: product } = await db
    .from("products")
    .select("id")
    .eq("id", row.product_id)
    .eq("store_id", store.id)
    .limit(1)
    .maybeSingle();
  if (!product) return { ok: false, error: "Image not found." };

  await db.storage.from("product-images").remove([row.storage_path]);
  await db.from("product_images").delete().eq("id", imageId);
  revalidatePath("/products");
  return { ok: true };
}
