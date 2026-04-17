alter table public.creators
  add column if not exists kit_order_amount numeric,
  add column if not exists kit_order_currency text;

comment on column public.creators.kit_order_amount is 'Total order amount when creator placed their kit order.';
comment on column public.creators.kit_order_currency is 'Currency code (e.g. EUR) for kit_order_amount.';
