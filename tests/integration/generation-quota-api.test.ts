import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getUsage } from "@/app/api/account/usage/route";
import { POST as createGenerationRoute } from "@/app/api/generations/route";
import { getAccountUsage } from "@/lib/account-usage";
import { createGeneration } from "@/lib/generation/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/account-usage", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/account-usage")>();
  return { ...original, getAccountUsage: vi.fn() };
});
vi.mock("@/lib/generation/service", () => ({
  createGeneration: vi.fn(),
  listJobs: vi.fn(),
  uploadInputAssets: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

const user = { id: "8f4ef85a-7d57-4f1b-9abd-a428f03d1986" };
const input = {
  tool: "floor-plan-generator",
  tier: "basic",
  prompt: "Create a practical two-bedroom floor plan with daylight.",
  inputAssetIds: [],
  roomType: "Living room",
  style: "Warm minimal",
  aspectRatio: "4:3",
};

function request(body = input) {
  return new NextRequest("http://localhost/api/generations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("generation quota APIs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires authentication for generation and usage", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never);

    expect((await createGenerationRoute(request())).status).toBe(401);
    expect((await getUsage()).status).toBe(401);
  });

  it("returns the free charge source and remaining daily uses", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    } as never);
    vi.mocked(createGeneration).mockResolvedValue({
      id: "1483a27f-4c47-4d28-b5b4-62e806d367a0",
      status: "processing",
      chargeSource: "daily_free",
      dailyFreeRemaining: 2,
    });

    const response = await createGenerationRoute(request());
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ chargeSource: "daily_free", dailyFreeRemaining: 2 });
  });

  it("returns paid fallback state and maps insufficient credits to 402", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    } as never);
    vi.mocked(createGeneration).mockResolvedValueOnce({
      id: "1483a27f-4c47-4d28-b5b4-62e806d367a0",
      status: "processing",
      chargeSource: "credits",
      dailyFreeRemaining: 0,
    }).mockRejectedValueOnce(new Error("You do not have enough credits for this model."));

    const paidResponse = await createGenerationRoute(request());
    expect(await paidResponse.json()).toMatchObject({ chargeSource: "credits", dailyFreeRemaining: 0 });
    expect((await createGenerationRoute(request())).status).toBe(402);
  });

  it("returns the complete uncached account usage payload", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    } as never);
    vi.mocked(getAccountUsage).mockResolvedValue({
      dailyFreeLimit: 3,
      dailyFreeUsed: 1,
      dailyFreeRemaining: 2,
      resetsAt: "2026-07-18T00:00:00.000Z",
      creditBalance: 40,
    });

    const response = await getUsage();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      dailyFreeLimit: 3,
      dailyFreeUsed: 1,
      dailyFreeRemaining: 2,
      resetsAt: "2026-07-18T00:00:00.000Z",
      creditBalance: 40,
    });
  });
});
