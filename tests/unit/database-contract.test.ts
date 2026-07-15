import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(path.join(process.cwd(), "supabase/migrations/202607100001_initial.sql"), "utf8");
const analyticsMigration = readFileSync(path.join(process.cwd(), "supabase/migrations/202607150001_product_events_and_result_deletion.sql"), "utf8");

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
