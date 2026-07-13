import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { buildKiePayload, isRetryableKieCode, parseKieResultUrls, verifyKieWebhookSignature } from "@/lib/kie/client";
import type { GenerationInput } from "@/lib/generation/types";

const baseInput: GenerationInput = {
  tool: "interior-design-ai",
  tier: "basic",
  prompt: "Redesign this room with warm oak and linen furniture.",
  inputAssetIds: [],
  roomType: "Living room",
  style: "Warm minimal",
  aspectRatio: "4:3",
};

describe("KIE Nano Banana adapter", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://home.example";
  });

  it("maps Basic to the documented 1K model and omits image_input for text-to-image", () => {
    const payload = buildKiePayload({ ...baseInput, tool: "floor-plan-generator" }, []);
    expect(payload.model).toBe("nano-banana-2");
    expect(payload.callBackUrl).toBe("https://home.example/api/webhooks/kie");
    expect(payload.input).not.toHaveProperty("image_input");
    expect(payload.input).toMatchObject({ aspect_ratio: "4:3", resolution: "1K", output_format: "jpg" });
  });

  it("maps Basic references to image_input and caps them at 10", () => {
    const urls = Array.from({ length: 12 }, (_, index) => `https://example.com/${index}.png`);
    const payload = buildKiePayload(baseInput, urls);
    expect(payload.input).toHaveProperty("image_input");
    expect((payload.input as { image_input: string[] }).image_input).toHaveLength(10);
  });

  it("maps Pro references to image_input with fixed 2K output", () => {
    const payload = buildKiePayload({ ...baseInput, tier: "pro" }, ["https://example.com/room.jpg"]);
    expect(payload.model).toBe("nano-banana-2");
    expect(payload.input).toMatchObject({ image_input: ["https://example.com/room.jpg"], resolution: "2K", output_format: "jpg" });
    expect(payload.input).not.toHaveProperty("image_urls");
  });

  it("uses PNG for floor-plan Pro output", () => {
    const payload = buildKiePayload({ ...baseInput, tool: "floor-plan-editor", tier: "pro" }, ["https://example.com/plan.png"]);
    expect(payload.input).toMatchObject({ output_format: "png" });
  });

  it("parses nested and stringified result URLs without duplicates", () => {
    const urls = parseKieResultUrls(JSON.stringify({ resultUrls: ["https://cdn.example/a.png"], nested: { url: "https://cdn.example/a.png", preview: "https://cdn.example/b.jpg" } }));
    expect(urls).toEqual(["https://cdn.example/a.png"]);
  });

  it("verifies the documented taskId.timestamp HMAC signature", () => {
    const taskId = "task_123";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const secret = "test-secret";
    const signature = createHmac("sha256", secret).update(`${taskId}.${timestamp}`).digest("base64");
    expect(verifyKieWebhookSignature(taskId, timestamp, signature, secret)).toBe(true);
    expect(verifyKieWebhookSignature(taskId, timestamp, `${signature}bad`, secret)).toBe(false);
  });

  it("also accepts millisecond timestamps without changing the signed message", () => {
    const taskId = "task_ms";
    const timestamp = String(Date.now());
    const secret = "test-secret";
    const signature = createHmac("sha256", secret).update(`${taskId}.${timestamp}`).digest("base64");
    expect(verifyKieWebhookSignature(taskId, timestamp, signature, secret)).toBe(true);
  });

  it("classifies transient provider responses for delayed reconciliation", () => {
    expect([408, 429, 455, 500, 501, 505].every(isRetryableKieCode)).toBe(true);
    expect(isRetryableKieCode(402)).toBe(false);
    expect(isRetryableKieCode(433)).toBe(false);
  });
});
