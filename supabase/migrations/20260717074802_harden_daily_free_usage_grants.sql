revoke all on public.daily_free_usage from public, anon, authenticated;
grant select on public.daily_free_usage to authenticated;
grant all on public.daily_free_usage to service_role;
