import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard, type CardProduct } from "@/features/storefront/product-card";

/** Dawn-style collection page: title, product count, filter pills, grid. */
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
  const brand = s.brand_color || "#121212";

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

  const activeCat = ((categories ?? []) as { id: string; name: string; slug: string }[]).find(
    (c) => c.slug === category
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-normal tracking-tight text-neutral-900 sm:text-4xl">
        {q ? `Results for "${q}"` : activeCat ? activeCat.name : "Products"}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        {items.length} product{items.length === 1 ? "" : "s"}
      </p>

      {categories && (categories as unknown[]).length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 border-y border-neutral-200 py-4">
          <Link
            href={`/s/${slug}/products${q ? `?q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-4 py-2 text-sm transition ${
              !category
                ? "font-medium text-white"
                : "border border-neutral-300 text-neutral-700 hover:border-neutral-900"
            }`}
            style={!category ? { backgroundColor: brand } : undefined}
          >
            All
          </Link>
          {((categories ?? []) as { id: string; name: string; slug: string }[]).map((c) => (
            <Link
              key={c.id}
              href={`/s/${slug}/products?category=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`rounded-full px-4 py-2 text-sm transition ${
                category === c.slug
                  ? "font-medium text-white"
                  : "border border-neutral-300 text-neutral-700 hover:border-neutral-900"
              }`}
              style={category === c.slug ? { backgroundColor: brand } : undefined}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8 py-16 text-center">
          <p className="text-lg text-neutral-900">No products found</p>
          <p className="mt-1 text-sm text-neutral-500">
            Try checking your spelling or using more general words.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} slug={slug} product={p} brandColor={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
