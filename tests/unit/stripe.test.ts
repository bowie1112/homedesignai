import { afterEach, describe, expect, it } from "vitest";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

const originalSecretKey = process.env.STRIPE_SECRET_KEY;
const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

afterEach(() => {
  if (originalSecretKey === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = originalSecretKey;
  if (originalWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
});

describe("Stripe environment validation", () => {
  it("trims surrounding whitespace from Stripe secrets", () => {
    process.env.STRIPE_SECRET_KEY = "  sk_test_example\r\n";
    process.env.STRIPE_WEBHOOK_SECRET = "\nwhsec_example  ";

    expect(() => getStripe()).not.toThrow();
    expect(getStripeWebhookSecret()).toBe("whsec_example");
  });

  it("rejects invalid prefixes and embedded control characters", () => {
    process.env.STRIPE_SECRET_KEY = "pk_test_not_a_secret";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_bad\nvalue";

    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY is invalid.");
    expect(() => getStripeWebhookSecret()).toThrow("STRIPE_WEBHOOK_SECRET is invalid.");
  });
});
