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

/** Dawn-style product page: breadcrumbs, media gallery, buy panel, accordions. */
export function ProductBuyer({
  slug,
  productId,
  title,
  regularPrice,
  salePrice,
  stock,
  description,
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
  description: string | null;
  images: string[];
  variants: DetailVariant[];
  brandColor: string;
  whatsappNumber: string | null;
  codAvailable: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [imgIdx, setImgIdx] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [openAcc, setOpenAcc] = useState<string | null>("desc");

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const price = variant?.price_override ?? salePrice ?? regularPrice;
  const onSale = salePrice != null && salePrice < regularPrice;
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

  const acc = (id: string, label: string, body: React.ReactNode) => (
    <div className="border-t border-neutral-200 last:border-b">
      <button
        onClick={() => setOpenAcc(openAcc === id ? null : id)}
        className="flex w-full items-center justify-between py-4 text-left text-[15px] font-medium text-neutral-900"
        aria-expanded={openAcc === id}
      >
        {label}
        <span className="text-neutral-500">{openAcc === id ? "−" : "+"}</span>
      </button>
      {openAcc === id && <div className="pb-5 text-sm leading-relaxed text-neutral-600">{body}</div>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-[13px] text-neutral-500" aria-label="Breadcrumb">
        <a href={`/s/${slug}`} className="hover:text-neutral-900 hover:underline">Home</a>
        <span className="mx-2">/</span>
        <a href={`/s/${slug}/products`} className="hover:text-neutral-900 hover:underline">Catalog</a>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">{title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-lg bg-neutral-100">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImageUrl(images[imgIdx], 1000)}
                alt={title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-8xl font-semibold text-neutral-300">
                {title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {images.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setImgIdx(i)}
                  className={`overflow-hidden rounded-md border bg-neutral-100 transition ${
                    i === imgIdx ? "border-neutral-900" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={productImageUrl(p, 200)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy panel */}
        <div>
          {onSale && (
            <span className="mb-3 inline-block rounded-full bg-red-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Sale
            </span>
          )}
          <h1 className="text-3xl font-normal tracking-tight text-neutral-900 sm:text-4xl">{title}</h1>

          <div className="mt-3 flex items-baseline gap-3">
            <p className={`text-2xl ${onSale ? "text-red-700" : "text-neutral-900"}`}>{formatRs(price)}</p>
            {onSale && (
              <p className="text-lg text-neutral-500 line-through">{formatRs(regularPrice)}</p>
            )}
          </div>

          <p className="mt-2 text-sm">
            {available > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-neutral-700">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                {available <= 5 ? `Only ${available} left in stock` : "In stock, ready to ship"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-600" /> Sold out
              </span>
            )}
          </p>

          {variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-neutral-700">
                Option: <span className="font-medium text-neutral-900">{variant?.name ?? "—"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock <= 0}
                    className={`min-w-11 rounded-full border px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      variantId === v.id
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
              {variants.length > 0 && !variant && (
                <p className="mt-2 text-[13px] text-neutral-500">Please select an option.</p>
              )}
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="qty" className="mb-2 block text-sm text-neutral-700">Quantity</label>
            <div className="inline-flex items-center rounded border border-neutral-300">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3.5 py-2.5 text-lg text-neutral-600 hover:bg-neutral-100"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span id="qty" className="w-10 text-center text-[15px]">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(Math.max(available, 1), q + 1))}
                className="px-3.5 py-2.5 text-lg text-neutral-600 hover:bg-neutral-100"
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
              className="w-full rounded py-4 text-[15px] font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: brandColor }}
            >
              Add to cart
            </button>
            <button
              onClick={() => {
                addToCart();
                router.push(`/s/${slug}/checkout`);
              }}
              disabled={!canBuy}
              className="w-full rounded border border-neutral-900 bg-white py-4 text-[15px] font-medium text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Buy it now
            </button>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded bg-[#25D366] py-4 text-[15px] font-medium text-white transition hover:brightness-95"
              >
                Order on WhatsApp
              </a>
            )}
          </div>

          {codAvailable && (
            <p className="mt-4 text-sm text-neutral-600">
              ✓ Cash on Delivery available across Pakistan
            </p>
          )}

          <div className="mt-6">
            {description &&
              acc("desc", "Description", <p className="whitespace-pre-line">{description}</p>)}
            {acc(
              "ship",
              "Shipping & returns",
              <p>
                Orders are dispatched within 1–2 working days. Cash on delivery available nationwide.
                7-day easy exchange on unused items.
              </p>
            )}
          </div>

          <div className="mt-6">
            <ShareButtons
              title={title}
              url={typeof window !== "undefined" ? window.location.href : ""}
              brandColor={brandColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
