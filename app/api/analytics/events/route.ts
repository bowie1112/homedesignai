import { NextResponse } from "next/server";
import { z } from "zod";
import { productEventNames } from "@/lib/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const surfaceValues = ["generator", "history", "pricing", "auth", "system"] as const;
const safePropertyKeys = new Set(["tool", "tier", "failure_stage", "plan_id", "status", "share_method", "error_code"]);

const eventSchema = z.object({
  id: z.string().uuid(),
  eventName: z.enum(productEventNames),
  surface: z.enum(surfaceValues),
  generationJobId: z.string().uuid().optional(),
  properties: z.record(z.string(), z.union([z.string().max(100), z.number().finite(), z.boolean()])).default({}),
  occurredAt: z.string().datetime({ offset: true }),
});

function safeProperties(properties: Record<string, string | number | boolean>) {
  return Object.fromEntries(Object.entries(properties).filter(([key]) => safePropertyKeys.has(key)).slice(0, 12));
}

export async function POST(request: Request) {
  try {
    const input = eventSchema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Sign in to record product activity." }, { status: 401 });

    const admin = createAdminClient();
    let properties = safeProperties(input.properties);
    if (input.generationJobId) {
      const { data: job } = await admin
        .from("generation_jobs")
        .select("id, tool, tier, status")
        .eq("id", input.generationJobId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!job) return NextResponse.json({ message: "Design not found." }, { status: 404 });
      properties = { ...properties, tool: job.tool, tier: job.tier, status: job.status };
    }

    const { error } = await admin.from("product_events").upsert({
      id: input.id,
      user_id: user.id,
      generation_job_id: input.generationJobId ?? null,
      event_name: input.eventName,
      surface: input.surface,
      properties,
      occurred_at: new Date().toISOString(),
    }, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
    return NextResponse.json({ recorded: true }, { status: 201 });
  } catch (cause) {
    if (cause instanceof z.ZodError) return NextResponse.json({ message: "Invalid product event." }, { status: 400 });
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Product activity could not be recorded." }, { status: 500 });
  }
}
