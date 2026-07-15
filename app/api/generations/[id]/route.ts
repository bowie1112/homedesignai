import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ConfigurationError } from "@/lib/env";
import { deleteGenerationJob, getJobWithSignedResult, reconcileGeneration } from "@/lib/generation/service";
import type { GenerationJobRow } from "@/lib/generation/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const deleteSchema = z.object({
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime({ offset: true }),
  surface: z.enum(["generator", "history"]),
});

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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, input, supabase] = await Promise.all([
      params,
      request.json().then((body) => deleteSchema.parse(body)),
      createServerSupabaseClient(),
    ]);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Sign in to delete this design." }, { status: 401 });
    await deleteGenerationJob({ userId: user.id, jobId: id, ...input, occurredAt: new Date().toISOString() });
    return NextResponse.json({ deleted: true });
  } catch (cause) {
    if (cause instanceof z.ZodError) return NextResponse.json({ message: "Invalid deletion request." }, { status: 400 });
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "The storage service is not configured yet." }, { status: 503 });
    const message = cause instanceof Error ? cause.message : "The design could not be deleted.";
    const status = message === "Design not found." ? 404 : message.startsWith("Wait for") ? 409 : 500;
    return NextResponse.json({ message }, { status });
  }
}
