create table public.daily_free_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null,
  used_count smallint not null default 0 check (used_count between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create trigger daily_free_usage_updated_at
before update on public.daily_free_usage
for each row execute function public.set_updated_at();

alter table public.generation_jobs
  add column charge_source text not null default 'credits'
    check (charge_source in ('daily_free', 'credits')),
  add column daily_quota_date date;

alter table public.generation_jobs
  drop constraint generation_jobs_credit_cost_check;

alter table public.generation_jobs
  add constraint generation_jobs_credit_cost_check check (credit_cost in (0, 1, 3)),
  add constraint generation_jobs_charge_consistency_check check (
    (
      charge_source = 'daily_free'
      and tier = 'basic'
      and credit_cost = 0
      and daily_quota_date is not null
    )
    or
    (
      charge_source = 'credits'
      and credit_cost in (1, 3)
      and daily_quota_date is null
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  insert into public.credit_accounts (user_id, balance, lifetime_earned)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

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
set search_path = ''
as $$
declare
  current_balance integer;
  current_usage smallint;
  quota_date date := (now() at time zone 'UTC')::date;
  selected_charge_source text := 'credits';
  selected_credit_cost integer := p_credit_cost;
begin
  if p_tier not in ('basic', 'pro') then raise exception 'INVALID_TIER'; end if;
  if (p_tier = 'basic' and p_credit_cost <> 1) or (p_tier = 'pro' and p_credit_cost <> 3) then
    raise exception 'INVALID_CREDIT_COST';
  end if;

  if p_tier = 'basic' then
    insert into public.daily_free_usage (user_id, usage_date, used_count)
    values (p_user_id, quota_date, 0)
    on conflict (user_id, usage_date) do nothing;

    select used_count into current_usage
    from public.daily_free_usage
    where user_id = p_user_id and usage_date = quota_date
    for update;

    if current_usage < 3 then
      update public.daily_free_usage
      set used_count = used_count + 1
      where user_id = p_user_id and usage_date = quota_date;
      selected_charge_source := 'daily_free';
      selected_credit_cost := 0;
    end if;
  end if;

  if selected_charge_source = 'credits' then
    select balance into current_balance
    from public.credit_accounts
    where user_id = p_user_id
    for update;

    if current_balance is null or current_balance < selected_credit_cost then
      raise exception 'INSUFFICIENT_CREDITS';
    end if;

    update public.credit_accounts
    set balance = balance - selected_credit_cost,
        lifetime_spent = lifetime_spent + selected_credit_cost
    where user_id = p_user_id;

    insert into public.credit_transactions (user_id, amount, type, reference_id, metadata)
    values (
      p_user_id,
      -selected_credit_cost,
      'generation_reserve',
      p_job_id::text,
      jsonb_build_object('tier', p_tier, 'tool', p_tool, 'charge_source', selected_charge_source)
    );
  end if;

  insert into public.generation_jobs (
    id,
    user_id,
    tool,
    tier,
    prompt,
    input_asset_ids,
    room_type,
    style,
    aspect_ratio,
    status,
    credit_cost,
    charge_source,
    daily_quota_date
  ) values (
    p_job_id,
    p_user_id,
    p_tool,
    p_tier,
    p_prompt,
    coalesce(p_input_asset_ids, '{}'),
    p_room_type,
    p_style,
    p_aspect_ratio,
    'queued',
    selected_credit_cost,
    selected_charge_source,
    case when selected_charge_source = 'daily_free' then quota_date else null end
  );

  return p_job_id;
end;
$$;

create or replace function public.refund_generation_job(p_job_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.generation_jobs%rowtype;
  inserted_id uuid;
begin
  select * into target
  from public.generation_jobs
  where id = p_job_id
  for update;

  if target.id is null then raise exception 'JOB_NOT_FOUND'; end if;
  if target.refunded_at is not null then return false; end if;

  if target.charge_source = 'daily_free' then
    update public.daily_free_usage
    set used_count = greatest(0, used_count - 1)
    where user_id = target.user_id and usage_date = target.daily_quota_date;
  else
    insert into public.credit_transactions (user_id, amount, type, reference_id, metadata)
    values (
      target.user_id,
      target.credit_cost,
      'generation_refund',
      target.id::text,
      jsonb_build_object('reason', p_reason, 'charge_source', target.charge_source)
    )
    on conflict (user_id, type, reference_id) do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      update public.credit_accounts
      set balance = balance + target.credit_cost,
          lifetime_spent = greatest(0, lifetime_spent - target.credit_cost)
      where user_id = target.user_id;
    end if;
  end if;

  update public.generation_jobs
  set refunded_at = now(), status = 'refunded'
  where id = target.id;

  return true;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.reserve_credits_and_create_job(uuid, uuid, text, text, text, uuid[], text, text, text, integer) from public, anon, authenticated;
revoke all on function public.refund_generation_job(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_credits_and_create_job(uuid, uuid, text, text, text, uuid[], text, text, text, integer) to service_role;
grant execute on function public.refund_generation_job(uuid, text) to service_role;

revoke all on public.daily_free_usage from public, anon, authenticated;
grant select on public.daily_free_usage to authenticated;
grant all on public.daily_free_usage to service_role;

alter table public.daily_free_usage enable row level security;

create policy "daily_free_usage_select_own"
on public.daily_free_usage
for select
to authenticated
using ((select auth.uid()) = user_id);
