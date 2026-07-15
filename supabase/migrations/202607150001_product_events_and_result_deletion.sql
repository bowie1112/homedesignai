create table public.product_events (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_job_id uuid,
  event_name text not null check (event_name in (
    'history_opened',
    'result_downloaded', 'result_download_failed',
    'result_share_started', 'result_shared', 'result_share_cancelled', 'result_share_unsupported', 'result_share_failed',
    'result_delete_requested', 'result_deleted', 'result_delete_failed',
    'generation_client_failed', 'insufficient_credits_seen',
    'checkout_started', 'checkout_redirected', 'checkout_failed'
  )),
  surface text not null check (surface in ('generator', 'history', 'pricing', 'auth', 'system')),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(properties) = 'object')
);

create index product_events_user_created_idx on public.product_events(user_id, created_at desc);
create index product_events_job_created_idx on public.product_events(generation_job_id, created_at desc) where generation_job_id is not null;
create index product_events_name_created_idx on public.product_events(event_name, created_at desc);

alter table public.product_events enable row level security;
create policy "product_events_select_own" on public.product_events for select to authenticated
using ((select auth.uid()) = user_id);

grant select on public.product_events to authenticated;
grant all on public.product_events to service_role;

create or replace function public.delete_generation_job(
  p_user_id uuid,
  p_job_id uuid,
  p_event_id uuid,
  p_occurred_at timestamptz,
  p_surface text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.generation_jobs%rowtype;
begin
  select * into target
  from public.generation_jobs
  where id = p_job_id and user_id = p_user_id
  for update;

  if target.id is null then return false; end if;
  if target.status not in ('success', 'failed', 'refunded') then raise exception 'JOB_NOT_TERMINAL'; end if;
  if p_surface not in ('generator', 'history') then raise exception 'INVALID_SURFACE'; end if;

  insert into public.product_events (
    id, user_id, generation_job_id, event_name, surface, properties, occurred_at
  ) values (
    p_event_id,
    p_user_id,
    target.id,
    'result_deleted',
    p_surface,
    jsonb_build_object(
      'tool', target.tool,
      'tier', target.tier,
      'status', target.status,
      'generated_at', target.created_at
    ),
    p_occurred_at
  ) on conflict (id) do nothing;

  delete from public.assets
  where user_id = p_user_id
    and (id = target.result_asset_id or id = any(target.input_asset_ids));

  delete from public.generation_jobs where id = target.id and user_id = p_user_id;
  return true;
end;
$$;

revoke all on function public.delete_generation_job(uuid, uuid, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.delete_generation_job(uuid, uuid, uuid, timestamptz, text) to service_role;

create view public.generation_result_engagement
with (security_invoker = true)
as
with event_rollup as (
  select
    user_id,
    generation_job_id,
    max(properties ->> 'tool') as event_tool,
    max(properties ->> 'tier') as event_tier,
    max((properties ->> 'generated_at')::timestamptz) filter (where event_name = 'result_deleted') as event_generated_at,
    count(*) filter (where event_name = 'result_downloaded')::integer as download_count,
    count(*) filter (where event_name = 'result_shared')::integer as share_count,
    count(*) filter (where event_name = 'result_deleted')::integer as delete_count,
    min(occurred_at) filter (where event_name = 'result_downloaded') as first_downloaded_at,
    min(occurred_at) filter (where event_name = 'result_shared') as first_shared_at,
    min(occurred_at) filter (where event_name = 'result_deleted') as deleted_at
  from public.product_events
  where generation_job_id is not null
  group by user_id, generation_job_id
)
select
  coalesce(j.id, e.generation_job_id) as generation_job_id,
  coalesce(j.user_id, e.user_id) as user_id,
  coalesce(j.tool, e.event_tool) as tool,
  coalesce(j.tier, e.event_tier) as tier,
  coalesce(j.status, case when e.delete_count > 0 then 'deleted' end) as status,
  coalesce(e.download_count, 0) as download_count,
  coalesce(e.share_count, 0) as share_count,
  coalesce(e.delete_count, 0) > 0 as was_deleted,
  e.first_downloaded_at,
  e.first_shared_at,
  e.deleted_at,
  coalesce(j.created_at, e.event_generated_at) as generated_at
from public.generation_jobs j
full join event_rollup e on e.generation_job_id = j.id and e.user_id = j.user_id
where j.status = 'success' or e.generation_job_id is not null;

create view public.daily_product_metrics
with (security_invoker = true)
as
with days as (
  select created_at::date as day from public.profiles
  union select created_at::date from public.generation_jobs
  union select created_at::date from public.orders
  union select occurred_at::date from public.product_events
), profile_daily as (
  select created_at::date as day, count(*)::integer as registrations
  from public.profiles group by 1
), generation_facts as (
  select id, user_id, status, created_at from public.generation_jobs
  union all
  select
    generation_job_id,
    user_id,
    properties ->> 'status',
    (properties ->> 'generated_at')::timestamptz
  from public.product_events
  where event_name = 'result_deleted'
), job_daily as (
  select
    created_at::date as day,
    count(*)::integer as generations,
    count(distinct user_id)::integer as generating_users,
    count(*) filter (where status = 'success')::integer as successful_generations,
    count(*) filter (where status = 'failed')::integer as failed_generations,
    count(*) filter (where status = 'refunded')::integer as refunded_generations
  from generation_facts group by 1
), event_daily as (
  select
    occurred_at::date as day,
    count(*) filter (where event_name = 'result_downloaded')::integer as downloads,
    count(*) filter (where event_name = 'result_shared')::integer as shares,
    count(*) filter (where event_name = 'result_deleted')::integer as deletions
  from public.product_events group by 1
), order_daily as (
  select
    created_at::date as day,
    count(distinct user_id) filter (where status in ('paid', 'complete'))::integer as paying_users,
    coalesce(sum(amount_total) filter (where status in ('paid', 'complete')), 0)::bigint as revenue_minor_units
  from public.orders group by 1
)
select
  d.day,
  coalesce(p.registrations, 0) as registrations,
  coalesce(j.generations, 0) as generations,
  coalesce(j.generating_users, 0) as generating_users,
  coalesce(j.successful_generations, 0) as successful_generations,
  coalesce(j.failed_generations, 0) as failed_generations,
  coalesce(j.refunded_generations, 0) as refunded_generations,
  case when coalesce(j.generations, 0) = 0 then 0 else round(j.successful_generations::numeric / j.generations, 4) end as generation_success_rate,
  coalesce(e.downloads, 0) as downloads,
  coalesce(e.shares, 0) as shares,
  coalesce(e.deletions, 0) as deletions,
  coalesce(o.paying_users, 0) as paying_users,
  coalesce(o.revenue_minor_units, 0) as revenue_minor_units
from days d
left join profile_daily p using (day)
left join job_daily j using (day)
left join event_daily e using (day)
left join order_daily o using (day);

create view public.user_activation_funnel
with (security_invoker = true)
as
with generation_facts as (
  select id, user_id, status, created_at from public.generation_jobs
  union all
  select
    generation_job_id,
    user_id,
    properties ->> 'status',
    (properties ->> 'generated_at')::timestamptz
  from public.product_events
  where event_name = 'result_deleted'
), generation_rollup as (
  select
    user_id,
    min(created_at) as first_generation_at,
    min(created_at) filter (where status = 'success') as first_success_at,
    array_agg(distinct created_at::date) as generation_dates
  from generation_facts group by user_id
), engagement_rollup as (
  select user_id, min(occurred_at) as first_result_engagement_at
  from public.product_events
  where event_name in ('result_downloaded', 'result_shared')
  group by user_id
), purchase_rollup as (
  select user_id, min(created_at) as first_purchase_at
  from public.orders
  where status in ('paid', 'complete')
  group by user_id
)
select
  p.id as user_id,
  p.created_at as registered_at,
  g.first_generation_at,
  g.first_success_at,
  e.first_result_engagement_at,
  o.first_purchase_at,
  coalesce(p.created_at::date + 1 = any(g.generation_dates), false) as generated_d1,
  coalesce(exists (select 1 from unnest(g.generation_dates) day where day between p.created_at::date + 1 and p.created_at::date + 7), false) as generated_d7,
  coalesce(exists (select 1 from unnest(g.generation_dates) day where day between p.created_at::date + 1 and p.created_at::date + 30), false) as generated_d30
from public.profiles p
left join generation_rollup g on g.user_id = p.id
left join engagement_rollup e on e.user_id = p.id
left join purchase_rollup o on o.user_id = p.id;

revoke all on public.generation_result_engagement, public.daily_product_metrics, public.user_activation_funnel from public, anon, authenticated;
grant select on public.generation_result_engagement, public.daily_product_metrics, public.user_activation_funnel to service_role;
