import type { Metadata } from "next";
import { CircleDollarSign } from "lucide-react";
import { BillingButton } from "@/components/billing-button";
import { PageIntro } from "@/components/page-intro";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = { title: "Pricing", description: "Permanent Home Design AI credits through monthly plans and one-off packs.", alternates: { canonical: "/pricing" } };

export default function PricingPage() {
  const packs = [{ key: "pack_40", credits: 40, price: "$6" }, { key: "pack_120", credits: 120, price: "$15" }, { key: "pack_300", credits: 300, price: "$30" }];
  return (
    <main id="main-content">
      <PageIntro eyebrow="Simple, permanent credits" title="Pay for ideas, not empty months." text="Choose a monthly plan for an ongoing balance or add a one-off pack. Credits accumulate and never expire." />
      <section className="site-shell py-16 sm:py-24">
        <PricingSection compact />
        <div className="mt-16 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div><span className="eyebrow">Credit packs</span><h2 className="section-title mt-5">Add more only when you need them.</h2></div>
          <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
            {packs.map((pack) => <article className="bg-[var(--white)] p-6" key={pack.key}><CircleDollarSign className="text-[var(--blue)]" size={22} /><div className="mt-10 text-4xl font-semibold tracking-[-0.05em]">{pack.credits}</div><p className="mt-1 text-sm text-[var(--ink-soft)]">permanent credits</p><div className="mt-5 text-xl font-semibold">{pack.price}</div><div className="mt-5"><BillingButton product={pack.key} variant="secondary">Buy {pack.credits} credits</BillingButton></div></article>)}
          </div>
        </div>
        <div className="mt-14 border border-[var(--line)] bg-[var(--blue-pale)] p-6"><h2 className="text-lg font-semibold">How credits are used</h2><div className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><p><strong>Basic:</strong> Nano Banana 2 Lite, 1 credit per generation.</p><p><strong>Pro:</strong> Nano Banana 2 at 2K, 3 credits per generation.</p></div></div>
      </section>
    </main>
  );
}
