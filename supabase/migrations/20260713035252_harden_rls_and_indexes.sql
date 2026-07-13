alter function public.set_updated_at() set search_path = public;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "credit_accounts_select_own" on public.credit_accounts;
create policy "credit_accounts_select_own" on public.credit_accounts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "credit_transactions_select_own" on public.credit_transactions;
create policy "credit_transactions_select_own" on public.credit_transactions for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "assets_select_own" on public.assets;
create policy "assets_select_own" on public.assets for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "assets_insert_own" on public.assets;
create policy "assets_insert_own" on public.assets for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "assets_delete_own" on public.assets;
create policy "assets_delete_own" on public.assets for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "generation_jobs_select_own" on public.generation_jobs;
create policy "generation_jobs_select_own" on public.generation_jobs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "storage_select_own" on storage.objects;
create policy "storage_select_own" on storage.objects for select to authenticated
using (bucket_id = 'private-assets' and split_part(name, '/', 2) = (select auth.uid())::text);
drop policy if exists "storage_insert_own" on storage.objects;
create policy "storage_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'private-assets' and split_part(name, '/', 2) = (select auth.uid())::text);
drop policy if exists "storage_delete_own" on storage.objects;
create policy "storage_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'private-assets' and split_part(name, '/', 2) = (select auth.uid())::text);

create index if not exists assets_user_id_idx on public.assets(user_id);
create index if not exists generation_jobs_result_asset_id_idx on public.generation_jobs(result_asset_id) where result_asset_id is not null;
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
