import { describe, expect, it } from "vitest";
import { creditsGrantedForPaidInvoice, paymentPlans } from "@/lib/payments/plans";

describe("payment plans", () => {
  it("keeps the live monthly and one-time prices in code", () => {
    expect(paymentPlans.starter).toMatchObject({ amount: 900, creditsPerInvoice: 80, interval: "month" });
    expect(paymentPlans.pro).toMatchObject({ amount: 1900, creditsPerInvoice: 220, interval: "month" });
    expect(paymentPlans.pack_40).toMatchObject({ amount: 600, creditsPerInvoice: 40, kind: "one_time" });
    expect(paymentPlans.pack_120).toMatchObject({ amount: 1500, creditsPerInvoice: 120, kind: "one_time" });
    expect(paymentPlans.pack_300).toMatchObject({ amount: 3000, creditsPerInvoice: 300, kind: "one_time" });
  });

  it("grants the full configured invoice allowance without period splitting", () => {
    expect(creditsGrantedForPaidInvoice({ creditsPerInvoice: 960 })).toBe(960);
  });
});
