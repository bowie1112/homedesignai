import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppUrl, requireEnv } from "@/lib/env";
import { buildGenerationPrompt } from "@/lib/generation/prompt";
import type { GenerationInput } from "@/lib/generation/types";

const KIE_BASE_URL = "https://api.kie.ai/api/v1";

export type KieTaskState = "waiting" | "queuing" | "generating" | "success" | "fail" | string;

export type KieTaskRecord = {
  taskId: string;
  state: KieTaskState;
  resultJson?: string | Record<string, unknown> | null;
  failCode?: string | number | null;
  failMsg?: string | null;
  creditsConsumed?: number | null;
};

export class KieApiError extends Error {
  readonly code: number | string;
  readonly retryable: boolean;

  constructor(code: number | string, message: string, retryable = isRetryableKieCode(code)) {
    super(message);
    this.name = "KieApiError";
    this.code = code;
    this.retryable = retryable;
  }
}

export function isRetryableKieCode(code: number | string) {
  const parsed = Number(code);
  return [408, 429, 455, 500, 501, 505].includes(parsed);
}

export function buildKiePayload(input: GenerationInput, signedInputUrls: string[]) {
  const common = {
    prompt: buildGenerationPrompt(input),
    aspect_ratio: input.aspectRatio,
  };

  if (input.tier === "basic") {
    return {
      model: "nano-banana-2-lite",
      callBackUrl: `${getAppUrl()}/api/webhooks/kie`,
      input: signedInputUrls.length ? { ...common, image_urls: signedInputUrls.slice(0, 10) } : common,
    };
  }

  return {
    model: "nano-banana-2",
    callBackUrl: `${getAppUrl()}/api/webhooks/kie`,
    input: {
      ...common,
      ...(signedInputUrls.length ? { image_input: signedInputUrls.slice(0, 14) } : {}),
      resolution: "2K",
      output_format: input.tool.includes("floor-plan") || input.tool === "sketch-to-floor-plan" ? "png" : "jpg",
    },
  };
}

async function kieFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${KIE_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireEnv("KIE_API_KEY")}`,
      "content-type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as { code?: number; msg?: string; message?: string; data?: unknown } | null;
  const code = payload?.code ?? response.status;
  if (!response.ok || (typeof code === "number" && code !== 200 && code !== 0)) {
    throw new KieApiError(code, payload?.msg ?? payload?.message ?? `KIE request failed with status ${response.status}.`);
  }
  return payload;
}

export async function createKieTask(input: GenerationInput, signedInputUrls: string[]) {
  const payload = await kieFetch("/jobs/createTask", {
    method: "POST",
    body: JSON.stringify(buildKiePayload(input, signedInputUrls)),
  });
  const data = payload?.data as { taskId?: string } | undefined;
  if (!data?.taskId) throw new KieApiError("MISSING_TASK_ID", "KIE accepted the request without returning a task ID.", false);
  return data.taskId;
}

export async function getKieTask(taskId: string): Promise<KieTaskRecord> {
  const payload = await kieFetch(`/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { method: "GET" });
  const data = payload?.data as Partial<KieTaskRecord> | undefined;
  if (!data) throw new KieApiError("MISSING_TASK_RECORD", "KIE did not return task details.", true);
  return {
    taskId: data.taskId ?? taskId,
    state: data.state ?? "waiting",
    resultJson: data.resultJson,
    failCode: data.failCode,
    failMsg: data.failMsg,
    creditsConsumed: data.creditsConsumed,
  };
}

export async function getKieCreditBalance() {
  const payload = await kieFetch("/chat/credit", { method: "GET" });
  const data = payload?.data as { credits?: number; balance?: number } | number | undefined;
  if (typeof data === "number") return data;
  const balance = data?.credits ?? data?.balance;
  return typeof balance === "number" ? balance : null;
}

export function parseKieResultUrls(resultJson: KieTaskRecord["resultJson"]): string[] {
  if (!resultJson) return [];
  let value: unknown = resultJson;
  if (typeof resultJson === "string") {
    try {
      value = JSON.parse(resultJson);
    } catch {
      return /^https?:\/\//.test(resultJson) ? [resultJson] : [];
    }
  }
  const urls = new Set<string>();
  const walk = (item: unknown) => {
    if (typeof item === "string" && /^https?:\/\//.test(item)) urls.add(item);
    else if (Array.isArray(item)) item.forEach(walk);
    else if (item && typeof item === "object") Object.values(item).forEach(walk);
  };
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const object = value as Record<string, unknown>;
    const preferred = [object.resultUrls, object.result_urls, object.images, object.output, object.outputs].filter((item) => item !== undefined);
    preferred.forEach(walk);
    if (urls.size === 0) walk(value);
  } else {
    walk(value);
  }
  return [...urls];
}

export function verifyKieWebhookSignature(taskId: string, timestamp: string, signature: string, secret = requireEnv("KIE_WEBHOOK_SECRET")) {
  if (!taskId || !timestamp || !signature) return false;
  const numericTimestamp = Number(timestamp);
  const timestampMs = numericTimestamp > 1_000_000_000_000 ? numericTimestamp : numericTimestamp * 1000;
  const age = Math.abs(Date.now() - timestampMs);
  if (!Number.isFinite(age) || age > 5 * 60 * 1000) return false;
  const expected = createHmac("sha256", secret).update(`${taskId}.${timestamp}`).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}
