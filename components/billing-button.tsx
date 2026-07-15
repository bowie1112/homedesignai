"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { trackGaEvent, trackProductEvent } from "@/lib/analytics";
import type { PaymentPlanId } from "@/lib/payments/plans";

export function BillingButton({ authenticated, planId, children, variant = "primary" }: { authenticated: boolean; planId: PaymentPlanId; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    const returnPath = `/pricing?plan=${encodeURIComponent(planId)}`;
    const signInPath = `/auth/sign-in?next=${encodeURIComponent(returnPath)}`;
    if (!authenticated) {
      trackGaEvent("checkout_started", { plan_id: planId, surface: "pricing" });
      window.location.assign(signInPath);
      return;
    }

    void trackProductEvent({ eventName: "checkout_started", surface: "pricing", properties: { plan_id: planId } });
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const payload = await response.json().catch(() => ({})) as { url?: string; message?: string };
      if (response.status === 401) {
        window.location.assign(signInPath);
        return;
      }
      if (!response.ok || !payload.url) throw new Error(payload.message ?? "Checkout is not available yet.");
      await trackProductEvent({ eventName: "checkout_redirected", surface: "pricing", properties: { plan_id: planId } });
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout is not available yet.");
      void trackProductEvent({ eventName: "checkout_failed", surface: "pricing", properties: { plan_id: planId } });
      setLoading(false);
    }
  };

  return (
    <div>
      <button className={`w-full ${variant === "primary" ? "button-primary" : "button-secondary"}`} disabled={loading} onClick={checkout} type="button">
        {loading ? <LoaderCircle className="animate-spin" size={16} /> : null}
        {loading ? "Opening secure checkout…" : children}
      </button>
      {error ? <p className="mt-2 text-xs leading-5 text-[var(--red)]" role="alert">{error}</p> : null}
    </div>
  );
}
