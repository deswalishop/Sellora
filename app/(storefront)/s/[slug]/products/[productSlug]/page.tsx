import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductBuyer, type DetailVariant } from "@/features/storefront/product-buyer";

async function getData(slug: string, productSlug: string) {
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, brand_color")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!store) return null;
  const s = store as { id: string; name: string; brand_color: string };

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, title, description, regular_price, sale_price, stock, product_images(storage_path, sort_order), product_variants(id, name, price_override, stock)"
    )
    .eq("store_id", s.id)
    .eq("slug", productSlug)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) return null;

  const { data: settings } = await supabase
    .from("store_settings")
    .select("whatsapp_number, cod_enabled")
    .eq("store_id", s.id)
    .maybeSingle();

  return {
    store: s,
    product: product as unknown as {
      id: string;
      title: string;
      description: string | null;
      regular_price: number;
      sale_price: number | null;
      stock: number;
      product_images: { storage_path: string; sort_order: number }[];
      product_variants: DetailVariant[];
    },
    settings: (settings ?? {}) as { whatsapp_number?: string | null; cod_enabled?: boolean },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const data = await getData(slug, productSlug);
  if (!data) return { title: "Product not found" };
  return {
    title: `${data.product.title} — ${data.store.name}`,
    description: data.product.description?.slice(0, 160) ?? `Buy ${data.product.title} online.`,
    openGraph: {
      title: data.product.title,
      description: data.product.description?.slice(0, 160) ?? "",
    },
  };
}

/** Product detail page (PRD section 26). */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const data = await getData(slug, productSlug);
  if (!data) notFound();

  const brand = data.store.brand_color || "#065F46";
  const images = [...(data.product.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.storage_path);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ProductBuyer
        slug={slug}
        productId={data.product.id}
        title={data.product.title}
        regularPrice={data.product.regular_price}
        salePrice={data.product.sale_price}
        stock={data.product.stock}
        images={images}
        variants={data.product.product_variants ?? []}
        brandColor={brand}
        whatsappNumber={data.settings.whatsapp_number ?? null}
        codAvailable={Boolean(data.settings.cod_enabled)}
      />
      {data.product.description && (
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-ink">Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {data.product.description}
          </p>
        </div>
      )}
    </div>
  );
}
