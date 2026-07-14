import { Check, MoveRight } from "lucide-react";
import Link from "next/link";
import { BillingButton } from "@/components/billing-button";
import { formatUsd, paymentPlans } from "@/lib/payments/plans";

const plans = [paymentPlans.starter, paymentPlans.pro];

export function PricingSection({ authenticated = false, compact = false }: { authenticated?: boolean; compact?: boolean }) {
  return (
    <section className={compact ? "" : "content-auto bg-[var(--ink)] py-20 text-[var(--paper)] sm:py-28"} id="pricing">
      <div className={compact ? "" : "site-shell"}>
        <div className={`grid gap-10 ${compact ? "" : "lg:grid-cols-[0.8fr_1.2fr] lg:items-end"}`}>
          <div>
            <span className={`eyebrow ${compact ? "" : "text-[color:oklch(76%_0.1_258)]"}`}>Simple pricing</span>
            <h2 className={`section-title mt-5 ${compact ? "" : "text-[var(--paper)]"}`}>Credits that wait for your next idea.</h2>
            <p className={`lede mt-6 ${compact ? "" : "text-[color:oklch(79%_0.02_84)]"}`}>
              Subscribe for a monthly balance or add a one-off pack. Every credit accumulates and stays available.
            </p>
          </div>
          <div className="grid gap-px bg-[color:oklch(74%_0.02_257/0.35)] sm:grid-cols-2">
            {plans.map((plan) => (
              <article className={`relative p-6 sm:p-8 ${plan.featured ? "bg-[var(--blue)] text-white" : compact ? "bg-[var(--white)]" : "bg-[color:oklch(26%_0.035_257)]"}`} key={plan.id}>
                {plan.featured ? <span className="absolute right-4 top-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:oklch(88%_0.04_258)]">Best value</span> : null}
                <h3 className="text-sm font-bold uppercase tracking-[0.1em]">{plan.id === "starter" ? "Starter" : "Pro"}</h3>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-[-0.06em]">{formatUsd(plan.amount)}</span>
                  <span className={`pb-1 text-sm ${plan.featured ? "text-[color:oklch(90%_0.03_258)]" : compact ? "text-[var(--ink-soft)]" : "text-[color:oklch(78%_0.02_84)]"}`}>/ month</span>
                </div>
                <p className="mt-2 text-sm font-bold">{plan.creditsPerInvoice} credits each month</p>
                <p className={`mt-5 min-h-12 text-sm leading-6 ${plan.featured ? "text-[color:oklch(93%_0.02_258)]" : compact ? "text-[var(--ink-soft)]" : "text-[color:oklch(78%_0.02_84)]"}`}>{plan.description}</p>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li className="flex items-center gap-2 text-sm" key={feature}><Check size={15} /> {feature}</li>
                  ))}
                </ul>
                <div className="mt-8">
                  {compact ? (
                    <BillingButton authenticated={authenticated} planId={plan.id} variant={plan.featured ? "primary" : "secondary"}>Choose {plan.id === "starter" ? "Starter" : "Pro"}</BillingButton>
                  ) : (
                    <Link className={`w-full ${plan.featured ? "button-secondary border-white bg-white text-[var(--blue-deep)]" : "button-primary"}`} href={`/pricing?plan=${plan.id}`}>
                      Choose {plan.id === "starter" ? "Starter" : "Pro"} <MoveRight size={16} />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
