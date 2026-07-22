import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analytics/events/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

const event = {
  id: "9ad880f7-2c60-4997-95f0-36428547454e",
  eventName: "result_downloaded",
  surface: "history",
  generationJobId: "dbcf136c-cfce-44bd-b991-b52be2bea36f",
  properties: { tool: "spoofed", prompt: "must not persist" },
  occurredAt: "2026-07-15T06:00:00.000Z",
};

function request(body: unknown) {
  return new Request("http://localhost/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("product events API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an authenticated user", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } } as never);
    expect((await POST(request(event))).status).toBe(401);
  });

  it("rejects unknown event names", async () => {
    expect((await POST(request({ ...event, eventName: "prompt_changed" }))).status).toBe(400);
  });

  it("rejects a job that is not owned by the user", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) } } as never);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null });
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) })) })) } as never);
    expect((await POST(request(event))).status).toBe(404);
  });

  it("uses authoritative job properties and an idempotent upsert", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) } } as never);
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: event.generationJobId, tool: "interior-design-ai", tier: "pro", status: "success" } });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === "generation_jobs"
        ? { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) })) }
        : { upsert }),
    } as never);
    expect((await POST(request(event))).status).toBe(201);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-1",
      properties: { tool: "interior-design-ai", tier: "pro", status: "success" },
    }), { onConflict: "id", ignoreDuplicates: true });
  });

  it("keeps the v2 pricing dimensions for funnel events", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) } } as never);
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => ({ upsert })) } as never);

    const pricingEvent = {
      ...event,
      generationJobId: undefined,
      eventName: "billing_mode_selected",
      surface: "pricing",
      properties: { pricing_version: "v2", billing_mode: "yearly", ignored: "remove-me" },
    };
    expect((await POST(request(pricingEvent))).status).toBe(201);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      event_name: "billing_mode_selected",
      properties: { pricing_version: "v2", billing_mode: "yearly" },
    }), { onConflict: "id", ignoreDuplicates: true });
  });
});
