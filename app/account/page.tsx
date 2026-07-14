import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { PortalButton } from "@/components/portal-button";
import { SignOutButton } from "@/components/sign-out-button";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  let balance: number | null = null;
  let subscription: { status: string; current_period_end: string | null } | null = null;
  let stripeCustomerId: string | null = null;
  let signedIn = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      signedIn = true;
      const admin = createAdminClient();
      const [accountResult, subscriptionResult, profileResult] = await Promise.all([
        admin.from("credit_accounts").select("balance").eq("user_id", user.id).maybeSingle(),
        admin.from("subscriptions").select("status, current_period_end").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle(),
      ]);
      balance = accountResult.data?.balance ?? 0;
      subscription = subscriptionResult.data;
      stripeCustomerId = profileResult.data?.stripe_customer_id ?? null;
    }
  } catch {
    // The page remains useful before environment configuration.
  }
  return (
    <main id="main-content">
      <PageIntro eyebrow="Account" title="Credits and billing" text="Review your current balance, subscription, and payment settings." />
      <section className="site-shell py-16 sm:py-24">
        {!signedIn ? (
          <div className="mb-5 border border-[var(--line)] bg-[var(--blue-pale)] p-4 text-sm">
            Sign in to load your live account state.
            <Link className="ml-1 font-bold text-[var(--blue-deep)] underline" href="/auth/sign-in">Sign in or create an account</Link>
          </div>
        ) : <div className="mb-5 flex justify-end"><SignOutButton /></div>}
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="paper-panel p-6">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-soft)]">Credit balance</span>
            <div className="mt-8 text-5xl font-semibold tabular-nums tracking-[-0.06em]">{balance ?? "—"}</div>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">Permanent credits available to use.</p>
          </article>
          <article className="paper-panel p-6">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-soft)]">Subscription</span>
            <div className="mt-8 text-2xl font-semibold capitalize">{subscription?.status ?? "No active plan"}</div>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{subscription?.current_period_end ? `Current period ends ${new Date(subscription.current_period_end).toLocaleDateString("en-US", { dateStyle: "medium" })}.` : "Choose a plan whenever you need a recurring balance."}</p>
          </article>
          <article className="paper-panel p-6">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-soft)]">Billing</span>
            {!signedIn ? (
              <><p className="mt-8 text-sm leading-6 text-[var(--ink-soft)]">Sign in before purchasing credits or managing billing.</p><Link className="button-secondary mt-5" href="/auth/sign-in?next=%2Faccount">Sign in</Link></>
            ) : stripeCustomerId ? (
              <><p className="mt-8 text-sm leading-6 text-[var(--ink-soft)]">Update payment details or cancel in Stripe&apos;s secure customer portal.</p><div className="mt-5"><PortalButton /></div></>
            ) : (
              <><p className="mt-8 text-sm leading-6 text-[var(--ink-soft)]">Billing management becomes available after your first plan or credit purchase.</p><Link className="button-secondary mt-5" href="/pricing">View plans and credit packs</Link></>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
