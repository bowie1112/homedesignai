import { afterEach, describe, expect, it, vi } from "vitest";
import { createKieTask, getKieTask } from "@/lib/kie/client";

describe("KIE HTTP contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("creates and reads a successful task", async () => {
    process.env.KIE_API_KEY = "test";
    process.env.NEXT_PUBLIC_APP_URL = "https://home.example";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 200, data: { taskId: "task_1" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 200, data: { taskId: "task_1", state: "success", resultJson: "{\"resultUrls\":[\"https://cdn.example/result.png\"]}", creditsConsumed: 3 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const taskId = await createKieTask({ tool: "floor-plan-generator", tier: "basic", prompt: "A compact two-bedroom apartment with open living.", inputAssetIds: [], roomType: "Apartment", style: "Warm minimal", aspectRatio: "4:3" }, []);
    expect(taskId).toBe("task_1");
    expect((await getKieTask(taskId)).state).toBe("success");
  });

  it("marks 429 as a retryable provider error", async () => {
    process.env.KIE_API_KEY = "test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 429, msg: "Rate limited" }), { status: 429 })));
    await expect(getKieTask("task_2")).rejects.toMatchObject({ code: 429, retryable: true });
  });
});
