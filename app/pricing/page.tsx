import type { Metadata } from "next";
import { CircleDollarSign } from "lucide-react";
import { BillingButton } from "@/components/billing-button";
import { PageIntro } from "@/components/page-intro";
import { PricingSection } from "@/components/pricing-section";
import { formatUsd, paymentPlans } from "@/lib/payments/plans";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pricing", description: "Permanent Home Design AI credits through monthly plans and one-off packs.", alternates: { canonical: "/pricing" } };

export default async function PricingPage() {
  const packs = [paymentPlans.pack_40, paymentPlans.pack_120, paymentPlans.pack_300];
  let authenticated = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    authenticated = Boolean(user);
  } catch {
    // Pricing remains public when authentication is not configured.
  }
  return (
    <main id="main-content">
      <PageIntro eyebrow="Simple, permanent credits" title="Pay for ideas, not empty months." text="Choose a monthly plan for an ongoing balance or add a one-off pack. Credits accumulate and never expire." />
      <section className="site-shell py-16 sm:py-24">
        <PricingSection authenticated={authenticated} compact />
        <div className="mt-16 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div><span className="eyebrow">Credit packs</span><h2 className="section-title mt-5">Add more only when you need them.</h2></div>
          <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
            {packs.map((pack) => <article className="bg-[var(--white)] p-6" key={pack.id}><CircleDollarSign className="text-[var(--blue)]" size={22} /><div className="mt-10 text-4xl font-semibold tracking-[-0.05em]">{pack.creditsPerInvoice}</div><p className="mt-1 text-sm text-[var(--ink-soft)]">permanent credits</p><div className="mt-5 text-xl font-semibold">{formatUsd(pack.amount)}</div><div className="mt-5"><BillingButton authenticated={authenticated} planId={pack.id} variant="secondary">Buy {pack.creditsPerInvoice} credits</BillingButton></div></article>)}
          </div>
        </div>
        <div className="mt-14 border border-[var(--line)] bg-[var(--blue-pale)] p-6"><h2 className="text-lg font-semibold">How credits are used</h2><div className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><p><strong>Basic:</strong> Nano Banana 2 Lite, 1 credit per generation.</p><p><strong>Pro:</strong> Nano Banana 2 at 2K, 3 credits per generation.</p></div></div>
      </section>
    </main>
  );
}
