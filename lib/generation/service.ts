import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createKieTask, getKieTask, KieApiError, parseKieResultUrls } from "@/lib/kie/client";
import { generationInputSchema, type GenerationInput, type GenerationJobRow } from "@/lib/generation/types";

const STORAGE_BUCKET = "private-assets";
const MAX_RESULT_BYTES = 50 * 1024 * 1024;

function extensionForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadInputAssets(userId: string, files: File[]) {
  const admin = createAdminClient();
  const assetIds: string[] = [];
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 30 * 1024 * 1024) {
      throw new Error("Use JPG, PNG, or WebP images no larger than 30 MB each.");
    }
    const id = randomUUID();
    const storagePath = `inputs/${userId}/${id}.${extensionForMime(file.type)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: storageError } = await admin.storage.from(STORAGE_BUCKET).upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (storageError) throw new Error(`The reference image could not be stored: ${storageError.message}`);
    const { error: insertError } = await admin.from("assets").insert({
      id,
      user_id: userId,
      kind: "input",
      storage_path: storagePath,
      mime_type: file.type,
      byte_size: file.size,
      original_name: file.name,
    });
    if (insertError) {
      await admin.storage.from(STORAGE_BUCKET).remove([storagePath]);
      throw new Error(`The reference image could not be registered: ${insertError.message}`);
    }
    assetIds.push(id);
  }
  return assetIds;
}

async function createSignedInputUrls(userId: string, assetIds: string[]) {
  if (!assetIds.length) return [];
  const admin = createAdminClient();
  const { data, error } = await admin.from("assets").select("id, storage_path").eq("user_id", userId).in("id", assetIds);
  if (error || !data || data.length !== assetIds.length) throw new Error("One or more reference images are unavailable.");
  const ordered = new Map(data.map((asset) => [asset.id, asset.storage_path]));
  const urls = await Promise.all(assetIds.map(async (id) => {
    const path = ordered.get(id);
    if (!path) throw new Error("A reference image is unavailable.");
    const { data: signed, error: signError } = await admin.storage.from(STORAGE_BUCKET).createSignedUrl(path, 15 * 60);
    if (signError) throw new Error(`A secure image link could not be created: ${signError.message}`);
    return signed.signedUrl;
  }));
  return urls;
}

export async function reserveGeneration(userId: string, rawInput: GenerationInput) {
  const input = generationInputSchema.parse(rawInput);
  const jobId = randomUUID();
  const cost = input.tier === "basic" ? 1 : 3;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_credits_and_create_job", {
    p_user_id: userId,
    p_job_id: jobId,
    p_tool: input.tool,
    p_tier: input.tier,
    p_prompt: input.prompt,
    p_input_asset_ids: input.inputAssetIds,
    p_room_type: input.roomType,
    p_style: input.style,
    p_aspect_ratio: input.aspectRatio,
    p_credit_cost: cost,
  });
  if (error) {
    if (error.message.includes("INSUFFICIENT_CREDITS")) throw new Error("You do not have enough credits for this model. Choose Basic or add credits.");
    throw new Error(`Credits could not be reserved: ${error.message}`);
  }
  return { jobId: (data as string | null) ?? jobId, input };
}

export async function refundGeneration(jobId: string, reason: string) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("refund_generation_job", { p_job_id: jobId, p_reason: reason });
  if (error) throw new Error(`The automatic credit refund could not be recorded: ${error.message}`);
}

async function updateJob(jobId: string, values: Record<string, unknown>) {
  const admin = createAdminClient();
  const { error } = await admin.from("generation_jobs").update(values).eq("id", jobId);
  if (error) throw new Error(`The generation job could not be updated: ${error.message}`);
}

export async function startProviderTask(job: GenerationJobRow, input?: GenerationInput, preparedSignedUrls?: string[]) {
  const parsedInput = input ?? generationInputSchema.parse({
    tool: job.tool,
    tier: job.tier,
    prompt: job.prompt,
    inputAssetIds: job.input_asset_ids,
    roomType: job.room_type,
    style: job.style,
    aspectRatio: job.aspect_ratio,
  });
  try {
    const signedUrls = preparedSignedUrls ?? await createSignedInputUrls(job.user_id, parsedInput.inputAssetIds);
    const taskId = await createKieTask(parsedInput, signedUrls);
    await updateJob(job.id, { kie_task_id: taskId, status: "processing", provider_state: "waiting", error_code: null, error_message: null });
    return { taskId, status: "processing" as const };
  } catch (cause) {
    if (cause instanceof KieApiError && cause.retryable) {
      await updateJob(job.id, { status: "delayed", error_code: String(cause.code), error_message: cause.message });
      return { taskId: null, status: "delayed" as const };
    }
    const code = cause instanceof KieApiError ? String(cause.code) : "PROVIDER_START_FAILED";
    const message = cause instanceof Error ? cause.message : "KIE could not start the task.";
    await updateJob(job.id, { status: "failed", error_code: code, error_message: message });
    await refundGeneration(job.id, code);
    throw cause;
  }
}

export async function createGeneration(userId: string, input: GenerationInput) {
  const parsedForOwnership = generationInputSchema.parse(input);
  const preparedSignedUrls = await createSignedInputUrls(userId, parsedForOwnership.inputAssetIds);
  const { jobId, input: parsedInput } = await reserveGeneration(userId, parsedForOwnership);
  const job: GenerationJobRow = {
    id: jobId,
    user_id: userId,
    tool: parsedInput.tool,
    tier: parsedInput.tier,
    prompt: parsedInput.prompt,
    input_asset_ids: parsedInput.inputAssetIds,
    room_type: parsedInput.roomType,
    style: parsedInput.style,
    aspect_ratio: parsedInput.aspectRatio,
    status: "queued",
    credit_cost: parsedInput.tier === "basic" ? 1 : 3,
    kie_task_id: null,
    provider_state: null,
    provider_credits_consumed: null,
    result_asset_id: null,
    result_migrated_at: null,
    error_code: null,
    error_message: null,
    refunded_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const started = await startProviderTask(job, parsedInput, preparedSignedUrls);
  return { id: jobId, status: started.status };
}

async function persistResult(job: GenerationJobRow, sourceUrl: string) {
  const response = await fetch(sourceUrl, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`The temporary result could not be downloaded (${response.status}).`);
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RESULT_BYTES) throw new Error("The generated result is larger than the 50 MB storage limit.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_RESULT_BYTES) throw new Error("The generated result is larger than the 50 MB storage limit.");
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? (job.tool.includes("floor-plan") ? "image/png" : "image/jpeg");
  const assetId = randomUUID();
  const path = `results/${job.user_id}/${job.id}/${assetId}.${extensionForMime(contentType)}`;
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from(STORAGE_BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (uploadError) throw new Error(`The final result could not be stored: ${uploadError.message}`);
  const { error: assetError } = await admin.from("assets").insert({
    id: assetId,
    user_id: job.user_id,
    job_id: job.id,
    kind: "result",
    storage_path: path,
    mime_type: contentType,
    byte_size: bytes.byteLength,
  });
  if (assetError?.code === "23505") {
    await admin.storage.from(STORAGE_BUCKET).remove([path]);
    const { data: existing } = await admin.from("assets").select("id").eq("job_id", job.id).eq("kind", "result").maybeSingle();
    if (existing) {
      await updateJob(job.id, { status: "success", result_asset_id: existing.id, result_migrated_at: new Date().toISOString(), error_code: null, error_message: null });
      return existing.id;
    }
  }
  if (assetError) {
    await admin.storage.from(STORAGE_BUCKET).remove([path]);
    throw new Error(`The final result could not be registered: ${assetError.message}`);
  }
  await updateJob(job.id, { status: "success", result_asset_id: assetId, result_migrated_at: new Date().toISOString(), error_code: null, error_message: null });
  return assetId;
}

export async function reconcileGeneration(job: GenerationJobRow) {
  if (!job.kie_task_id) {
    if (job.status === "delayed" || job.status === "queued") return startProviderTask(job);
    return { status: job.status };
  }

  let record;
  try {
    record = await getKieTask(job.kie_task_id);
  } catch (cause) {
    if (cause instanceof KieApiError && cause.retryable) {
      await updateJob(job.id, { status: "delayed", error_code: String(cause.code), error_message: cause.message });
      return { status: "delayed" as const };
    }
    throw cause;
  }

  if (["waiting", "queuing", "generating"].includes(record.state)) {
    const age = Date.now() - new Date(job.created_at).getTime();
    if (age >= 60 * 60 * 1000 && !job.refunded_at) {
      await refundGeneration(job.id, "PROVIDER_TIMEOUT_60_MINUTES");
      await updateJob(job.id, { provider_state: record.state, provider_credits_consumed: record.creditsConsumed ?? null });
      return { status: "refunded" as const };
    }
    await updateJob(job.id, { status: job.refunded_at ? "refunded" : "processing", provider_state: record.state, provider_credits_consumed: record.creditsConsumed ?? null });
    return { status: job.refunded_at ? "refunded" as const : "processing" as const };
  }

  if (record.state === "fail") {
    const code = String(record.failCode ?? "KIE_TASK_FAILED");
    await updateJob(job.id, { status: "failed", provider_state: record.state, provider_credits_consumed: record.creditsConsumed ?? null, error_code: code, error_message: record.failMsg ?? "KIE could not complete this design." });
    if (!job.refunded_at) await refundGeneration(job.id, code);
    return { status: "failed" as const };
  }

  if (record.state === "success") {
    if (job.result_asset_id && job.result_migrated_at) return { status: "success" as const, assetId: job.result_asset_id };
    const [sourceUrl] = parseKieResultUrls(record.resultJson);
    if (!sourceUrl) {
      await updateJob(job.id, { status: "persisting", provider_state: record.state, provider_credits_consumed: record.creditsConsumed ?? null, error_code: "MISSING_RESULT_URL", error_message: "KIE completed the task without a readable result URL." });
      return { status: "persisting" as const };
    }
    try {
      await updateJob(job.id, { status: "persisting", provider_state: record.state, provider_credits_consumed: record.creditsConsumed ?? null });
      const assetId = await persistResult(job, sourceUrl);
      return { status: "success" as const, assetId };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The final result could not be stored.";
      await updateJob(job.id, { status: "persisting", error_code: "RESULT_MIGRATION_FAILED", error_message: message });
      return { status: "persisting" as const };
    }
  }

  await updateJob(job.id, { status: "delayed", provider_state: record.state, error_code: "UNKNOWN_PROVIDER_STATE", error_message: `Unknown KIE state: ${record.state}` });
  return { status: "delayed" as const };
}

export async function getJobWithSignedResult(jobId: string, userId: string) {
  const admin = createAdminClient();
  const { data: job, error } = await admin.from("generation_jobs").select("*").eq("id", jobId).eq("user_id", userId).maybeSingle();
  if (error || !job) return null;
  let resultUrl: string | null = null;
  if (job.result_asset_id) {
    const { data: asset } = await admin.from("assets").select("storage_path").eq("id", job.result_asset_id).eq("user_id", userId).maybeSingle();
    if (asset) {
      const { data: signed } = await admin.storage.from(STORAGE_BUCKET).createSignedUrl(asset.storage_path, 60 * 60);
      resultUrl = signed?.signedUrl ?? null;
    }
  }
  return { id: job.id, status: job.status, resultUrl, error: job.error_message, tool: job.tool, tier: job.tier };
}

export async function listJobs(userId: string, cursor?: string | null) {
  const admin = createAdminClient();
  let query = admin.from("generation_jobs").select("id, tool, tier, prompt, status, result_asset_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(24);
  if (cursor) query = query.lt("created_at", cursor);
  const { data, error } = await query;
  if (error) throw new Error(`Design history could not be loaded: ${error.message}`);
  const assetIds = data.map((job) => job.result_asset_id).filter(Boolean) as string[];
  const { data: assets } = assetIds.length ? await admin.from("assets").select("id, storage_path").eq("user_id", userId).in("id", assetIds) : { data: [] as { id: string; storage_path: string }[] };
  const paths = new Map((assets ?? []).map((asset) => [asset.id, asset.storage_path]));
  const jobs = await Promise.all(data.map(async (job) => {
    const path = job.result_asset_id ? paths.get(job.result_asset_id) : null;
    const signed = path ? await admin.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60) : null;
    return { id: job.id, tool: job.tool, tier: job.tier, prompt: job.prompt, status: job.status, resultUrl: signed?.data?.signedUrl ?? null, createdAt: job.created_at };
  }));
  return { jobs, nextCursor: data.length === 24 ? data.at(-1)?.created_at ?? null : null };
}

export async function deleteGenerationJob({
  userId,
  jobId,
  eventId,
  occurredAt,
  surface,
}: {
  userId: string;
  jobId: string;
  eventId: string;
  occurredAt: string;
  surface: "generator" | "history";
}) {
  const admin = createAdminClient();
  const { data: recorded } = await admin
    .from("product_events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", userId)
    .eq("generation_job_id", jobId)
    .eq("event_name", "result_deleted")
    .maybeSingle();
  if (recorded) return true;

  const { data: job, error: jobError } = await admin
    .from("generation_jobs")
    .select("id, status, input_asset_ids, result_asset_id")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();
  if (jobError) throw new Error(`The design could not be checked: ${jobError.message}`);
  if (!job) throw new Error("Design not found.");
  if (!["success", "failed", "refunded"].includes(job.status)) throw new Error("Wait for this design to finish before deleting it.");

  const assetIds = [...job.input_asset_ids, job.result_asset_id].filter(Boolean) as string[];
  if (assetIds.length) {
    const { data: assets, error: assetError } = await admin
      .from("assets")
      .select("storage_path")
      .eq("user_id", userId)
      .in("id", assetIds);
    if (assetError) throw new Error(`The design files could not be checked: ${assetError.message}`);
    const paths = assets.map((asset) => asset.storage_path);
    if (paths.length) {
      const { error: storageError } = await admin.storage.from(STORAGE_BUCKET).remove(paths);
      if (storageError) throw new Error(`The design files could not be deleted: ${storageError.message}`);
    }
  }

  const { data, error } = await admin.rpc("delete_generation_job", {
    p_user_id: userId,
    p_job_id: jobId,
    p_event_id: eventId,
    p_occurred_at: occurredAt,
    p_surface: surface,
  });
  if (error) throw new Error(`The design record could not be deleted: ${error.message}`);
  if (!data) throw new Error("Design not found.");
  return true;
}
