"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

export function BillingButton({ product, children, variant = "primary" }: { product: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const payload = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || !payload.url) throw new Error(payload.message ?? "Checkout is not available yet.");
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout is not available yet.");
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
