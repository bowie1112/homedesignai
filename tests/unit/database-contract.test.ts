import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(path.join(process.cwd(), "supabase/migrations/202607100001_initial.sql"), "utf8");
const analyticsMigration = readFileSync(path.join(process.cwd(), "supabase/migrations/202607150001_product_events_and_result_deletion.sql"), "utf8");
const dailyQuotaMigration = readFileSync(path.join(process.cwd(), "supabase/migrations/20260717073703_daily_free_basic_quota.sql"), "utf8");
const dailyQuotaGrantMigration = readFileSync(path.join(process.cwd(), "supabase/migrations/20260717074802_harden_daily_free_usage_grants.sql"), "utf8");

describe("credit ledger and webhook SQL contracts", () => {
  it("locks the balance and creates reservation in one database function", () => {
    expect(migration).toContain("reserve_credits_and_create_job");
    expect(migration).toMatch(/select balance[\s\S]+for update;/i);
    expect(migration).toContain("INSUFFICIENT_CREDITS");
    expect(migration).toContain("generation_reserve");
  });

  it("makes refunds and Stripe grants idempotent", () => {
    expect(migration).toContain("unique (user_id, type, reference_id)");
    expect(migration).toContain("refund_generation_job");
    expect(migration).toMatch(/on conflict \(user_id, type, reference_id\) do nothing/);
    expect(migration).toContain("grant_credits");
  });

  it("deduplicates provider webhooks and protects result storage", () => {
    expect(migration).toContain("primary key (provider, event_id)");
    expect(migration).toContain("one_result_asset_per_job");
    expect(migration).toContain("storage_select_own");
    expect(migration).toContain("split_part(name, '/', 2) = auth.uid()::text");
  });
});

describe("daily free Basic quota SQL contracts", () => {
  it("reserves no more than three UTC Basic uses before falling back to credits", () => {
    expect(dailyQuotaMigration).toContain("create table public.daily_free_usage");
    expect(dailyQuotaMigration).toContain("primary key (user_id, usage_date)");
    expect(dailyQuotaMigration).toContain("(now() at time zone 'UTC')::date");
    expect(dailyQuotaMigration).toMatch(/select used_count[\s\S]+for update;/i);
    expect(dailyQuotaMigration).toContain("if current_usage < 3 then");
    expect(dailyQuotaMigration).toContain("selected_charge_source := 'daily_free'");
    expect(dailyQuotaMigration).toContain("if selected_charge_source = 'credits' then");
  });

  it("limits free usage to Basic and records the charge source on every job", () => {
    expect(dailyQuotaMigration).toContain("p_tier = 'basic'");
    expect(dailyQuotaMigration).toContain("p_tier = 'pro' and p_credit_cost <> 3");
    expect(dailyQuotaMigration).toContain("charge_source in ('daily_free', 'credits')");
    expect(dailyQuotaMigration).toContain("daily_quota_date");
    expect(dailyQuotaMigration).toContain("credit_cost in (0, 1, 3)");
  });

  it("returns the original payment source once and leaves historical balances intact", () => {
    expect(dailyQuotaMigration).toMatch(/if target\.refunded_at is not null then return false;/i);
    expect(dailyQuotaMigration).toMatch(/target\.charge_source = 'daily_free'[\s\S]+used_count = greatest\(0, used_count - 1\)/i);
    expect(dailyQuotaMigration).toMatch(/else[\s\S]+generation_refund[\s\S]+balance = balance \+ target\.credit_cost/i);
    expect(dailyQuotaMigration).not.toMatch(/update public\.credit_accounts[\s\S]+set balance = greatest/i);
  });

  it("stops signup grants and exposes read-only owned usage through RLS", () => {
    expect(dailyQuotaMigration).toMatch(/insert into public\.credit_accounts[\s\S]+values \(new\.id, 0, 0\)/i);
    expect(dailyQuotaMigration).not.toContain("'signup'");
    expect(dailyQuotaMigration).toContain("alter table public.daily_free_usage enable row level security");
    expect(dailyQuotaMigration).toContain("using ((select auth.uid()) = user_id)");
    expect(dailyQuotaMigration).toContain("grant select on public.daily_free_usage to authenticated");
    expect(dailyQuotaMigration).toContain("revoke all on public.daily_free_usage from public, anon, authenticated");
    expect(dailyQuotaGrantMigration).toContain("revoke all on public.daily_free_usage from public, anon, authenticated");
    expect(dailyQuotaMigration).toContain("revoke all on function public.reserve_credits_and_create_job");
  });
});

describe("product analytics and deletion SQL contracts", () => {
  it("keeps product events idempotent and detached from deletable jobs", () => {
    expect(analyticsMigration).toContain("create table public.product_events");
    expect(analyticsMigration).toContain("id uuid primary key");
    expect(analyticsMigration).toContain("generation_job_id uuid,");
    expect(analyticsMigration).not.toMatch(/generation_job_id uuid[^\n]+references public\.generation_jobs/);
  });

  it("deletes only owned terminal jobs and records the deletion transactionally", () => {
    expect(analyticsMigration).toContain("delete_generation_job");
    expect(analyticsMigration).toMatch(/where id = p_job_id and user_id = p_user_id[\s\S]+for update/);
    expect(analyticsMigration).toContain("target.status not in ('success', 'failed', 'refunded')");
    expect(analyticsMigration).toContain("'result_deleted'");
    expect(analyticsMigration).toContain("delete from public.generation_jobs");
  });

  it("provides the three service-only reporting views", () => {
    expect(analyticsMigration).toContain("generation_result_engagement");
    expect(analyticsMigration).toContain("daily_product_metrics");
    expect(analyticsMigration).toContain("user_activation_funnel");
    expect(analyticsMigration).toContain("grant select on public.generation_result_engagement");
  });
});
