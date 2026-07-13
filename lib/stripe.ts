import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

export function getStripe() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    appInfo: { name: "Home Design AI", version: "0.1.0" },
  });
}

export const billingProducts = {
  starter: { kind: "subscription", credits: 80, priceEnv: "STRIPE_STARTER_PRICE_ID" },
  pro: { kind: "subscription", credits: 220, priceEnv: "STRIPE_PRO_PRICE_ID" },
  pack_40: { kind: "credit_pack", credits: 40, priceEnv: "STRIPE_PACK_40_PRICE_ID" },
  pack_120: { kind: "credit_pack", credits: 120, priceEnv: "STRIPE_PACK_120_PRICE_ID" },
  pack_300: { kind: "credit_pack", credits: 300, priceEnv: "STRIPE_PACK_300_PRICE_ID" },
} as const;

export type BillingProductKey = keyof typeof billingProducts;

export function findSubscriptionProductByPrice(priceId: string | null | undefined) {
  if (!priceId) return null;
  const entry = (Object.entries(billingProducts) as [BillingProductKey, (typeof billingProducts)[BillingProductKey]][])
    .find(([, product]) => product.kind === "subscription" && process.env[product.priceEnv] === priceId);
  return entry ? { key: entry[0], ...entry[1] } : null;
}
