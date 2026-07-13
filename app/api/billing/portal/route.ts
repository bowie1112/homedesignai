import { NextResponse } from "next/server";
import { ConfigurationError, getAppUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Sign in to manage billing." }, { status: 401 });
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    if (!profile?.stripe_customer_id) return NextResponse.json({ message: "No Stripe customer is connected to this account yet." }, { status: 404 });
    const session = await getStripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${getAppUrl()}/account` });
    return NextResponse.json({ url: session.url });
  } catch (cause) {
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "Stripe billing is not configured yet." }, { status: 503 });
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "The billing portal could not be opened." }, { status: 500 });
  }
}
