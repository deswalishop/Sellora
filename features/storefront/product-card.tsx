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

/**
 * Dawn-style product card: borderless, image with soft backdrop, small
 * badges, title + price underneath.
 */
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
  const onSale = product.sale_price != null && product.sale_price < product.regular_price;

  return (
    <Link href={`/s/${slug}/products/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-neutral-100">
        <div className="aspect-[4/5] w-full">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={productImageUrl(img, 600)}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-5xl font-semibold text-neutral-300"
            >
              {product.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {onSale && (
          <span className="absolute left-3 top-3 rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Sale
          </span>
        )}
      </div>
      <div className="px-1 pt-3">
        <p className="text-[13px] text-neutral-500">{/* vendor slot */}</p>
        <h3 className="text-[15px] font-normal leading-snug text-neutral-900 group-hover:underline underline-offset-4">
          {product.title}
        </h3>
        <p className="mt-1 flex items-baseline gap-2 text-[15px]">
          <span className={onSale ? "font-medium text-red-700" : "text-neutral-900"}>
            {formatRs(product.sale_price ?? product.regular_price)}
          </span>
          {onSale && (
            <span className="text-[13px] text-neutral-500 line-through">
              {formatRs(product.regular_price)}
            </span>
          )}
        </p>
      </div>
      {/* keep brand color available for quick-add accents via CSS var */}
      <span className="hidden" style={{ color: brandColor }} aria-hidden="true" />
    </Link>
  );
}
