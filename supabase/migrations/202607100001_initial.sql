create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  updated_at timestamptz not null default now()
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  type text not null check (type in ('signup', 'generation_reserve', 'generation_refund', 'purchase', 'subscription', 'manual_adjustment')),
  reference_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, type, reference_id)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid,
  kind text not null check (kind in ('input', 'result')),
  storage_path text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  original_name text,
  created_at timestamptz not null default now()
);

create table public.generation_jobs (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool text not null,
  tier text not null check (tier in ('basic', 'pro')),
  prompt text not null check (char_length(prompt) between 12 and 20000),
  input_asset_ids uuid[] not null default '{}',
  room_type text not null,
  style text not null,
  aspect_ratio text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'delayed', 'persisting', 'success', 'failed', 'refunded')),
  credit_cost integer not null check (credit_cost in (1, 3)),
  kie_task_id text unique,
  provider_state text,
  provider_credits_consumed numeric,
  result_asset_id uuid references public.assets(id) on delete set null,
  result_migrated_at timestamptz,
  error_code text,
  error_message text,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets
  add constraint assets_job_id_fkey foreign key (job_id) references public.generation_jobs(id) on delete cascade;

create unique index one_result_asset_per_job on public.assets(job_id) where kind = 'result';
create index generation_jobs_user_created_idx on public.generation_jobs(user_id, created_at desc);
create index generation_jobs_reconcile_idx on public.generation_jobs(status, updated_at) where status in ('queued', 'processing', 'delayed', 'persisting', 'refunded');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_price_id text,
  status text not null,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'stripe',
  provider_order_id text not null,
  external_event_id text not null,
  kind text not null check (kind in ('credit_pack', 'subscription')),
  product_key text not null,
  amount_total integer,
  currency text,
  status text not null,
  credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id),
  unique (provider, external_event_id)
);

create table public.webhook_events (
  provider text not null,
  event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (provider, event_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger credit_accounts_updated_at before update on public.credit_accounts for each row execute function public.set_updated_at();
create trigger generation_jobs_updated_at before update on public.generation_jobs for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  insert into public.credit_accounts (user_id, balance, lifetime_earned)
  values (new.id, 3, 3)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, amount, type, reference_id)
  values (new.id, 3, 'signup', 'signup:' || new.id::text)
  on conflict (user_id, type, reference_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.reserve_credits_and_create_job(
  p_user_id uuid,
  p_job_id uuid,
  p_tool text,
  p_tier text,
  p_prompt text,
  p_input_asset_ids uuid[],
  p_room_type text,
  p_style text,
  p_aspect_ratio text,
  p_credit_cost integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
begin
  if p_credit_cost not in (1, 3) then raise exception 'INVALID_CREDIT_COST'; end if;
  select balance into current_balance from public.credit_accounts where user_id = p_user_id for update;
  if current_balance is null or current_balance < p_credit_cost then raise exception 'INSUFFICIENT_CREDITS'; end if;

  insert into public.generation_jobs (
    id, user_id, tool, tier, prompt, input_asset_ids, room_type, style, aspect_ratio, status, credit_cost
  ) values (
    p_job_id, p_user_id, p_tool, p_tier, p_prompt, coalesce(p_input_asset_ids, '{}'), p_room_type, p_style, p_aspect_ratio, 'queued', p_credit_cost
  );

  update public.credit_accounts
  set balance = balance - p_credit_cost, lifetime_spent = lifetime_spent + p_credit_cost
  where user_id = p_user_id;

  insert into public.credit_transactions (user_id, amount, type, reference_id, metadata)
  values (p_user_id, -p_credit_cost, 'generation_reserve', p_job_id::text, jsonb_build_object('tier', p_tier, 'tool', p_tool));
  return p_job_id;
end;
$$;

create or replace function public.refund_generation_job(p_job_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.generation_jobs%rowtype;
  inserted_id uuid;
begin
  select * into target from public.generation_jobs where id = p_job_id for update;
  if target.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if target.refunded_at is not null then return false; end if;

  insert into public.credit_transactions (user_id, amount, type, reference_id, metadata)
  values (target.user_id, target.credit_cost, 'generation_refund', target.id::text, jsonb_build_object('reason', p_reason))
  on conflict (user_id, type, reference_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    update public.generation_jobs set refunded_at = coalesce(refunded_at, now()), status = 'refunded' where id = target.id;
    return false;
  end if;

  update public.credit_accounts
  set balance = balance + target.credit_cost,
      lifetime_spent = greatest(0, lifetime_spent - target.credit_cost)
  where user_id = target.user_id;
  update public.generation_jobs set refunded_at = now(), status = 'refunded' where id = target.id;
  return true;
end;
$$;

create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_reference_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if p_amount <= 0 then raise exception 'INVALID_CREDIT_AMOUNT'; end if;
  if p_type not in ('purchase', 'subscription', 'manual_adjustment') then raise exception 'INVALID_CREDIT_TYPE'; end if;

  insert into public.credit_accounts (user_id, balance, lifetime_earned)
  values (p_user_id, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, amount, type, reference_id)
  values (p_user_id, p_amount, p_type, p_reference_id)
  on conflict (user_id, type, reference_id) do nothing
  returning id into inserted_id;
  if inserted_id is null then return false; end if;

  update public.credit_accounts
  set balance = balance + p_amount, lifetime_earned = lifetime_earned + p_amount
  where user_id = p_user_id;
  return true;
end;
$$;

revoke all on function public.reserve_credits_and_create_job(uuid, uuid, text, text, text, uuid[], text, text, text, integer) from public, anon, authenticated;
revoke all on function public.refund_generation_job(uuid, text) from public, anon, authenticated;
revoke all on function public.grant_credits(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.reserve_credits_and_create_job(uuid, uuid, text, text, text, uuid[], text, text, text, integer) to service_role;
grant execute on function public.refund_generation_job(uuid, text) to service_role;
grant execute on function public.grant_credits(uuid, integer, text, text) to service_role;

alter table public.profiles enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.assets enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.orders enable row level security;
alter table public.webhook_events enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "credit_accounts_select_own" on public.credit_accounts for select using (auth.uid() = user_id);
create policy "credit_transactions_select_own" on public.credit_transactions for select using (auth.uid() = user_id);
create policy "assets_select_own" on public.assets for select using (auth.uid() = user_id);
create policy "assets_insert_own" on public.assets for insert with check (auth.uid() = user_id);
create policy "assets_delete_own" on public.assets for delete using (auth.uid() = user_id);
create policy "generation_jobs_select_own" on public.generation_jobs for select using (auth.uid() = user_id);
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);

revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-assets', 'private-assets', false, 52428800, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_select_own" on storage.objects for select to authenticated
using (bucket_id = 'private-assets' and split_part(name, '/', 2) = auth.uid()::text);
create policy "storage_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'private-assets' and split_part(name, '/', 2) = auth.uid()::text);
create policy "storage_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'private-assets' and split_part(name, '/', 2) = auth.uid()::text);
