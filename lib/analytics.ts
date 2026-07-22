export const productEventNames = [
  "history_opened",
  "result_downloaded",
  "result_download_failed",
  "result_share_started",
  "result_shared",
  "result_share_cancelled",
  "result_share_unsupported",
  "result_share_failed",
  "result_delete_requested",
  "result_delete_failed",
  "generation_client_failed",
  "insufficient_credits_seen",
  "pricing_viewed",
  "billing_mode_selected",
  "plan_selected",
  "checkout_started",
  "checkout_redirected",
  "checkout_completed",
  "checkout_failed",
] as const;

export type ProductEventName = (typeof productEventNames)[number];
export type ProductEventSurface = "generator" | "history" | "pricing" | "auth" | "system";
export type ProductEventProperties = Record<string, string | number | boolean>;

type ProductEventInput = {
  eventName: ProductEventName;
  surface: ProductEventSurface;
  generationJobId?: string;
  properties?: ProductEventProperties;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackGaEvent(eventName: string, properties: ProductEventProperties = {}) {
  try {
    window.gtag?.("event", eventName, properties);
  } catch {
    // Analytics must never interrupt a product action.
  }
}

export async function trackProductEvent(input: ProductEventInput) {
  trackGaEvent(input.eventName, { ...input.properties, surface: input.surface });
  try {
    const response = await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        eventName: input.eventName,
        surface: input.surface,
        generationJobId: input.generationJobId,
        properties: input.properties ?? {},
        occurredAt: new Date().toISOString(),
      }),
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}
