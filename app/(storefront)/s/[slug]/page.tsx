import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard, type CardProduct } from "@/features/storefront/product-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  const name = (store as { name: string } | null)?.name ?? "Store";
  return {
    title: `${name} — Online Store`,
    description: `Shop ${name} online. Cash on delivery available across Pakistan.`,
    openGraph: { title: name, description: `Shop ${name} online.` },
  };
}

/** Storefront home: hero, categories, featured, new arrivals (PRD section 23). */
export default async function StoreHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

  const { data: settings } = await supabase
    .from("store_settings")
    .select("announcement_bar, hero_title, hero_subtitle")
    .eq("store_id", s.id)
    .maybeSingle();
  const st = (settings ?? {}) as { announcement_bar?: string; hero_title?: string; hero_subtitle?: string };

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("store_id", s.id)
    .order("sort_order")
    .limit(12);

  const base = () =>
    supabase
      .from("products")
      .select("id, title, slug, regular_price, sale_price, product_images(storage_path)")
      .eq("store_id", s.id)
      .eq("status", "active")
      .is("deleted_at", null);

  const { data: featured } = await base().eq("is_featured", true).limit(8);
  const { data: newest } = await base().order("created_at", { ascending: false }).limit(8);
  const { data: onSale } = await base().not("sale_price", "is", null).limit(8);

  const section = (title: string, items: CardProduct[] | null) => {
    if (!items || items.length === 0) return null;
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <Link href={`/s/${slug}/products`} className="text-sm font-semibold hover:underline" style={{ color: brand }}>
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} slug={slug} product={p} brandColor={brand} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div>
      {st.announcement_bar && (
        <div className="px-4 py-2 text-center text-xs font-medium text-white" style={{ backgroundColor: `${brand}dd` }}>
          {st.announcement_bar}
        </div>
      )}

      {/* Hero */}
      <section className="px-4 py-12 text-center text-white sm:py-16" style={{ backgroundColor: brand }}>
        <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          {st.hero_title || `Welcome to ${s.name}`}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/85 sm:text-base">
          {st.hero_subtitle || "Quality products delivered to your doorstep. Cash on delivery available."}
        </p>
        <Link
          href={`/s/${slug}/products`}
          className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold transition hover:brightness-95"
          style={{ color: brand }}
        >
          Shop now
        </Link>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Shop by category</h2>
          <div className="flex flex-wrap gap-2" style={{ "--brand": brand } as React.CSSProperties}>
            {(categories as { id: string; name: string; slug: string }[]).map((c) => (
              <Link
                key={c.id}
                href={`/s/${slug}/products?category=${c.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-transparent hover:bg-[var(--brand)] hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {section("Featured products", featured as CardProduct[])}
      {section("New arrivals", newest as CardProduct[])}
      {section("On sale", onSale as CardProduct[])}

      {!featured?.length && !newest?.length && (
        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="font-semibold text-ink">New products coming soon</p>
          <p className="mt-1 text-sm text-muted">This store is just getting started — check back shortly.</p>
        </section>
      )}
    </div>
  );
}
