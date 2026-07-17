import { describe, expect, it } from "vitest";
import {
  creditsGrantedForPaidInvoice,
  getPaymentPlan,
  paymentPlans,
  publicPaymentPlanIds,
  publicPaymentPlans,
} from "@/lib/payments/plans";

describe("payment plans", () => {
  it("defines the three public monthly subscriptions", () => {
    expect(paymentPlans.starter_monthly).toMatchObject({ amount: 1999, creditsPerInvoice: 200, interval: "month", billingMode: "monthly" });
    expect(paymentPlans.professional_monthly).toMatchObject({ amount: 4999, creditsPerInvoice: 600, interval: "month", billingMode: "monthly" });
    expect(paymentPlans.enterprise_monthly).toMatchObject({ amount: 9999, creditsPerInvoice: 1500, interval: "month", billingMode: "monthly" });
  });

  it("defines annual subscriptions with the full allowance granted per invoice", () => {
    expect(paymentPlans.starter_yearly).toMatchObject({ amount: 11900, monthlyEquivalentAmount: 999, creditsPerInvoice: 2400, interval: "year" });
    expect(paymentPlans.professional_yearly).toMatchObject({ amount: 29900, monthlyEquivalentAmount: 2499, creditsPerInvoice: 7200, interval: "year" });
    expect(paymentPlans.enterprise_yearly).toMatchObject({ amount: 59900, monthlyEquivalentAmount: 4999, creditsPerInvoice: 18000, interval: "year" });

    expect(creditsGrantedForPaidInvoice(paymentPlans.starter_yearly)).toBe(2400);
    expect(creditsGrantedForPaidInvoice(paymentPlans.professional_yearly)).toBe(7200);
    expect(creditsGrantedForPaidInvoice(paymentPlans.enterprise_yearly)).toBe(18000);
  });

  it("defines the three permanent one-time packs", () => {
    expect(paymentPlans.pack_starter).toMatchObject({ amount: 2999, creditsPerInvoice: 200, kind: "one_time" });
    expect(paymentPlans.pack_professional).toMatchObject({ amount: 7999, creditsPerInvoice: 600, kind: "one_time" });
    expect(paymentPlans.pack_enterprise).toMatchObject({ amount: 14900, creditsPerInvoice: 1500, kind: "one_time" });
  });

  it("keeps legacy plans resolvable but out of the public catalog", () => {
    expect(getPaymentPlan("starter")).toMatchObject({ amount: 900, creditsPerInvoice: 80, visible: false });
    expect(getPaymentPlan("pro")).toMatchObject({ amount: 1900, creditsPerInvoice: 220, visible: false });
    expect(getPaymentPlan("pack_40")).toMatchObject({ amount: 600, creditsPerInvoice: 40, visible: false });
    expect(getPaymentPlan("pack_120")).toMatchObject({ amount: 1500, creditsPerInvoice: 120, visible: false });
    expect(getPaymentPlan("pack_300")).toMatchObject({ amount: 3000, creditsPerInvoice: 300, visible: false });
    expect(publicPaymentPlanIds).toHaveLength(9);
    expect(publicPaymentPlans.every((plan) => plan.visible)).toBe(true);
    expect(publicPaymentPlanIds).not.toContain("starter");
    expect(publicPaymentPlanIds).not.toContain("pro");
  });
});
