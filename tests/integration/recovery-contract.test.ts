import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");
const generationService = read("lib/generation/service.ts");
const kieWebhook = read("app/api/webhooks/kie/route.ts");
const reconciliation = read("app/api/cron/reconcile-kie/route.ts");
const stripeWebhook = read("app/api/webhooks/stripe/route.ts");
const checkout = read("app/api/checkout/route.ts");
const plans = read("lib/payments/plans.ts");
const sitemap = read("app/sitemap.ts");

describe("durable recovery integration contracts", () => {
  it("treats callbacks as signals and recordInfo reconciliation as authority", () => {
    expect(kieWebhook).toContain("reconcileGeneration");
    expect(generationService).toContain("getKieTask(job.kie_task_id)");
    expect(generationService).toContain('record.state === "success"');
    expect(generationService).toContain('record.state === "fail"');
  });

  it("recovers missed callbacks and refunds jobs after the timeout window", () => {
    expect(reconciliation).toContain('["queued", "processing", "delayed", "persisting", "refunded"]');
    expect(reconciliation).toContain("reconcileGeneration(job)");
    expect(generationService).toContain("60 * 60 * 1000");
    expect(generationService).toContain("PROVIDER_TIMEOUT_60_MINUTES");
  });

  it("keeps expired result URLs and storage failures in persisting instead of model failure", () => {
    expect(generationService).toContain("The temporary result could not be downloaded");
    expect(generationService).toContain('status: "persisting"');
    expect(generationService).toContain("RESULT_MIGRATION_FAILED");
    expect(generationService).toContain("MISSING_RESULT_URL");
  });

  it("grants pack and subscription credits from separate Stripe signals", () => {
    expect(stripeWebhook).toMatch(/checkout\.session\.completed[\s\S]+handleCheckoutCompleted/);
    expect(stripeWebhook).toMatch(/invoice\.paid[\s\S]+handleInvoicePaid/);
    expect(stripeWebhook).toContain('plan.kind === "one_time"');
    expect(stripeWebhook).toContain('session.payment_status === "paid"');
    expect(stripeWebhook).toContain('"subscription"');
    expect(stripeWebhook).toContain("subscription.metadata.planId");
    expect(stripeWebhook).not.toContain("findSubscriptionProductByPrice");
  });

  it("creates code-priced Checkout sessions from a server-owned plan", () => {
    expect(checkout).toContain("price_data");
    expect(checkout).toContain("unit_amount: plan.amount");
    expect(checkout).toContain("recurring: { interval: plan.interval }");
    expect(checkout).toContain("allow_promotion_codes: true");
    expect(checkout).toContain("z.object({ planId:");
    expect(checkout).not.toContain("priceEnv");
    expect(plans).toContain("creditsPerInvoice");
  });

  it("keeps deferred native editing and DXF routes out of the public sitemap", () => {
    expect(sitemap).not.toContain("floor-plan-creator");
    expect(sitemap).not.toContain("ai-3d-generator");
    expect(sitemap).not.toContain("dxf-converter");
  });
});
