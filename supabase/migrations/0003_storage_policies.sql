-- ============================================================================
-- Sellora migration 0003 — storage policies for product images & store assets
-- FIRST create the buckets in the dashboard (Storage → New bucket, PUBLIC):
--   product-images, store-assets
-- Path convention: <store_id>/<product_id>/<filename>  (or <store_id>/logo/…)
-- Public buckets => anyone can READ. Writes are restricted to the store owner.
-- ============================================================================

create policy "sellers_insert_own_store_files"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('product-images', 'store-assets')
  and exists (
    select 1 from public.stores s
    where s.owner_id = auth.uid()
      and s.id::text = (storage.foldername(name))[1]
  )
);

create policy "sellers_update_own_store_files"
on storage.objects for update to authenticated
using (
  bucket_id in ('product-images', 'store-assets')
  and exists (
    select 1 from public.stores s
    where s.owner_id = auth.uid()
      and s.id::text = (storage.foldername(name))[1]
  )
);

create policy "sellers_delete_own_store_files"
on storage.objects for delete to authenticated
using (
  bucket_id in ('product-images', 'store-assets')
  and exists (
    select 1 from public.stores s
    where s.owner_id = auth.uid()
      and s.id::text = (storage.foldername(name))[1]
  )
);
