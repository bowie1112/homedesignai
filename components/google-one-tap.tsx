"use client";

import Script from "next/script";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type GoogleOneTapApi,
  shouldShowGoogleOneTap,
  startGoogleOneTap,
} from "@/lib/auth/google-one-tap";
import { trackGaEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    google?: { accounts: { id: GoogleOneTapApi } };
  }
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const hasSupabasePublicEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export function GoogleOneTap() {
  const pathname = usePathname();
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const eligible = shouldShowGoogleOneTap(pathname);

  useEffect(() => {
    if (!clientId || !hasSupabasePublicEnv || !eligible || !scriptReady || !window.google) return;

    let disposed = false;
    let stop: (() => void) | undefined;
    const supabase = createClient();

    void startGoogleOneTap({
      clientId,
      google: window.google.accounts.id,
      supabase,
      onAuthenticated: (isNewUser) => {
        trackGaEvent(isNewUser ? "sign_up" : "login", { method: "google_one_tap" });
        router.refresh();
      },
      onError: (stage) => {
        trackGaEvent("one_tap_error", { method: "google_one_tap", error_code: stage });
      },
    }).then((cleanup) => {
      if (disposed) cleanup();
      else stop = cleanup;
    }).catch(() => {
      trackGaEvent("one_tap_error", { method: "google_one_tap", error_code: "initialize" });
    });

    return () => {
      disposed = true;
      stop?.();
    };
  }, [eligible, router, scriptReady]);

  if (!clientId || !hasSupabasePublicEnv || !eligible) return null;
  return (
    <Script
      id="google-identity-services"
      onLoad={() => setScriptReady(true)}
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
    />
  );
}
