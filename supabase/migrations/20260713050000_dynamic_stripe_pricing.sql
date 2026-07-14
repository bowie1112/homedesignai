alter table public.subscriptions
  add column if not exists product_key text;

alter table public.subscriptions
  drop column if exists stripe_price_id;

alter table public.orders
  alter column provider_order_id drop not null,
  alter column external_event_id drop not null,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists orders_stripe_subscription_id_idx
  on public.orders(stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists orders_stripe_payment_intent_id_idx
  on public.orders(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
