import { describe, expect, it } from "vitest";
import {
  creditsGrantedForPaidInvoice,
  getPaymentPlan,
  paymentPlans,
  publicPaymentPlanIds,
  publicPaymentPlans,
} from "@/lib/payments/plans";

describe("payment plans", () => {
  it("defines the three public v2 monthly subscriptions", () => {
    expect(paymentPlans.starter_monthly_v2).toMatchObject({ amount: 999, creditsPerInvoice: 100, interval: "month", billingMode: "monthly" });
    expect(paymentPlans.professional_monthly_v2).toMatchObject({ amount: 2999, creditsPerInvoice: 300, interval: "month", billingMode: "monthly" });
    expect(paymentPlans.enterprise_monthly_v2).toMatchObject({ amount: 5999, creditsPerInvoice: 600, interval: "month", billingMode: "monthly" });
  });

  it("defines v2 annual subscriptions at 20% off with the full allowance granted per invoice", () => {
    expect(paymentPlans.starter_yearly_v2).toMatchObject({ amount: 9590, monthlyEquivalentAmount: 799, creditsPerInvoice: 1200, interval: "year" });
    expect(paymentPlans.professional_yearly_v2).toMatchObject({ amount: 28790, monthlyEquivalentAmount: 2399, creditsPerInvoice: 3600, interval: "year" });
    expect(paymentPlans.enterprise_yearly_v2).toMatchObject({ amount: 57590, monthlyEquivalentAmount: 4799, creditsPerInvoice: 7200, interval: "year" });

    expect(creditsGrantedForPaidInvoice(paymentPlans.starter_yearly_v2)).toBe(1200);
    expect(creditsGrantedForPaidInvoice(paymentPlans.professional_yearly_v2)).toBe(3600);
    expect(creditsGrantedForPaidInvoice(paymentPlans.enterprise_yearly_v2)).toBe(7200);
  });

  it("defines the three v2 permanent one-time packs", () => {
    expect(paymentPlans.pack_starter_v2).toMatchObject({ amount: 699, creditsPerInvoice: 50, kind: "one_time" });
    expect(paymentPlans.pack_professional_v2).toMatchObject({ amount: 2499, creditsPerInvoice: 200, kind: "one_time" });
    expect(paymentPlans.pack_enterprise_v2).toMatchObject({ amount: 5999, creditsPerInvoice: 500, kind: "one_time" });
  });

  it("keeps every previous catalog plan resolvable but out of the public catalog", () => {
    expect(getPaymentPlan("starter_monthly")).toMatchObject({ amount: 1999, creditsPerInvoice: 200, visible: false });
    expect(getPaymentPlan("professional_yearly")).toMatchObject({ amount: 29900, creditsPerInvoice: 7200, visible: false });
    expect(getPaymentPlan("pack_enterprise")).toMatchObject({ amount: 14900, creditsPerInvoice: 1500, visible: false });
    expect(getPaymentPlan("starter")).toMatchObject({ amount: 900, creditsPerInvoice: 80, visible: false });
    expect(getPaymentPlan("pro")).toMatchObject({ amount: 1900, creditsPerInvoice: 220, visible: false });
    expect(getPaymentPlan("pack_40")).toMatchObject({ amount: 600, creditsPerInvoice: 40, visible: false });
    expect(getPaymentPlan("pack_120")).toMatchObject({ amount: 1500, creditsPerInvoice: 120, visible: false });
    expect(getPaymentPlan("pack_300")).toMatchObject({ amount: 3000, creditsPerInvoice: 300, visible: false });
    expect(publicPaymentPlanIds).toHaveLength(9);
    expect(publicPaymentPlans.every((plan) => plan.visible && plan.id.endsWith("_v2"))).toBe(true);
    expect(publicPaymentPlanIds).not.toContain("starter_monthly");
    expect(publicPaymentPlanIds).not.toContain("starter");
  });

  it("publishes only truthful shared capabilities", () => {
    const publicFeatures = publicPaymentPlans.flatMap((plan) => plan.features).join(" ");
    expect(publicFeatures).toContain("Basic 1K and Pro 2K models");
    expect(publicFeatures).not.toMatch(/4K|DXF|Priority processing|Floor Plan Project/);
  });
});
