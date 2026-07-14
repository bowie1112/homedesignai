export const paymentPlans = {
  starter: {
    id: "starter",
    name: "Home Design AI Starter",
    kind: "subscription",
    amount: 900,
    currency: "usd",
    creditsPerInvoice: 80,
    interval: "month",
    description: "For exploring layouts and a handful of room directions.",
    features: ["Basic and Pro models", "Private design history", "Credits never expire"],
    featured: false,
  },
  pro: {
    id: "pro",
    name: "Home Design AI Pro",
    kind: "subscription",
    amount: 1900,
    currency: "usd",
    creditsPerInvoice: 220,
    interval: "month",
    description: "For active renovators, property teams, and design studios.",
    features: ["Basic and Pro models", "2K Pro output", "Private design history", "Credits never expire"],
    featured: true,
  },
  pack_40: {
    id: "pack_40",
    name: "Home Design AI — 40 Credits",
    kind: "one_time",
    amount: 600,
    currency: "usd",
    creditsPerInvoice: 40,
  },
  pack_120: {
    id: "pack_120",
    name: "Home Design AI — 120 Credits",
    kind: "one_time",
    amount: 1500,
    currency: "usd",
    creditsPerInvoice: 120,
  },
  pack_300: {
    id: "pack_300",
    name: "Home Design AI — 300 Credits",
    kind: "one_time",
    amount: 3000,
    currency: "usd",
    creditsPerInvoice: 300,
  },
} as const;

export type PaymentPlanId = keyof typeof paymentPlans;
export type PaymentPlan = (typeof paymentPlans)[PaymentPlanId];
export type SubscriptionPlan = Extract<PaymentPlan, { kind: "subscription" }>;

export const paymentPlanIds = Object.keys(paymentPlans) as [PaymentPlanId, ...PaymentPlanId[]];

export function getPaymentPlan(planId: string | null | undefined) {
  if (!planId || !(planId in paymentPlans)) return null;
  return paymentPlans[planId as PaymentPlanId];
}

export function formatUsd(amount: number) {
  return `$${amount / 100}`;
}

export function creditsGrantedForPaidInvoice(plan: { creditsPerInvoice: number }) {
  return plan.creditsPerInvoice;
}
