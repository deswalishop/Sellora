import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard, type CardProduct } from "@/features/storefront/product-card";

/** Product listing with search + category filter. */
export default async function ProductsListing({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { slug } = await params;
  const { q = "", category = "" } = await searchParams;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, brand_color")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!store) notFound();
  const s = store as { id: string; name: string; brand_color: string };
  const brand = s.brand_color || "#065F46";

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("store_id", s.id)
    .order("sort_order");

  let query = supabase
    .from("products")
    .select("id, title, slug, regular_price, sale_price, product_images(storage_path)")
    .eq("store_id", s.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
  if (category) {
    const cat = ((categories ?? []) as { id: string; slug: string }[]).find((c) => c.slug === category);
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data: products } = await query;
  const items = (products ?? []) as CardProduct[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">
        {q ? `Results for "${q}"` : category ? "Products" : "All products"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {items.length} product{items.length === 1 ? "" : "s"}
      </p>

      {categories && (categories as unknown[]).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/s/${slug}/products${q ? `?q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !category ? "text-white" : "border border-slate-200 bg-white text-ink"
            }`}
            style={!category ? { backgroundColor: brand } : undefined}
          >
            All
          </a>
          {((categories ?? []) as { id: string; name: string; slug: string }[]).map((c) => (
            <a
              key={c.id}
              href={`/s/${slug}/products?category=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === c.slug ? "text-white" : "border border-slate-200 bg-white text-ink"
              }`}
              style={category === c.slug ? { backgroundColor: brand } : undefined}
            >
              {c.name}
            </a>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <p className="font-semibold text-ink">No products found</p>
          <p className="mt-1 text-sm text-muted">Try a different search or category.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} slug={slug} product={p} brandColor={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
