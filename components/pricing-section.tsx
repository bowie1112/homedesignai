"use client";

import { Check, MoveRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BillingButton } from "@/components/billing-button";
import { trackGaEvent, trackProductEvent } from "@/lib/analytics";
import {
  formatUsd,
  publicPaymentPlans,
  type BillingMode,
  type PublicPaymentPlan,
} from "@/lib/payments/plans";

const billingModes: Array<{ id: BillingMode; label: string }> = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "one_time", label: "One-time" },
];

const tierLabels = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
} as const;

function planPrice(plan: PublicPaymentPlan) {
  if (plan.billingMode === "yearly" && "monthlyEquivalentAmount" in plan) {
    return {
      amount: formatUsd(plan.monthlyEquivalentAmount),
      suffix: "/ month",
      detail: `${formatUsd(plan.amount)} billed annually`,
    };
  }
  if (plan.billingMode === "monthly") {
    return { amount: formatUsd(plan.amount), suffix: "/ month", detail: null };
  }
  return { amount: formatUsd(plan.amount), suffix: " one-time", detail: "Credits never expire" };
}

function creditsLabel(plan: PublicPaymentPlan) {
  if (plan.billingMode === "yearly") return `${plan.creditsPerInvoice.toLocaleString("en-US")} credits granted annually`;
  if (plan.billingMode === "monthly") return `${plan.creditsPerInvoice.toLocaleString("en-US")} credits each month`;
  return `${plan.creditsPerInvoice.toLocaleString("en-US")} permanent credits`;
}

function generationLabel(plan: PublicPaymentPlan) {
  const basic = plan.creditsPerInvoice.toLocaleString("en-US");
  const pro = Math.floor(plan.creditsPerInvoice / 3).toLocaleString("en-US");
  return `Up to ${basic} Basic or ${pro} Pro generations`;
}

