import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/features/products/product-form";
import { VariantEditor } from "@/features/products/variant-editor";
import { ImageUploader, type ProductImage } from "@/features/products/image-uploader";
import type { ProductInput, VariantInput } from "@/features/products/schemas";

/** Edit product: details + images + variants. */
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!store) redirect("/onboarding");
  const storeId = (store as { id: string }).id;

  const { data: product } = await supabase
    .from("products")
    .select("id, store_id, title, description, regular_price, sale_price, sku, stock, weight_grams, brand, status, is_featured, categories(name), product_images(id, storage_path, sort_order), product_variants(id, options, price_override, stock, sku)")
    .eq("id", id)
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) notFound();
  // cost_price is owner-only (0008): fetched via ownership-checked RPC.
  const { data: costPrice } = await supabase.rpc("get_product_cost", { p_product_id: id });
  const p = product as unknown as Record<string, unknown> & {
    categories: { name: string } | null;
    product_images: ProductImage[];
    product_variants: { id: string; options: { option1?: string; option2?: string }; price_override: number | null; stock: number; sku: string | null }[];
  };

  const { data: cats } = await supabase
    .from("categories")
    .select("name")
    .eq("store_id", storeId)
    .order("name");
  const categories = ((cats ?? []) as { name: string }[]).map((c) => c.name);

  const initial: Partial<ProductInput> = {
    title: p.title as string,
    description: (p.description as string) ?? "",
    categoryName: p.categories?.name ?? "",
    regularPrice: p.regular_price as number,
    salePrice: (p.sale_price as number | null) ?? null,
    costPrice: (costPrice as number | null) ?? null,
    sku: (p.sku as string) ?? "",
    stock: p.stock as number,
    weightGrams: (p.weight_grams as number | null) ?? null,
    brand: (p.brand as string) ?? "",
    status: p.status as "active" | "hidden" | "archived",
    isFeatured: Boolean(p.is_featured),
  };

  const variants: VariantInput[] = (p.product_variants ?? []).map((v) => ({
    id: v.id,
    option1: v.options?.option1 ?? "",
    option2: v.options?.option2 ?? "",
    priceOverride: v.price_override,
    stock: v.stock,
    sku: v.sku ?? "",
  }));

  const images = [...(p.product_images ?? [])].sort(
    (a, b) => (a as unknown as { sort_order: number }).sort_order - (b as unknown as { sort_order: number }).sort_order
  ) as ProductImage[];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/products" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Edit product</h1>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-neutral-900">Details</h2>
        <ProductForm productId={id} initial={initial} categories={categories} />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-neutral-900">Images</h2>
        <p className="mb-4 text-sm text-neutral-500">Showcase your product — first image is the main one.</p>
        <ImageUploader productId={id} images={images} />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-neutral-900">Variants</h2>
        <p className="mb-4 text-sm text-neutral-500">Sizes, colors or any custom options — each with its own price and stock.</p>
        <VariantEditor productId={id} initial={variants} />
      </Card>
    </div>
  );
}
