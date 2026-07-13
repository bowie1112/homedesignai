import { NextRequest, NextResponse } from "next/server";
import { ConfigurationError } from "@/lib/env";
import { createGeneration, listJobs, uploadInputAssets } from "@/lib/generation/service";
import { generationInputSchema } from "@/lib/generation/types";
import { toolMap, type ToolKey } from "@/lib/site";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function authenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedUser();
    if (!user) return NextResponse.json({ message: "Sign in with Google to create and save private designs." }, { status: 401 });

    if (request.headers.get("content-type")?.includes("application/json")) {
      const input = generationInputSchema.parse(await request.json());
      const tool = toolMap.get(input.tool as ToolKey);
      if (!tool) return NextResponse.json({ message: "Choose a supported design tool." }, { status: 400 });
      if (tool.inputMode === "image" && input.inputAssetIds.length === 0) return NextResponse.json({ message: "Upload a reference image for this tool." }, { status: 400 });
      if (input.inputAssetIds.length > (input.tier === "pro" ? 14 : 10)) return NextResponse.json({ message: `${input.tier === "pro" ? "Pro" : "Basic"} accepts fewer reference images.` }, { status: 400 });
      return NextResponse.json(await createGeneration(user.id, input), { status: 202 });
    }

    const form = await request.formData();
    const tier = String(form.get("tier") ?? "basic");
    const toolKey = String(form.get("tool") ?? "") as ToolKey;
    const files = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
    const maxFiles = tier === "pro" ? 14 : 10;
    if (files.length > maxFiles) return NextResponse.json({ message: `${tier === "pro" ? "Pro" : "Basic"} accepts up to ${maxFiles} reference images.` }, { status: 400 });
    const tool = toolMap.get(toolKey);
    if (!tool) return NextResponse.json({ message: "Choose a supported design tool." }, { status: 400 });
    if (tool.inputMode === "image" && files.length === 0) return NextResponse.json({ message: "Upload a reference image for this tool." }, { status: 400 });

    const baseInput = generationInputSchema.parse({
      tool: toolKey,
      tier,
      prompt: String(form.get("prompt") ?? ""),
      inputAssetIds: [],
      roomType: String(form.get("roomType") ?? "Living room"),
      style: String(form.get("style") ?? "Warm minimal"),
      aspectRatio: String(form.get("aspectRatio") ?? "4:3"),
    });
    const inputAssetIds = await uploadInputAssets(user.id, files);
    const job = await createGeneration(user.id, { ...baseInput, inputAssetIds });
    return NextResponse.json(job, { status: 202 });
  } catch (cause) {
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "The generation service is not configured yet. Add Supabase and KIE environment variables." }, { status: 503 });
    const message = cause instanceof Error ? cause.message : "The generation could not be started.";
    const status = message.includes("enough credits") ? 402 : message.includes("Use JPG") || message.includes("validation") ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticatedUser();
    if (!user) return NextResponse.json({ message: "Sign in to view your private design history." }, { status: 401 });
    const data = await listJobs(user.id, request.nextUrl.searchParams.get("cursor"));
    return NextResponse.json(data);
  } catch (cause) {
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "Supabase is not configured yet." }, { status: 503 });
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "Your history could not be loaded." }, { status: 500 });
  }
}
