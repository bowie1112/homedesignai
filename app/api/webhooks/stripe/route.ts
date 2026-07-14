import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { creditsGrantedForPaidInvoice, getPaymentPlan, type PaymentPlanId } from "@/lib/payments/plans";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function recordEvent(event: Stripe.Event) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("webhook_events").select("processed_at").eq("provider", "stripe").eq("event_id", event.id).maybeSingle();
  if (existing?.processed_at) return false;
  const { error } = await admin.from("webhook_events").upsert({ provider: "stripe", event_id: event.id, payload: event as unknown as Record<string, unknown> }, { onConflict: "provider,event_id", ignoreDuplicates: true });
  if (error) throw new Error(`Stripe event could not be recorded: ${error.message}`);
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

function stripeObjectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function subscriptionIdForInvoice(invoice: Stripe.Invoice) {
  const parent = invoice.parent as unknown as { subscription_details?: { subscription?: string | Stripe.Subscription } } | null;
  return stripeObjectId(parent?.subscription_details?.subscription);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const planId = session.metadata?.planId ?? session.metadata?.product;
  const plan = getPaymentPlan(planId);
  const userId = session.metadata?.userId ?? session.metadata?.user_id ?? await userIdForCustomer(session.customer as string | Stripe.Customer | Stripe.DeletedCustomer | null);
  if (!userId || !plan) return;
  const admin = createAdminClient();
  const orderUpdate = {
    provider_order_id: session.id,
    external_event_id: eventId,
    stripe_customer_id: stripeObjectId(session.customer as string | Stripe.Customer | Stripe.DeletedCustomer | null),
    stripe_subscription_id: stripeObjectId(session.subscription as string | Stripe.Subscription | null),
    stripe_payment_intent_id: stripeObjectId(session.payment_intent as string | Stripe.PaymentIntent | null),
    product_key: planId as PaymentPlanId,
    amount_total: session.amount_total,
    currency: session.currency,
    status: session.payment_status,
    credits: plan.creditsPerInvoice,
  };
  const orderId = session.metadata?.orderId;
  if (orderId) {
    const { error } = await admin.from("orders").update(orderUpdate).eq("id", orderId).eq("user_id", userId);
    if (error) throw new Error(`Stripe order could not be updated: ${error.message}`);
  } else {
    const { error } = await admin.from("orders").upsert({
      ...orderUpdate,
      user_id: userId,
      provider: "stripe",
      kind: plan.kind === "subscription" ? "subscription" : "credit_pack",
    }, { onConflict: "provider,provider_order_id" });
    if (error) throw new Error(`Stripe order could not be recorded: ${error.message}`);
  }
  if (plan.kind === "one_time" && session.payment_status === "paid") {
    await grantCredits(userId, plan.creditsPerInvoice, eventId, "purchase");
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  const subscriptionId = subscriptionIdForInvoice(invoice);
  if (!subscriptionId) return;
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const planId = subscription.metadata.planId ?? subscription.metadata.product;
  const plan = getPaymentPlan(planId);
  const userId = subscription.metadata.userId ?? subscription.metadata.user_id ?? await userIdForCustomer(subscription.customer);
  if (!plan || plan.kind !== "subscription" || !userId) return;
  await grantCredits(userId, creditsGrantedForPaidInvoice(plan), eventId, "subscription");
  await upsertSubscription(subscription, userId, planId as PaymentPlanId);

  const admin = createAdminClient();
  const { error: orderError } = await admin.from("orders").update({
    external_event_id: eventId,
    stripe_subscription_id: subscription.id,
    status: "paid",
  }).eq("stripe_subscription_id", subscription.id).eq("user_id", userId);
  if (orderError) throw new Error(`Stripe subscription order could not be updated: ${orderError.message}`);
}

async function upsertSubscription(subscription: Stripe.Subscription, knownUserId?: string | null, knownPlanId?: PaymentPlanId | null) {
  const userId = knownUserId ?? subscription.metadata.userId ?? subscription.metadata.user_id ?? await userIdForCustomer(subscription.customer);
  if (!userId) return;
  const planId = knownPlanId ?? (subscription.metadata.planId ?? subscription.metadata.product) as PaymentPlanId | undefined;
  const firstItem = subscription.items.data[0];
  const periodEnd = firstItem?.current_period_end;
  const admin = createAdminClient();
  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    product_key: getPaymentPlan(planId) ? planId : null,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  }, { onConflict: "stripe_subscription_id" });
  if (error) throw new Error(`Stripe subscription could not be saved: ${error.message}`);
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, getStripeWebhookSecret());
  } catch (cause) {
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    const shouldProcess = await recordEvent(event);
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });
    if (event.type === "checkout.session.completed") await handleCheckoutCompleted(event.data.object, event.id);
    if (event.type === "invoice.paid") await handleInvoicePaid(event.data.object, event.id);
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) await upsertSubscription(event.data.object as Stripe.Subscription);
    const { error } = await createAdminClient().from("webhook_events").update({ processed_at: new Date().toISOString() }).eq("provider", "stripe").eq("event_id", event.id);
    if (error) throw new Error(`Stripe event could not be completed: ${error.message}`);
    return NextResponse.json({ received: true });
  } catch (cause) {
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Stripe event processing failed." }, { status: 500 });
  }
}
