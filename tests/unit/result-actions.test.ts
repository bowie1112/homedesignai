// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteResult, downloadResult, shareResult } from "@/lib/result-actions";
import { trackProductEvent } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({ trackProductEvent: vi.fn() }));

const input = {
  jobId: "d1e2e554-f812-4ee4-bb41-2bedf6d5ef97",
  resultUrl: "https://assets.example/result.png",
  surface: "generator" as const,
  tool: "interior-design-ai",
};

describe("result file actions", () => {
  beforeEach(() => {
    vi.mocked(trackProductEvent).mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(new Blob(["image"], { type: "image/png" }), { status: 200 })));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("records download only after the file is fetched", async () => {
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:result"), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    expect(await downloadResult(input)).toEqual({ ok: true });
    expect(trackProductEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "result_downloaded", generationJobId: input.jobId }));
  });

  it("records a failed download without recording success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    expect((await downloadResult(input)).ok).toBe(false);
    expect(trackProductEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "result_download_failed" }));
    expect(trackProductEvent).not.toHaveBeenCalledWith(expect.objectContaining({ eventName: "result_downloaded" }));
  });

  it("records successful native file sharing", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: vi.fn(() => true) });
    expect(await shareResult(input)).toEqual({ ok: true });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: [expect.any(File)] }));
    expect(trackProductEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "result_shared" }));
  });

  it("separates cancelled, unsupported, and failed shares", async () => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    expect(await shareResult(input)).toMatchObject({ ok: false, unsupported: true });
    expect(trackProductEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "result_share_unsupported" }));

    vi.mocked(trackProductEvent).mockClear();
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")) });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: vi.fn(() => true) });
    expect(await shareResult(input)).toMatchObject({ ok: false, cancelled: true });
    expect(trackProductEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "result_share_cancelled" }));

    vi.mocked(trackProductEvent).mockClear();
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockRejectedValue(new Error("Share failed")) });
    expect((await shareResult(input)).ok).toBe(false);
    expect(trackProductEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName: "result_share_failed" }));
  });

  it("retries deletion with the same idempotency event id", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Connection closed"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ deleted: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("3be58c32-2fea-4f48-a6a0-0ae34a69431e");
    expect(await deleteResult(input.jobId, input.surface)).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(fetchMock.mock.calls[1]?.[1]?.body);
  });
});