function PricingCard({
  authenticated,
  compact,
  plan,
}: {
  authenticated: boolean;
  compact: boolean;
  plan: PublicPaymentPlan;
}) {
  const highlighted = plan.tier === "professional";
  const price = planPrice(plan);
  const label = tierLabels[plan.tier];

  return (
    <article
      className={`relative flex min-w-0 flex-col p-6 sm:p-7 ${
        highlighted
          ? "bg-[var(--blue)] text-white"
          : compact
            ? "bg-[var(--white)]"
            : "bg-[color:oklch(26%_0.035_257)]"
      }`}
    >
      {"badge" in plan && plan.badge ? (
        <span className={`mb-5 w-fit text-[10px] font-bold uppercase tracking-[0.12em] ${highlighted ? "text-[color:oklch(91%_0.03_258)]" : "text-[var(--green)]"}`}>
          {plan.badge}
        </span>
      ) : <div className="h-5" aria-hidden="true" />}
      <h3 className="text-sm font-bold uppercase tracking-[0.1em]">{label}</h3>
      <p className={`mt-2 min-h-12 text-sm leading-6 ${highlighted ? "text-[color:oklch(93%_0.02_258)]" : compact ? "text-[var(--ink-soft)]" : "text-[color:oklch(78%_0.02_84)]"}`}>
        {plan.description}
      </p>
      <div className="mt-6 flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
        <span className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{price.amount}</span>
        <span className={`pb-1 text-sm ${highlighted ? "text-[color:oklch(90%_0.03_258)]" : compact ? "text-[var(--ink-soft)]" : "text-[color:oklch(78%_0.02_84)]"}`}>{price.suffix}</span>
      </div>
      {price.detail ? <p className="mt-2 text-xs font-semibold">{price.detail}</p> : null}
      <p className="mt-3 text-sm font-bold">{creditsLabel(plan)}</p>
      <p className={`mt-1 text-xs ${highlighted ? "text-[color:oklch(93%_0.02_258)]" : compact ? "text-[var(--ink-soft)]" : "text-[color:oklch(78%_0.02_84)]"}`}>{generationLabel(plan)}</p>
      {plan.billingMode === "yearly" ? <p className={`mt-1 text-xs font-bold ${highlighted ? "text-[color:oklch(89%_0.06_150)]" : "text-[var(--green)]"}`}>Save 20% vs monthly</p> : null}
      <div className={`my-6 h-px ${highlighted ? "bg-[color:oklch(100%_0_0/0.24)]" : compact ? "bg-[var(--line)]" : "bg-[color:oklch(74%_0.02_257/0.28)]"}`} />
      <p className="text-sm font-bold">What&apos;s included:</p>
      <ul className="mt-4 space-y-2.5">
        {plan.features.map((feature) => (
          <li className="flex items-start gap-2 text-sm leading-5" key={feature}>
            <Check className={`mt-0.5 shrink-0 ${highlighted ? "text-white" : "text-[var(--green)]"}`} size={15} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        {compact ? (
          <BillingButton
            authenticated={authenticated}
            buttonClassName={highlighted ? "border-white bg-white" : undefined}
            buttonStyle={highlighted ? { color: "var(--blue-deep)" } : undefined}
            planId={plan.id}
            variant="secondary"
          >
            {plan.billingMode === "one_time" ? `Buy ${label} pack` : `Choose ${label}`}
            {highlighted ? <MoveRight size={16} /> : null}
          </BillingButton>
        ) : (
          <Link
            className={`w-full ${highlighted ? "button-secondary border-white bg-white" : "button-primary"}`}
            href={`/pricing?plan=${plan.id}`}
            style={highlighted ? { color: "var(--blue-deep)" } : undefined}
          >
            View {label} <MoveRight size={16} />
          </Link>
        )}
      </div>
    </article>
  );
}

export function PricingSection({ authenticated = false, compact = false }: { authenticated?: boolean; compact?: boolean }) {
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");
  const plans = publicPaymentPlans.filter((plan) => plan.billingMode === billingMode);

  useEffect(() => {
    const properties = { pricing_version: "v2", billing_mode: "monthly" };
    if (authenticated) void trackProductEvent({ eventName: "pricing_viewed", surface: "pricing", properties });
    else trackGaEvent("pricing_viewed", { ...properties, surface: "pricing" });
  }, [authenticated]);

  const selectBillingMode = (mode: BillingMode) => {
    setBillingMode(mode);
    if (mode === billingMode) return;
    const properties = { pricing_version: "v2", billing_mode: mode };
    if (authenticated) void trackProductEvent({ eventName: "billing_mode_selected", surface: "pricing", properties });
    else trackGaEvent("billing_mode_selected", { ...properties, surface: "pricing" });
  };

  return (
    <section className={compact ? "" : "content-auto bg-[var(--ink)] py-20 text-[var(--paper)] sm:py-28"} id="pricing">
      <div className={compact ? "" : "site-shell"}>
        <div className={compact ? "" : "grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start"}>
          <div>
            <span className={`eyebrow ${compact ? "" : "text-[color:oklch(76%_0.1_258)]"}`}>Simple pricing</span>
            <h2 className={`section-title mt-5 ${compact ? "" : "text-[var(--paper)]"}`}>Choose the pace that fits your work.</h2>
            <p className={`lede mt-6 ${compact ? "" : "text-[color:oklch(79%_0.02_84)]"}`}>
              Subscribe monthly or yearly, or buy permanent credits whenever you need them.
            </p>
          </div>
          <div className={compact ? "mt-9" : ""}>
            <div className="mb-6 flex overflow-x-auto" role="tablist" aria-label="Billing period">
              <div className={`inline-flex min-w-max border p-1 ${compact ? "border-[var(--line)] bg-[var(--white)]" : "border-[color:oklch(74%_0.02_257/0.35)] bg-[color:oklch(26%_0.035_257)]"}`}>
                {billingModes.map((mode) => (
                  <button
                    aria-selected={billingMode === mode.id}
                    className={`min-h-10 px-4 text-sm font-bold transition-colors sm:px-5 ${billingMode === mode.id ? "bg-[var(--blue)] text-white" : compact ? "text-[var(--ink-soft)] hover:text-[var(--ink)]" : "text-[color:oklch(79%_0.02_84)] hover:text-white"}`}
                    key={mode.id}
                    onClick={() => selectBillingMode(mode.id)}
                    role="tab"
                    type="button"
                  >
                    {mode.label}
                    {mode.id === "yearly" ? <span className={`ml-2 text-[10px] uppercase ${billingMode === mode.id ? "text-[color:oklch(91%_0.05_150)]" : "text-[var(--green)]"}`}>Save 20%</span> : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-px bg-[color:oklch(74%_0.02_257/0.35)] md:grid-cols-3" role="tabpanel">
              {plans.map((plan) => <PricingCard authenticated={authenticated} compact={compact} key={plan.id} plan={plan} />)}
            </div>
            <p className={`mt-5 text-xs leading-5 ${compact ? "text-[var(--ink-soft)]" : "text-[color:oklch(79%_0.02_84)]"}`}>
              Basic uses 1 credit for a 1K image. Pro uses 3 credits for a 2K image. Mix both models whenever you need them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
