import { NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";
import { getKieCreditBalance } from "@/lib/kie/client";
import { reconcileGeneration } from "@/lib/generation/service";
import type { GenerationJobRow } from "@/lib/generation/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const expected = requireEnv("CRON_SECRET");
  if (request.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const balancePromise = getKieCreditBalance().catch(() => null);
  const admin = createAdminClient();
  const olderThan = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const newerThan = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("generation_jobs")
    .select("*")
    .in("status", ["queued", "processing", "delayed", "persisting", "refunded"])
    .lt("updated_at", olderThan)
    .gte("created_at", newerThan)
    .order("updated_at", { ascending: true })
    .limit(30);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const results = [];
  for (const job of data as GenerationJobRow[]) {
    try {
      results.push({ id: job.id, ...(await reconcileGeneration(job)) });
    } catch (cause) {
      results.push({ id: job.id, status: "error", error: cause instanceof Error ? cause.message : "Unknown reconciliation error" });
    }
  }
  const providerBalance = await balancePromise;
  const lowCreditThreshold = Number(process.env.KIE_LOW_CREDIT_THRESHOLD ?? 50);
  if (providerBalance !== null && providerBalance < lowCreditThreshold) {
    console.error(`[operations] KIE balance is low: ${providerBalance} credits remaining.`);
    if (process.env.OPERATIONS_ALERT_WEBHOOK_URL) {
      await fetch(process.env.OPERATIONS_ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ service: "kie", severity: "warning", message: `KIE balance is low: ${providerBalance} credits remaining.`, balance: providerBalance }),
      }).catch(() => null);
    }
  }
  return NextResponse.json({ scanned: data.length, providerBalance, lowBalance: providerBalance !== null && providerBalance < lowCreditThreshold, results });
}
