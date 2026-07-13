import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl, ConfigurationError, requireEnv } from "@/lib/env";
import { billingProducts, getStripe, type BillingProductKey } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({ product: z.enum(Object.keys(billingProducts) as [BillingProductKey, ...BillingProductKey[]]) });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Sign in before opening checkout." }, { status: 401 });
    const { product: productKey } = requestSchema.parse(await request.json());
    const product = billingProducts[productKey];
    const stripe = getStripe();
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    let customerId = profile?.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }
    const metadata = { user_id: user.id, product: productKey, kind: product.kind, credits: String(product.credits) };
    const session = await stripe.checkout.sessions.create({
      mode: product.kind === "subscription" ? "subscription" : "payment",
      customer: customerId,
      line_items: [{ price: requireEnv(product.priceEnv), quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${getAppUrl()}/account?checkout=success`,
      cancel_url: `${getAppUrl()}/pricing?checkout=cancelled`,
      metadata,
      ...(product.kind === "subscription" ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
    });
    return NextResponse.json({ url: session.url });
  } catch (cause) {
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "Stripe checkout is not configured yet." }, { status: 503 });
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Checkout could not be created." }, { status: 400 });
  }
}
