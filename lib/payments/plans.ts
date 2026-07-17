export type BillingMode = "monthly" | "yearly" | "one_time";
export type PlanTier = "starter" | "professional" | "enterprise";

type PlanBadge = "Most Popular" | "Best Value";

type PlanDisplay = {
  tier: PlanTier;
  billingMode: BillingMode;
  description: string;
  features: readonly string[];
  badge?: PlanBadge;
  visible: boolean;
  monthlyEquivalentAmount?: number;
};

type SubscriptionPlanConfig = PlanDisplay & {
  id: string;
  name: string;
  kind: "subscription";
  amount: number;
  currency: "usd";
  creditsPerInvoice: number;
  interval: "month" | "year";
};

type OneTimePlanConfig = PlanDisplay & {
  id: string;
  name: string;
  kind: "one_time";
  amount: number;
  currency: "usd";
  creditsPerInvoice: number;
};

type PaymentPlanConfig = SubscriptionPlanConfig | OneTimePlanConfig;

const subscriptionFeatures = {
  starter: [
    "Up to 200 generations",
    "AI floor plan generation",
    "AI floor plan editing",
    "AI visualization",
    "3 floor plan creators",
    "3 floor plan designers",
    "DXF export",
    "Template editing",
  ],
  professional: [
    "Up to 600 generations",
    "AI floor plan generation",
    "AI floor plan editing",
    "AI visualization",
    "10 floor plan creators",
    "10 floor plan designers",
    "DXF export",
    "Template editing",
  ],
  enterprise: [
    "Up to 1500 generations",
    "AI floor plan generation",
    "AI floor plan editing",
    "AI visualization",
    "Unlimited floor plan creators",
    "Unlimited floor plan designers",
    "DXF export",
    "Template editing",
  ],
} as const;

const packFeatures = {
  starter: [
    "Credits never expire",
    "200 Basic generations",
    "50 Pro generations",
    "4K quality export",
    "1 Floor Plan Project",
    "No watermark downloads",
    "All design permissions",
    "Commercial usage rights",
  ],
  professional: [
    "Credits never expire",
    "600 Basic generations",
    "150 Pro generations",
    "4K quality export",
    "1 Floor Plan Project",
    "No watermark downloads",
    "All design permissions",
    "Commercial usage rights",
    "Priority processing",
  ],
  enterprise: [
    "Credits never expire",
    "1,500 Basic generations",
    "375 Pro generations",
    "4K quality export",
    "1 Floor Plan Project",
    "No watermark downloads",
    "All design permissions",
    "Commercial usage rights",
    "Priority processing",
  ],
} as const;

