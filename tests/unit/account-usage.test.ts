import { describe, expect, it } from "vitest";
import { DAILY_FREE_BASIC_LIMIT, utcUsageWindow } from "@/lib/account-usage";

describe("daily free Basic usage window", () => {
  it("uses a three-generation daily limit", () => {
    expect(DAILY_FREE_BASIC_LIMIT).toBe(3);
  });

  it("resets at the next UTC midnight across month boundaries", () => {
    expect(utcUsageWindow(new Date("2026-07-31T23:59:59.999Z"))).toEqual({
      usageDate: "2026-07-31",
      resetsAt: "2026-08-01T00:00:00.000Z",
    });
  });

  it("does not use the server's local timezone for the usage date", () => {
    expect(utcUsageWindow(new Date("2026-07-17T00:00:00.000Z"))).toEqual({
      usageDate: "2026-07-17",
      resetsAt: "2026-07-18T00:00:00.000Z",
    });
  });
});
