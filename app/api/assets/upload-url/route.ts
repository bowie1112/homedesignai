import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ConfigurationError } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1).max(240),
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(30 * 1024 * 1024),
});

function extension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Sign in before uploading private references." }, { status: 401 });
    const file = schema.parse(await request.json());
    const assetId = randomUUID();
    const path = `inputs/${user.id}/${assetId}.${extension(file.type)}`;
    const admin = createAdminClient();
    const { data: signed, error: signError } = await admin.storage.from("private-assets").createSignedUploadUrl(path);
    if (signError) throw new Error(signError.message);
    const { error: assetError } = await admin.from("assets").insert({
      id: assetId,
      user_id: user.id,
      kind: "input",
      storage_path: path,
      mime_type: file.type,
      byte_size: file.size,
      original_name: file.name,
    });
    if (assetError) throw new Error(assetError.message);
    return NextResponse.json({ assetId, path, token: signed.token });
  } catch (cause) {
    if (cause instanceof ConfigurationError) return NextResponse.json({ message: "Supabase Storage is not configured yet." }, { status: 503 });
    return NextResponse.json({ message: cause instanceof Error ? cause.message : "A secure upload URL could not be created." }, { status: 400 });
  }
}