export const paymentPlans = {
  starter_monthly: {
    id: "starter_monthly",
    name: "Home Design AI Starter Monthly",
    tier: "starter",
    billingMode: "monthly",
    kind: "subscription",
    amount: 1999,
    currency: "usd",
    creditsPerInvoice: 200,
    interval: "month",
    description: "For homeowners and first-time users running the core AI workflow.",
    features: subscriptionFeatures.starter,
    visible: true,
  },
  professional_monthly: {
    id: "professional_monthly",
    name: "Home Design AI Professional Monthly",
    tier: "professional",
    billingMode: "monthly",
    kind: "subscription",
    amount: 4999,
    currency: "usd",
    creditsPerInvoice: 600,
    interval: "month",
    description: "For designers, agents, and freelancers who need the complete workflow.",
    features: subscriptionFeatures.professional,
    badge: "Most Popular",
    visible: true,
  },
  enterprise_monthly: {
    id: "enterprise_monthly",
    name: "Home Design AI Enterprise Monthly",
    tier: "enterprise",
    billingMode: "monthly",
    kind: "subscription",
    amount: 9999,
    currency: "usd",
    creditsPerInvoice: 1500,
    interval: "month",
    description: "For studios, agencies, and teams that need collaboration and scale.",
    features: subscriptionFeatures.enterprise,
    badge: "Best Value",
    visible: true,
  },
  starter_yearly: {
    id: "starter_yearly",
    name: "Home Design AI Starter Yearly",
    tier: "starter",
    billingMode: "yearly",
    kind: "subscription",
    amount: 11900,
    monthlyEquivalentAmount: 999,
    currency: "usd",
    creditsPerInvoice: 2400,
    interval: "year",
    description: "For homeowners and first-time users running the core AI workflow.",
    features: subscriptionFeatures.starter,
    visible: true,
  },
  professional_yearly: {
    id: "professional_yearly",
    name: "Home Design AI Professional Yearly",
    tier: "professional",
    billingMode: "yearly",
    kind: "subscription",
    amount: 29900,
    monthlyEquivalentAmount: 2499,
    currency: "usd",
    creditsPerInvoice: 7200,
    interval: "year",
    description: "For designers, agents, and freelancers who need the complete workflow.",
    features: subscriptionFeatures.professional,
    badge: "Most Popular",
    visible: true,
  },
  enterprise_yearly: {
    id: "enterprise_yearly",
    name: "Home Design AI Enterprise Yearly",
    tier: "enterprise",
    billingMode: "yearly",
    kind: "subscription",
    amount: 59900,
    monthlyEquivalentAmount: 4999,
    currency: "usd",
    creditsPerInvoice: 18000,
    interval: "year",
    description: "For studios, agencies, and teams that need collaboration and scale.",
    features: subscriptionFeatures.enterprise,
    badge: "Best Value",
    visible: true,
  },
  pack_starter: {
    id: "pack_starter",
    name: "Home Design AI Starter Credit Pack",
    tier: "starter",
    billingMode: "one_time",
    kind: "one_time",
    amount: 2999,
    currency: "usd",
    creditsPerInvoice: 200,
    description: "Perfect for trying out our AI design tools.",
    features: packFeatures.starter,
    visible: true,
  },
  pack_professional: {
    id: "pack_professional",
    name: "Home Design AI Professional Credit Pack",
    tier: "professional",
    billingMode: "one_time",
    kind: "one_time",
    amount: 7999,
    currency: "usd",
    creditsPerInvoice: 600,
    description: "Best for regular home design projects.",
    features: packFeatures.professional,
    badge: "Most Popular",
    visible: true,
  },
  pack_enterprise: {
    id: "pack_enterprise",
    name: "Home Design AI Enterprise Credit Pack",
    tier: "enterprise",
    billingMode: "one_time",
    kind: "one_time",
    amount: 14900,
    currency: "usd",
    creditsPerInvoice: 1500,
    description: "Ideal for professionals and agencies.",
    features: packFeatures.enterprise,
    badge: "Best Value",
    visible: true,
  },

  // Hidden legacy plans remain resolvable for renewals and delayed Stripe events.
  starter: {
    id: "starter",
    name: "Home Design AI Starter",
    tier: "starter",
    billingMode: "monthly",
    kind: "subscription",
    amount: 900,
    currency: "usd",
    creditsPerInvoice: 80,
    interval: "month",
    description: "For exploring layouts and a handful of room directions.",
    features: ["Basic and Pro models", "Private design history", "Credits never expire"],
    visible: false,
  },
  pro: {
    id: "pro",
    name: "Home Design AI Pro",
    tier: "professional",
    billingMode: "monthly",
    kind: "subscription",
    amount: 1900,
    currency: "usd",
    creditsPerInvoice: 220,
    interval: "month",
    description: "For active renovators, property teams, and design studios.",
    features: ["Basic and Pro models", "2K Pro output", "Private design history", "Credits never expire"],
    badge: "Most Popular",
    visible: false,
  },
  pack_40: {
    id: "pack_40",
    name: "Home Design AI — 40 Credits",
    tier: "starter",
    billingMode: "one_time",
    kind: "one_time",
    amount: 600,
    currency: "usd",
    creditsPerInvoice: 40,
    description: "Legacy 40-credit pack.",
    features: ["Credits never expire"],
    visible: false,
  },
  pack_120: {
    id: "pack_120",
    name: "Home Design AI — 120 Credits",
    tier: "professional",
    billingMode: "one_time",
    kind: "one_time",
    amount: 1500,
    currency: "usd",
    creditsPerInvoice: 120,
    description: "Legacy 120-credit pack.",
    features: ["Credits never expire"],
    visible: false,
  },
  pack_300: {
    id: "pack_300",
    name: "Home Design AI — 300 Credits",
    tier: "enterprise",
    billingMode: "one_time",
    kind: "one_time",
    amount: 3000,
    currency: "usd",
    creditsPerInvoice: 300,
    description: "Legacy 300-credit pack.",
    features: ["Credits never expire"],
    visible: false,
  },
} as const satisfies Record<string, PaymentPlanConfig>;

export const publicPaymentPlanIds = [
  "starter_monthly",
  "professional_monthly",
  "enterprise_monthly",
  "starter_yearly",
  "professional_yearly",
  "enterprise_yearly",
  "pack_starter",
  "pack_professional",
  "pack_enterprise",
] as const;

export type PaymentPlanId = keyof typeof paymentPlans;
export type PublicPaymentPlanId = (typeof publicPaymentPlanIds)[number];
export type PaymentPlan = (typeof paymentPlans)[PaymentPlanId];
export type PublicPaymentPlan = (typeof paymentPlans)[PublicPaymentPlanId];
export type SubscriptionPlan = Extract<PaymentPlan, { kind: "subscription" }>;

export const paymentPlanIds = Object.keys(paymentPlans) as [PaymentPlanId, ...PaymentPlanId[]];
export const publicPaymentPlans = publicPaymentPlanIds.map((planId) => paymentPlans[planId]);

export function getPaymentPlan(planId: string | null | undefined) {
  if (!planId || !(planId in paymentPlans)) return null;
  return paymentPlans[planId as PaymentPlanId];
}

export function formatUsd(amount: number) {
  const dollars = amount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
  }).format(dollars);
}

export function creditsGrantedForPaidInvoice(plan: { creditsPerInvoice: number }) {
  return plan.creditsPerInvoice;
}
