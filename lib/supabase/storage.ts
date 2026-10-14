/**
 * Public image URLs via Supabase Image Transformations (Decision D8):
 * WebP + responsive widths, served from the CDN edge.
 */
export function productImageUrl(storagePath: string, width = 600): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return (
    `${base}/storage/v1/render/image/public/product-images/${storagePath}` +
    `?width=${width}&quality=80&format=webp`
  );
}

export function storeAssetUrl(storagePath: string, width = 800): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return (
    `${base}/storage/v1/render/image/public/store-assets/${storagePath}` +
    `?width=${width}&quality=80&format=webp`
  );
}
