import type { ProductEventProperties, ProductEventSurface } from "@/lib/analytics";
import { trackProductEvent } from "@/lib/analytics";

type ResultActionInput = {
  jobId: string;
  resultUrl: string;
  surface: Extract<ProductEventSurface, "generator" | "history">;
  tool: string;
  tier?: string;
};

function analyticsProperties({ tool, tier }: Pick<ResultActionInput, "tool" | "tier">) {
  const properties: ProductEventProperties = { tool };
  if (tier) properties.tier = tier;
  return properties;
}

function resultFilename(tool: string, blob: Blob) {
  const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  return `${tool}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

async function fetchResultFile({ resultUrl, tool }: Pick<ResultActionInput, "resultUrl" | "tool">) {
  const response = await fetch(resultUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("The result file could not be loaded.");
  const blob = await response.blob();
  return new File([blob], resultFilename(tool, blob), { type: blob.type || "image/jpeg" });
}

export async function downloadResult(input: ResultActionInput) {
  try {
    const file = await fetchResultFile(input);
    const objectUrl = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    void trackProductEvent({ eventName: "result_downloaded", surface: input.surface, generationJobId: input.jobId, properties: analyticsProperties(input) });
    return { ok: true as const };
  } catch (cause) {
    void trackProductEvent({ eventName: "result_download_failed", surface: input.surface, generationJobId: input.jobId, properties: analyticsProperties(input) });
    return { ok: false as const, message: cause instanceof Error ? cause.message : "The result could not be downloaded." };
  }
}

export async function shareResult(input: ResultActionInput) {
  void trackProductEvent({ eventName: "result_share_started", surface: input.surface, generationJobId: input.jobId, properties: analyticsProperties(input) });
  try {
    const file = await fetchResultFile(input);
    const shareData: ShareData = { files: [file], title: "My HomeDesignAI concept" };
    if (!navigator.share || (navigator.canShare && !navigator.canShare(shareData))) {
      void trackProductEvent({ eventName: "result_share_unsupported", surface: input.surface, generationJobId: input.jobId, properties: analyticsProperties(input) });
      return { ok: false as const, unsupported: true as const, message: "File sharing is not supported in this browser. Download the image instead." };
    }
    await navigator.share(shareData);
    void trackProductEvent({ eventName: "result_shared", surface: input.surface, generationJobId: input.jobId, properties: { ...analyticsProperties(input), share_method: "native_file" } });
    return { ok: true as const };
  } catch (cause) {
    if (typeof cause === "object" && cause !== null && "name" in cause && cause.name === "AbortError") {
      void trackProductEvent({ eventName: "result_share_cancelled", surface: input.surface, generationJobId: input.jobId, properties: analyticsProperties(input) });
      return { ok: false as const, cancelled: true as const };
    }
    void trackProductEvent({ eventName: "result_share_failed", surface: input.surface, generationJobId: input.jobId, properties: analyticsProperties(input) });
    return { ok: false as const, message: cause instanceof Error ? cause.message : "The result could not be shared." };
  }
}

export async function deleteResult(jobId: string, surface: Extract<ProductEventSurface, "generator" | "history">) {
  const eventId = crypto.randomUUID();
  const body = JSON.stringify({ eventId, occurredAt: new Date().toISOString(), surface });
  try {
    let lastMessage = "The design could not be deleted.";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(`/api/generations/${jobId}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body,
        });
        const payload = await response.json().catch(() => ({})) as { message?: string };
        if (response.ok) return { ok: true as const };
        lastMessage = payload.message ?? lastMessage;
        if ([400, 401, 409].includes(response.status)) break;
      } catch (cause) {
        lastMessage = cause instanceof Error ? cause.message : lastMessage;
      }
    }
    throw new Error(lastMessage);
  } catch (cause) {
    void trackProductEvent({ eventName: "result_delete_failed", surface, generationJobId: jobId });
    return { ok: false as const, message: cause instanceof Error ? cause.message : "The design could not be deleted." };
  }
}
