"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

export function PortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || !payload.url) throw new Error(payload.message ?? "The billing portal is unavailable.");
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The billing portal is unavailable.");
      setLoading(false);
    }
  };

  return <div><button className="button-secondary" disabled={loading} onClick={openPortal} type="button">{loading ? <LoaderCircle className="animate-spin" size={16} /> : null}{loading ? "Opening portal…" : "Manage billing"}</button>{error ? <p className="mt-2 text-xs text-[var(--red)]" role="alert">{error}</p> : null}</div>;
}
