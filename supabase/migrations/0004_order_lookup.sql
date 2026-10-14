-- ============================================================================
-- Sellora migration 0004 — public order tracking lookup
-- Customers track with order number + phone (Decision D4: guest checkout).
-- Security-definer function: RLS keeps orders private; this function only
-- reveals ONE order when both number and phone match.
-- NOTE: rate-limit the /track endpoint at the edge in production.
-- ============================================================================

create or replace function public.lookup_order(p_slug text, p_order_number text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_order record;
  v_items jsonb;
  v_history jsonb;
  v_phone text := regexp_replace(p_phone, '\D', '', 'g');
begin
  select id into v_store_id
  from public.stores
  where slug = p_slug and status = 'active';
  if v_store_id is null then
    return jsonb_build_object('found', false);
  end if;

  select o.* into v_order
  from public.orders o
  where o.store_id = v_store_id
    and o.order_number = p_order_number
    and regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone
  limit 1;

  if v_order is null then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at), '[]'::jsonb)
  into v_items
  from (
    select title, variant_name, quantity, unit_price, created_at
    from public.order_items
    where order_id = v_order.id
  ) t;

  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at), '[]'::jsonb)
  into v_history
  from (
    select to_status, note, created_at
    from public.order_status_history
    where order_id = v_order.id
  ) t;

  return jsonb_build_object(
    'found', true,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'total', v_order.total,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status,
    'customer_name', v_order.customer_name,
    'created_at', v_order.created_at,
    'items', v_items,
    'history', v_history
  );
end;
$$;
