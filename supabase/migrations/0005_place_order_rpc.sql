-- 0005_place_order_rpc.sql
--
-- Secure guest checkout. RLS on customers/orders/order_items is owner-only,
-- so the anon key can never insert an order directly. Checkout goes through
-- this SECURITY DEFINER function instead, which:
--   1. validates the store is active and the payment method is enabled
--   2. re-validates every line against live DB state (price/stock/availability),
--      locking product/variant rows so concurrent checkouts can't oversell
--   3. finds or creates the customer by normalized phone
--   4. generates a collision-safe per-store order number (SLR-1001, SLR-1002, ...)
--   5. inserts order + items atomically, decrements stock (guarded), writes
--      inventory transactions, initial status history, and a seller notification
-- Returns: {"order_number": "...", "total": 1234}
-- Raises on: STORE_NOT_FOUND, STORE_NOT_CONFIGURED, PAYMENT_METHOD_*,
--            CART_INVALID, PRODUCT_UNAVAILABLE, VARIANT_UNAVAILABLE,
--            INSUFFICIENT_STOCK:<title>, ORDER_FAILED

create or replace function public.place_order(
  p_store_id uuid,
  p_full_name text,
  p_phone text,
  p_email text,
  p_city text,
  p_area text,
  p_address text,
  p_payment_method text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings record;
  v_method_enabled boolean := false;
  v_norm_phone text;
  v_customer_id uuid;
  v_subtotal integer := 0;
  v_delivery_fee integer := 0;
  v_total integer := 0;
  v_order_id uuid;
  v_order_number text;
  v_order_count integer;
  v_attempt integer;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_qty integer;
  v_prod record;
  v_var record;
  v_unit_price integer;
  v_variant_name text;
  v_updated integer;
  v_store_name text;
begin
  -- 1. store must exist and be active
  select name into v_store_name
  from public.stores
  where id = p_store_id and status = 'active';
  if not found then
    raise exception 'STORE_NOT_FOUND';
  end if;

  -- 2. payment method must be enabled for this store
  select * into v_settings
  from public.store_settings
  where store_id = p_store_id;
  if not found then
    raise exception 'STORE_NOT_CONFIGURED';
  end if;
  case p_payment_method
    when 'cod'           then v_method_enabled := v_settings.cod_enabled;
    when 'bank_transfer' then v_method_enabled := v_settings.bank_transfer_enabled;
    when 'raast'         then v_method_enabled := v_settings.raast_enabled;
    when 'easypaisa'     then v_method_enabled := v_settings.easypaisa_enabled;
    when 'jazzcash'      then v_method_enabled := v_settings.jazzcash_enabled;
    else raise exception 'PAYMENT_METHOD_INVALID';
  end case;
  if not v_method_enabled then
    raise exception 'PAYMENT_METHOD_DISABLED';
  end if;

  -- 3. cart sanity
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'CART_INVALID';
  end if;

  v_norm_phone := regexp_replace(p_phone, '\D', '', 'g');

  -- 4. validate every line against live state; lock rows to prevent oversell.
  --    (Locks are held until the function commits, so the write pass below
  --    sees the same stock we validated here.)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := nullif(v_item ->> 'variant_id', '')::uuid;
    v_qty := (v_item ->> 'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 100 then
      raise exception 'CART_INVALID';
    end if;

    select id, title, regular_price, sale_price, stock
      into v_prod
    from public.products
    where id = v_product_id
      and store_id = p_store_id
      and status = 'active'
      and deleted_at is null
    for update;
    if not found then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;

    v_unit_price := coalesce(v_prod.sale_price, v_prod.regular_price);
    v_variant_name := null;

    if v_variant_id is not null then
      select id, name, price_override, stock
        into v_var
      from public.product_variants
      where id = v_variant_id and product_id = v_product_id
      for update;
      if not found then
        raise exception 'VARIANT_UNAVAILABLE';
      end if;
      if v_var.price_override is not null then
        v_unit_price := v_var.price_override;
      end if;
      v_variant_name := v_var.name;
      if v_var.stock < v_qty then
        raise exception 'INSUFFICIENT_STOCK:%', v_prod.title;
      end if;
    else
      if v_prod.stock < v_qty then
        raise exception 'INSUFFICIENT_STOCK:%', v_prod.title;
      end if;
    end if;

    v_subtotal := v_subtotal + v_unit_price * v_qty;
  end loop;

  -- 5. delivery fee
  if v_settings.free_shipping_threshold is not null
     and v_subtotal >= v_settings.free_shipping_threshold then
    v_delivery_fee := 0;
  else
    v_delivery_fee := coalesce(v_settings.shipping_fee_flat, 0);
  end if;
  v_total := v_subtotal + v_delivery_fee;

  -- 6. customer: find-or-create by normalized phone
  select id into v_customer_id
  from public.customers
  where store_id = p_store_id and phone = v_norm_phone
  limit 1;
  if not found then
    insert into public.customers (store_id, name, phone, email, address, city, tags)
    values (
      p_store_id,
      p_full_name,
      v_norm_phone,
      nullif(p_email, ''),
      p_address || ', ' || p_area || ', ' || p_city,
      p_city,
      array['New Customer']
    )
    returning id into v_customer_id;
  end if;

  -- 7. order with collision-safe per-store number (unique guard + retry)
  v_order_id := null;
  for v_attempt in 0..4 loop
    select count(*) into v_order_count
    from public.orders
    where store_id = p_store_id;
    v_order_number := 'SLR-' || (1001 + v_order_count + v_attempt)::text;
    begin
      insert into public.orders (
        store_id, order_number, customer_id,
        customer_name, customer_phone, customer_email,
        shipping_address, shipping_city, shipping_area,
        subtotal, delivery_fee, discount, total,
        payment_method, payment_status, status, notes, source
      )
      values (
        p_store_id, v_order_number, v_customer_id,
        p_full_name, v_norm_phone, nullif(p_email, ''),
        p_address, p_city, p_area,
        v_subtotal, v_delivery_fee, 0, v_total,
        p_payment_method, 'unpaid', 'pending', nullif(p_notes, ''), 'storefront'
      )
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      v_order_id := null; -- try next candidate
    end;
  end loop;
  if v_order_id is null then
    raise exception 'ORDER_FAILED';
  end if;

  -- 8. items + guarded stock decrement + inventory transactions
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := nullif(v_item ->> 'variant_id', '')::uuid;
    v_qty := (v_item ->> 'qty')::integer;

    select id, title, regular_price, sale_price
      into v_prod
    from public.products
    where id = v_product_id;

    v_unit_price := coalesce(v_prod.sale_price, v_prod.regular_price);
    v_variant_name := null;

    if v_variant_id is not null then
      select name, price_override
        into v_var
      from public.product_variants
      where id = v_variant_id;
      if v_var.price_override is not null then
        v_unit_price := v_var.price_override;
      end if;
      v_variant_name := v_var.name;

      update public.product_variants
      set stock = stock - v_qty
      where id = v_variant_id and stock >= v_qty;
      get diagnostics v_updated = row_count;
      if v_updated = 0 then
        raise exception 'INSUFFICIENT_STOCK:%', v_prod.title;
      end if;
    else
      update public.products
      set stock = stock - v_qty
      where id = v_product_id and stock >= v_qty;
      get diagnostics v_updated = row_count;
      if v_updated = 0 then
        raise exception 'INSUFFICIENT_STOCK:%', v_prod.title;
      end if;
    end if;

    insert into public.order_items
      (order_id, product_id, variant_id, title, variant_name, quantity, unit_price)
    values
      (v_order_id, v_product_id, v_variant_id, v_prod.title, v_variant_name, v_qty, v_unit_price);

    insert into public.inventory_transactions
      (store_id, product_id, variant_id, change, reason, order_id)
    values
      (p_store_id, v_product_id, v_variant_id, -v_qty, 'order_confirmed', v_order_id);
  end loop;

  -- 9. status history + seller notification
  insert into public.order_status_history (order_id, from_status, to_status, note)
  values (v_order_id, null, 'pending', 'Order placed via storefront');

  insert into public.notifications (store_id, type, title, body)
  values (
    p_store_id,
    'new_order',
    'New order received',
    v_order_number || ' — Rs ' || v_total::text || ' (' || upper(p_payment_method) || ')'
  );

  return jsonb_build_object('order_number', v_order_number, 'total', v_total);
end;
$$;

-- Guests (and signed-in users) must be able to execute checkout.
grant execute on function public.place_order(uuid, text, text, text, text, text, text, text, text, jsonb)
  to anon, authenticated;
