-- 0007_admin_and_trial_expiry.sql
--
-- M1.6: platform admin flag + automatic trial-expiry downgrade.
-- D5 (downgrade semantics): excess products become HIDDEN, never deleted.

-- 1. Admin flag on profiles (platform owner set via SQL)
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Trial expiry: downgrade expired trials to Free, hide excess products.
--    SECURITY DEFINER so the cron route (anon key) can run it.
--    Idempotent: only touches subscriptions still marked 'trialing' with a
--    past trial_ends_at.
create or replace function public.expire_trials()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free_plan_id uuid;
  v_free_product_limit integer := 20;
  v_sub record;
  v_active_count integer;
  v_expired integer := 0;
  v_hidden integer := 0;
begin
  select id, (limits ->> 'products')::integer
    into v_free_plan_id, v_free_product_limit
  from public.plans
  where slug = 'free' and is_active
  limit 1;
  if v_free_plan_id is null then
    raise exception 'FREE_PLAN_MISSING';
  end if;

  for v_sub in
    select id, store_id
    from public.subscriptions
    where status = 'trialing'
      and trial_ends_at is not null
      and trial_ends_at < now()
  loop
    -- downgrade to Free
    update public.subscriptions
    set plan_id = v_free_plan_id,
        status = 'expired',
        updated_at = now()
    where id = v_sub.id;
    v_expired := v_expired + 1;

    -- D5: hide excess products (newest first), never delete
    select count(*) into v_active_count
    from public.products
    where store_id = v_sub.store_id
      and status = 'active'
      and deleted_at is null;

    if v_active_count > v_free_product_limit then
      with excess as (
        select id
        from public.products
        where store_id = v_sub.store_id
          and status = 'active'
          and deleted_at is null
        order by created_at desc
        limit (v_active_count - v_free_product_limit)
      )
      update public.products p
      set status = 'hidden'
      from excess e
      where p.id = e.id;
      get diagnostics v_hidden = row_count;
    end if;
  end loop;

  return jsonb_build_object('expired', v_expired, 'products_hidden', v_hidden);
end;
$$;

grant execute on function public.expire_trials() to anon, authenticated;

-- 3. Admin RLS: platform admins can read/manage everything.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());
create policy stores_admin_all on public.stores
  for all using (public.is_admin()) with check (public.is_admin());
create policy subscriptions_admin_all on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());
create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());
create policy products_admin_all on public.products
  for all using (public.is_admin()) with check (public.is_admin());
create policy customers_admin_all on public.customers
  for all using (public.is_admin()) with check (public.is_admin());
