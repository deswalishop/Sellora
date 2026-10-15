"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { productImageUrl } from "@/lib/supabase/storage";
import { uploadProductImage, deleteProductImage } from "./actions";
import { MAX_IMAGES_PER_PRODUCT } from "./schemas";

export interface ProductImage {
  id: string;
  storage_path: string;
}

/** Image manager: upload (max 8, 5MB each) + delete. */
export function ImageUploader({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadProductImage(productId, fd);
    setPending(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) {
      setError(res.error ?? "Upload failed.");
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this image?")) return;
    const res = await deleteProductImage(id);
    if (!res.ok) {
      setError(res.error ?? "Could not delete the image.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.id} className="relative overflow-hidden rounded-xl border border-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productImageUrl(img.storage_path, 300)}
              alt={`Product image ${i + 1}`}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                Main
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(img.id)}
              aria-label="Delete image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-red-600 shadow hover:bg-white"
            >
              ×
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES_PER_PRODUCT && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-neutral-500 transition hover:border-brand-light hover:text-neutral-900 disabled:opacity-50"
          >
            <span className="text-2xl">+</span>
            {pending ? "Uploading…" : "Add image"}
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
      <p className="text-xs text-neutral-500">
        {images.length}/{MAX_IMAGES_PER_PRODUCT} images · max 5MB each · first image is the main one.
      </p>
    </div>
  );
}
