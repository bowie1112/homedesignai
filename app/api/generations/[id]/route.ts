import { NextRequest, NextResponse } from "next/server";
import { ConfigurationError } from "@/lib/env";
import { getJobWithSignedResult, reconcileGeneration } from "@/lib/generation/service";
import type { GenerationJobRow } from "@/lib/generation/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Sign in to view this design." }, { status: 401 });
    const admin = createAdminClient();
    const { data } = await admin.from("generation_jobs").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!data) return NextResponse.json({ message: "Design not found." }, { status: 404 });
    const job = data as GenerationJobRow;
    if (["queued", "processing", "delayed", "persisting", "refunded"].includes(job.status)) {
      await reconcileGeneration(job).catch(() => null);
    }
    const response = await getJobWithSignedResult(id, user.id);
    return NextResponse.json(response);
  } catch (cause) {
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "The generation service is not configured yet." }, { status: 503 });
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "The design could not be refreshed." }, { status: 500 });
  }
}
