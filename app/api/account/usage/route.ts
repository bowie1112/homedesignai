import { NextResponse } from "next/server";
import { getAccountUsage } from "@/lib/account-usage";
import { ConfigurationError } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ message: "Sign in to view your daily usage." }, { status: 401 });

    return NextResponse.json(await getAccountUsage(user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (cause) {
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "Supabase is not configured yet." }, { status: 503 });
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Account usage could not be loaded." }, { status: 500 });
  }
}
