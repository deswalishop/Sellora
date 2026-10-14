-- 0008_cost_price_protection.sql
--
-- SECURITY FIX (found by M1.6 RLS audit): cost_price (seller margins) was
-- readable by anyone through the public products API via the
-- products_public_read policy. Lock it down with column-level grants.
--
-- - anon + authenticated: SELECT on safe columns only (no cost_price).
-- - authenticated: INSERT/UPDATE/DELETE unchanged, still row-gated by the
--   owner RLS policy (sellers can only touch their own rows).
-- - Owners read cost_price through get_product_cost() (SECURITY DEFINER,
--   ownership-checked) used by the dashboard edit form and duplicate action.

-- 1. Tighten grants on the base table.
revoke all on public.products from anon, authenticated;

grant select (
  id, store_id, category_id, title, slug, description,
  regular_price, sale_price, sku, stock, weight_grams, brand,
  status, is_featured, seo_title, seo_description,
  created_at, updated_at, deleted_at
) on public.products to anon, authenticated;

grant insert, update, delete on public.products to authenticated;

-- 2. Owner-only cost_price read (dashboard).
create or replace function public.get_product_cost(p_product_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  select p.cost_price
  from public.products p
  where p.id = p_product_id
    and public.is_store_owner(p.store_id);
$$;

grant execute on function public.get_product_cost(uuid) to authenticated;
