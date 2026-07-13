import { NextRequest, NextResponse } from "next/server";
import { verifyKieWebhookSignature } from "@/lib/kie/client";
import { reconcileGeneration } from "@/lib/generation/service";
import type { GenerationJobRow } from "@/lib/generation/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const text = await request.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }
  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
  const taskId = String(body.taskId ?? data.taskId ?? "");
  if (!verifyKieWebhookSignature(taskId, timestamp, signature)) return NextResponse.json({ message: "Invalid webhook signature." }, { status: 401 });

  const admin = createAdminClient();
  const eventId = `${taskId}:${timestamp}`;
  const { data: existing } = await admin.from("webhook_events").select("processed_at").eq("provider", "kie").eq("event_id", eventId).maybeSingle();
  if (existing?.processed_at) return NextResponse.json({ received: true, duplicate: true });
  const { error: eventError } = await admin.from("webhook_events").upsert({ provider: "kie", event_id: eventId, payload: body }, { onConflict: "provider,event_id", ignoreDuplicates: true });
  if (eventError) return NextResponse.json({ message: "Webhook event could not be recorded." }, { status: 500 });

  const { data: job } = await admin.from("generation_jobs").select("*").eq("kie_task_id", taskId).maybeSingle();
  if (!job) return NextResponse.json({ received: true, matched: false });
  await reconcileGeneration(job as GenerationJobRow);
  await admin.from("webhook_events").update({ processed_at: new Date().toISOString() }).eq("provider", "kie").eq("event_id", eventId);
  return NextResponse.json({ received: true, matched: true });
}
