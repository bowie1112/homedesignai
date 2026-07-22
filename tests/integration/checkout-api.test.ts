import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/checkout/route";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

function request(planId: string) {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ planId }),
  });
}

describe("checkout API v2 catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.env.NEXT_PUBLIC_APP_URL = "https://home.example";
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "buyer@example.com" } } }) },
    } as never);
  });

  afterEach(() => vi.restoreAllMocks());

  it("rejects a hidden legacy plan for a new checkout", async () => {
    expect((await POST(request("starter_monthly"))).status).toBe(400);
    expect(getStripe).not.toHaveBeenCalled();
  });

  it("creates a code-priced v2 subscription with authoritative metadata", async () => {
    const createSession = vi.fn().mockResolvedValue({
      id: "cs_test_1",
      url: "https://checkout.stripe.test/session",
      status: "open",
      subscription: null,
      payment_intent: null,
    });
    vi.mocked(getStripe).mockReturnValue({
      customers: { create: vi.fn() },
      checkout: { sessions: { create: createSession } },
    } as never);

    const insertOrder = vi.fn();
    const updateOrder = vi.fn();
    const orderEq = vi.fn().mockResolvedValue({ error: null });
    insertOrder.mockReturnValue({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null }) })) });
    updateOrder.mockReturnValue({ eq: orderEq });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => table === "profiles"
        ? { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_customer_id: "cus_1" } }) })) })) }
        : { insert: insertOrder, update: updateOrder }),
    } as never);

    const response = await POST(request("starter_monthly_v2"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://checkout.stripe.test/session" });
    expect(insertOrder).toHaveBeenCalledWith(expect.objectContaining({
      product_key: "starter_monthly_v2",
      amount_total: 999,
      credits: 100,
    }));
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
      mode: "subscription",
      metadata: expect.objectContaining({ planId: "starter_monthly_v2", pricingVersion: "v2", credits: "100" }),
      line_items: [{
        quantity: 1,
        price_data: expect.objectContaining({ unit_amount: 999, recurring: { interval: "month" } }),
      }],
    }));
  });
});
