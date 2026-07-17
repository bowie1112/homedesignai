import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { PricingSection } from "@/components/pricing-section";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pricing", description: "Monthly and yearly Home Design AI plans, plus permanent one-time credit packs.", alternates: { canonical: "/pricing" } };

export default async function PricingPage() {
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
      <PageIntro eyebrow="Flexible plans and credits" title="Choose how your ideas are funded." text="Subscribe monthly, save with annual billing, or add a permanent one-time credit pack." />
      <section className="site-shell py-16 sm:py-24">
        <PricingSection authenticated={authenticated} compact />
        <div className="mt-14 border border-[var(--line)] bg-[var(--blue-pale)] p-6">
          <h2 className="text-lg font-semibold">How billing and credits work</h2>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Monthly:</strong> Credits are added after every successful monthly renewal and accumulate in your account.</p>
            <p><strong>Yearly:</strong> The full annual credit allowance is added after the annual payment.</p>
            <p><strong>One-time:</strong> Pack credits are permanent and never expire while your account remains active.</p>
            <p><strong>Refunds:</strong> A first purchase may be refundable within 7 days only when all paid credits remain unused.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
