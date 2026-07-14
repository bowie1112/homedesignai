import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "@/lib/auth/redirect";

describe("sanitizeNextPath", () => {
  it("keeps local purchase return paths", () => {
    expect(sanitizeNextPath("/pricing?plan=pack_40")).toBe("/pricing?plan=pack_40");
  });

  it("falls back for external and protocol-relative redirects", () => {
    expect(sanitizeNextPath("https://example.com/checkout")).toBe("/account");
    expect(sanitizeNextPath("//example.com/checkout")).toBe("/account");
    expect(sanitizeNextPath("/\\example.com/checkout")).toBe("/account");
  });

  it("uses the supplied fallback for missing paths", () => {
    expect(sanitizeNextPath(null, "/pricing")).toBe("/pricing");
  });
});
