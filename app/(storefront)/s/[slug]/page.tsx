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

/** Dawn-style storefront home: image banner, featured products, collections. */
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
  const brand = s.brand_color || "#121212";

  const { data: settings } = await supabase
    .from("store_settings")
    .select("hero_title, hero_subtitle")
    .eq("store_id", s.id)
    .maybeSingle();
  const st = (settings ?? {}) as { hero_title?: string; hero_subtitle?: string };

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("store_id", s.id)
    .order("sort_order")
    .limit(6);

  const base = () =>
    supabase
      .from("products")
      .select("id, title, slug, regular_price, sale_price, product_images(storage_path)")
      .eq("store_id", s.id)
      .eq("status", "active")
      .is("deleted_at", null);

  const { data: featured } = await base().eq("is_featured", true).limit(8);
  const { data: newest } = await base().order("created_at", { ascending: false }).limit(4);
  const showFeatured = featured && featured.length > 0 ? featured : newest;

  const section = (title: string, items: CardProduct[] | null) => {
    if (!items || items.length === 0) return null;
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="text-center text-2xl font-normal tracking-tight text-neutral-900 sm:text-3xl">
          {title}
        </h2>
        <div className="mx-auto mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} slug={slug} product={p} brandColor={brand} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href={`/s/${slug}/products`}
            className="inline-block rounded px-10 py-3.5 text-[15px] font-medium text-white"
            style={{ backgroundColor: brand }}
          >
            View all
          </Link>
        </div>
      </section>
    );
  };

  return (
    <div>
      {/* Dawn image banner */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-neutral-900 sm:min-h-[520px]">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(135deg, ${brand} 0%, #1c1c1c 100%)`,
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-4xl font-normal tracking-tight text-white sm:text-6xl">
            {st.hero_title || s.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            {st.hero_subtitle || "Quality products delivered to your doorstep. Cash on delivery available across Pakistan."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/s/${slug}/products`}
              className="rounded bg-white px-10 py-3.5 text-[15px] font-medium text-neutral-900 transition hover:bg-neutral-100"
            >
              Shop now
            </Link>
          </div>
        </div>
      </section>

      {/* Collection list */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <h2 className="text-center text-2xl font-normal tracking-tight text-neutral-900 sm:text-3xl">
            Shop by category
          </h2>
          <div className="mx-auto mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(categories as { id: string; name: string; slug: string }[]).map((c) => (
              <Link
                key={c.id}
                href={`/s/${slug}/products?category=${encodeURIComponent(c.slug)}`}
                className="group relative overflow-hidden rounded-lg bg-neutral-100 py-10 text-center transition hover:bg-neutral-200"
              >
                <span className="text-lg font-medium text-neutral-900">{c.name}</span>
                <span className="mt-1 block text-sm text-neutral-500 group-hover:underline underline-offset-4">
                  Shop now
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {section("Featured products", showFeatured as CardProduct[] | null)}

      {/* Image with text */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:grid-cols-2 sm:px-6">
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-neutral-200 text-6xl font-semibold text-neutral-400">
            {s.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-normal tracking-tight text-neutral-900 sm:text-3xl">
              Why shop with {s.name}?
            </h2>
            <ul className="mt-4 space-y-3 text-[15px] text-neutral-600">
              <li className="flex gap-3"><span style={{ color: brand }}>✓</span> Cash on delivery, anywhere in Pakistan</li>
              <li className="flex gap-3"><span style={{ color: brand }}>✓</span> Order on WhatsApp in one tap</li>
              <li className="flex gap-3"><span style={{ color: brand }}>✓</span> 7-day easy exchange</li>
            </ul>
            <Link
              href={`/s/${slug}/products`}
              className="mt-6 inline-block rounded px-10 py-3.5 text-[15px] font-medium text-white"
              style={{ backgroundColor: brand }}
            >
              Shop now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
