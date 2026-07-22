import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getAppUrl, ConfigurationError } from "@/lib/env";
import { paymentPlans, publicPaymentPlanIds } from "@/lib/payments/plans";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({ planId: z.enum(publicPaymentPlanIds) }).strict();

export async function POST(request: NextRequest) {
  let orderId: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Sign in before opening checkout." }, { status: 401 });

    const { planId } = requestSchema.parse(await request.json());
    const plan = paymentPlans[planId];
    const stripe = getStripe();
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    let customerId = profile?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
      customerId = customer.id;
      const { error: profileError } = await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
      if (profileError) throw new Error(`Stripe customer could not be saved: ${profileError.message}`);
    }

    const { data: order, error: orderError } = await admin.from("orders").insert({
      user_id: user.id,
      provider: "stripe",
      provider_order_id: null,
      external_event_id: null,
      stripe_customer_id: customerId,
      kind: plan.kind === "subscription" ? "subscription" : "credit_pack",
      product_key: planId,
      amount_total: plan.amount,
      currency: plan.currency,
      status: "pending",
      credits: plan.creditsPerInvoice,
    }).select("id").single();
    if (orderError || !order) throw new Error(`Checkout order could not be created: ${orderError?.message ?? "unknown error"}`);
    orderId = order.id as string;

    const metadata = {
      orderId,
      userId: user.id,
      email: user.email ?? "",
      planId,
      pricingVersion: "v2",
      credits: String(plan.creditsPerInvoice),
      kind: plan.kind,
    };
    const session = await stripe.checkout.sessions.create({
      mode: plan.kind === "subscription" ? "subscription" : "payment",
      customer: customerId,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: plan.currency,
          unit_amount: plan.amount,
          product_data: { name: plan.name, metadata: { planId } },
          ...(plan.kind === "subscription" ? { recurring: { interval: plan.interval } } : {}),
        },
      }],
      allow_promotion_codes: true,
      success_url: `${getAppUrl()}/account?checkout=success`,
      cancel_url: `${getAppUrl()}/pricing?checkout=cancelled`,
      metadata,
      ...(plan.kind === "subscription" ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
    });

    const { error: sessionOrderError } = await admin.from("orders").update({
      provider_order_id: session.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
      status: session.status ?? "open",
    }).eq("id", orderId);
    if (sessionOrderError) throw new Error(`Checkout session could not be saved: ${sessionOrderError.message}`);

    return NextResponse.json({ url: session.url });
  } catch (cause) {
    console.error("Checkout creation failed.", { cause, orderId });
    if (orderId) {
      const { error } = await createAdminClient().from("orders").update({ status: "failed" }).eq("id", orderId);
      if (error) console.error("Failed to mark checkout order as failed.", { error, orderId });
    }
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "Stripe checkout is not configured yet." }, { status: 503 });
    if (cause instanceof z.ZodError) return NextResponse.json({ message: "Choose a valid plan before opening checkout." }, { status: 400 });
    if (cause instanceof Stripe.errors.StripeError) return NextResponse.json({ message: "Secure checkout is temporarily unavailable. Please try again." }, { status: 502 });
    return NextResponse.json({ message: "Checkout could not be created. Please try again." }, { status: 500 });
  }
}
