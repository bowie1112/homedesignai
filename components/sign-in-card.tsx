"use client";

import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignInCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in could not start.");
      setLoading(false);
    }
  };

  return (
    <div className="paper-panel w-full max-w-md p-6 sm:p-8">
      <div className="grid size-11 place-items-center bg-[var(--blue-pale)] text-[var(--blue)]"><ShieldCheck size={22} /></div>
      <h1 className="mt-7 text-4xl font-semibold tracking-[-0.055em]">Your private design desk.</h1>
      <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">Sign in to upload private reference images, use credits, and return to your design history.</p>
      <button className="button-primary mt-8 w-full" disabled={loading} onClick={signIn} type="button">
        {loading ? <LoaderCircle className="animate-spin" size={17} /> : (
          <svg aria-hidden="true" height="17" viewBox="0 0 24 24" width="17"><path d="M21.6 12.23c0-.71-.06-1.23-.2-1.77h-9.2v3.33h5.4a4.7 4.7 0 0 1-2 3.03l-.02.11 2.9 2.2.2.02c1.8-1.65 2.92-4.08 2.92-6.92" fill="#fff"/><path d="M12.2 21.6c2.63 0 4.84-.86 6.46-2.35l-3.08-2.32c-.82.56-1.94.96-3.38.96a5.86 5.86 0 0 1-5.54-4.04l-.1.01-3.02 2.29-.04.1a9.75 9.75 0 0 0 8.7 5.35" fill="#fff"/><path d="M6.66 13.85A5.9 5.9 0 0 1 6.34 12c0-.64.11-1.27.3-1.85V10L3.6 7.67l-.1.05a9.6 9.6 0 0 0 0 8.53z" fill="#fff"/><path d="M12.2 6.1c1.83 0 3.06.79 3.76 1.43l2.77-2.67A9.4 9.4 0 0 0 12.2 2.4a9.75 9.75 0 0 0-8.7 5.32l3.14 2.43A5.88 5.88 0 0 1 12.2 6.1" fill="#fff"/></svg>
        )}
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
      {error ? <p className="mt-4 border border-[color:oklch(51%_0.19_25/0.28)] bg-[color:oklch(95%_0.025_25)] p-3 text-sm text-[var(--red)]" role="alert">{error}</p> : null}
      <p className="mt-5 text-center text-xs leading-5 text-[var(--ink-soft)]">By continuing, you agree to the Terms and acknowledge the Privacy Policy.</p>
    </div>
  );
}
