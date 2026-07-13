import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireEnv } from "@/lib/env";
import { billingProducts, findSubscriptionProductByPrice, getStripe, type BillingProductKey } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function recordEvent(event: Stripe.Event) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("webhook_events").select("processed_at").eq("provider", "stripe").eq("event_id", event.id).maybeSingle();
  if (existing?.processed_at) return false;
  await admin.from("webhook_events").upsert({ provider: "stripe", event_id: event.id, payload: event as unknown as Record<string, unknown> }, { onConflict: "provider,event_id", ignoreDuplicates: true });
  return true;
}

async function userIdForCustomer(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return data?.id as string | undefined ?? null;
}

async function grantCredits(userId: string, amount: number, eventId: string, type: "purchase" | "subscription") {
  const admin = createAdminClient();
  const { error } = await admin.rpc("grant_credits", { p_user_id: userId, p_amount: amount, p_type: type, p_reference_id: `stripe:${eventId}` });
  if (error) throw new Error(`Stripe credits could not be granted: ${error.message}`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const productKey = session.metadata?.product as BillingProductKey | undefined;
  const product = productKey ? billingProducts[productKey] : null;
  const userId = session.metadata?.user_id ?? await userIdForCustomer(session.customer as string | Stripe.Customer | Stripe.DeletedCustomer | null);
  if (!userId || !product) return;
  const admin = createAdminClient();
  await admin.from("orders").upsert({
    user_id: userId,
    provider: "stripe",
    provider_order_id: session.id,
    external_event_id: eventId,
    kind: product.kind,
    product_key: productKey,
    amount_total: session.amount_total,
    currency: session.currency,
    status: session.payment_status,
    credits: product.kind === "credit_pack" ? product.credits : 0,
  }, { onConflict: "provider,provider_order_id" });
  if (product.kind === "credit_pack" && session.payment_status === "paid") await grantCredits(userId, product.credits, eventId, "purchase");
}

async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  const firstLine = invoice.lines.data[0];
  const priceId = firstLine?.pricing?.price_details?.price ?? (firstLine as unknown as { price?: { id?: string } }).price?.id;
  const product = findSubscriptionProductByPrice(typeof priceId === "string" ? priceId : null);
  const userId = await userIdForCustomer(invoice.customer);
  if (!product || !userId) return;
  await grantCredits(userId, product.credits, eventId, "subscription");
  const parent = invoice.parent as unknown as { subscription_details?: { subscription?: string | Stripe.Subscription } } | null;
  const subscriptionValue = parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscriptionValue === "string" ? subscriptionValue : subscriptionValue?.id;
  if (subscriptionId) {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    await upsertSubscription(subscription, userId);
  }
}

async function upsertSubscription(subscription: Stripe.Subscription, knownUserId?: string | null) {
  const userId = knownUserId ?? subscription.metadata.user_id ?? await userIdForCustomer(subscription.customer);
  if (!userId) return;
  const firstItem = subscription.items.data[0];
  const periodEnd = firstItem?.current_period_end;
  const admin = createAdminClient();
  await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripe_price_id: firstItem?.price.id ?? null,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  }, { onConflict: "stripe_subscription_id" });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (cause) {
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    const shouldProcess = await recordEvent(event);
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });
    if (event.type === "checkout.session.completed") await handleCheckoutCompleted(event.data.object, event.id);
    if (event.type === "invoice.paid") await handleInvoicePaid(event.data.object, event.id);
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) await upsertSubscription(event.data.object as Stripe.Subscription);
    await createAdminClient().from("webhook_events").update({ processed_at: new Date().toISOString() }).eq("provider", "stripe").eq("event_id", event.id);
    return NextResponse.json({ received: true });
  } catch (cause) {
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Stripe event processing failed." }, { status: 500 });
  }
}
