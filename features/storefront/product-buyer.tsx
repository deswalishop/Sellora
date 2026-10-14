"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { productImageUrl } from "@/lib/supabase/storage";
import { formatRs } from "@/lib/format";
import { useCart } from "./cart-context";
import { ShareButtons } from "./social-buttons";

export interface DetailVariant {
  id: string;
  name: string;
  price_override: number | null;
  stock: number;
}

/** Interactive buyer panel: gallery, variants, quantity, cart actions. */
export function ProductBuyer({
  slug,
  productId,
  title,
  regularPrice,
  salePrice,
  stock,
  images,
  variants,
  brandColor,
  whatsappNumber,
  codAvailable,
}: {
  slug: string;
  productId: string;
  title: string;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  images: string[];
  variants: DetailVariant[];
  brandColor: string;
  whatsappNumber: string | null;
  codAvailable: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [imgIdx, setImgIdx] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(variants.length > 0 ? null : null);
  const [qty, setQty] = useState(1);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const price = variant?.price_override ?? salePrice ?? regularPrice;
  const available = variant ? variant.stock : stock;
  const canBuy = available > 0 && (variants.length === 0 || variant !== null);

  const waText = encodeURIComponent(
    `Assalam-o-Alaikum! I want to order:\n${title}${variant ? ` (${variant.name})` : ""}\nQty: ${qty}\nPrice: ${formatRs(price * qty)}`
  );
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${waText}`
    : null;

  function addToCart() {
    if (!canBuy) return;
    add(
      {
        productId,
        variantId,
        title,
        variantName: variant?.name ?? null,
        price,
        image: images[0] ?? null,
      },
      qty
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={productImageUrl(images[imgIdx], 900)}
              alt={title}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div
              className="flex aspect-square w-full items-center justify-center text-7xl font-bold"
              style={{ color: `${brandColor}44` }}
            >
              {title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((p, i) => (
              <button
                key={p}
                onClick={() => setImgIdx(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  i === imgIdx ? "border-transparent" : "border-slate-200 opacity-70"
                }`}
                style={i === imgIdx ? { borderColor: brandColor } : undefined}
                aria-label={`View image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productImageUrl(p, 160)} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        <div className="mt-3 flex items-baseline gap-3">
          <p className="text-2xl font-bold" style={{ color: brandColor }}>
            {formatRs(price)}
          </p>
          {salePrice != null && (
            <p className="text-lg text-muted line-through">{formatRs(regularPrice)}</p>
          )}
        </div>
        <p className={`mt-2 text-sm font-medium ${available > 0 ? "text-emerald-700" : "text-red-600"}`}>
          {available > 0 ? (available <= 5 ? `Only ${available} left in stock` : "In stock") : "Out of stock"}
        </p>
        {codAvailable && (
          <span className="mt-3 inline-block rounded-full bg-brand-mint px-3 py-1 text-xs font-semibold text-emerald-950">
            Cash on Delivery available
          </span>
        )}

        {variants.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-ink">Choose an option</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  disabled={v.stock <= 0}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
                    variantId === v.id ? "text-white" : "border-slate-300 bg-white text-ink"
                  }`}
                  style={variantId === v.id ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
                >
                  {v.name}
                </button>
              ))}
            </div>
            {variants.length > 0 && !variant && (
              <p className="mt-2 text-xs text-muted">Please choose an option first.</p>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <p className="text-sm font-medium text-ink">Quantity</p>
          <div className="flex items-center rounded-full border border-slate-300">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-lg font-bold text-muted hover:text-ink"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(Math.max(available, 1), q + 1))}
              className="flex h-10 w-10 items-center justify-center text-lg font-bold text-muted hover:text-ink"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={addToCart}
            disabled={!canBuy}
            className="h-12 w-full rounded-xl font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            style={{ backgroundColor: brandColor }}
          >
            Add to Cart
          </button>
          <button
            onClick={() => {
              addToCart();
              router.push(`/s/${slug}/cart`);
            }}
            disabled={!canBuy}
            className="h-12 w-full rounded-xl border-2 font-semibold transition disabled:opacity-40"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            Buy Now
          </button>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#25D366] font-semibold text-white transition hover:brightness-95"
            >
              Order on WhatsApp
            </a>
          )}
        </div>

        <ShareButtons
          title={title}
          url={typeof window !== "undefined" ? window.location.href : ""}
          brandColor={brandColor}
        />

        <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-muted border border-slate-200">
          <p className="font-semibold text-ink">Delivery information</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Delivery across Pakistan in 3–5 working days.</li>
            <li>For returns or exchange, contact the seller directly.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
