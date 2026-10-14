import Link from "next/link";
import { productImageUrl } from "@/lib/supabase/storage";
import { formatRs } from "@/lib/format";

export interface CardProduct {
  id: string;
  title: string;
  slug: string;
  regular_price: number;
  sale_price: number | null;
  product_images: { storage_path: string }[];
}

/** Product card (PRD section 25): image, name, price, discount. */
export function ProductCard({
  slug,
  product,
  brandColor,
}: {
  slug: string;
  product: CardProduct;
  brandColor: string;
}) {
  const img = product.product_images?.[0]?.storage_path;
  const discount =
    product.sale_price != null
      ? Math.round((1 - product.sale_price / product.regular_price) * 100)
      : 0;

  return (
    <Link
      href={`/s/${slug}/products/${product.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(6,95,70,0.10)]"
    >
      <div className="relative aspect-square overflow-hidden bg-canvas">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImageUrl(img, 500)}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl font-bold"
            style={{ color: `${brandColor}55` }}
          >
            {product.title.charAt(0).toUpperCase()}
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-ink">{product.title}</p>
        <p className="mt-1 text-sm font-bold" style={{ color: brandColor }}>
          {formatRs(product.sale_price ?? product.regular_price)}
          {product.sale_price != null && (
            <span className="ml-2 text-xs font-normal text-muted line-through">
              {formatRs(product.regular_price)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
