import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(path.join(process.cwd(), "supabase/migrations/202607100001_initial.sql"), "utf8");

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
