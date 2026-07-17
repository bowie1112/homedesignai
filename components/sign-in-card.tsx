"use client";

import { CheckCircle2, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up" | "recovery";

const copy: Record<AuthMode, { title: string; description: string; action: string }> = {
  "sign-in": {
    title: "Return to your design desk.",
    description: "Open your private references, credits, and saved concepts.",
    action: "Sign in with email",
  },
  "sign-up": {
    title: "Create your private design desk.",
    description: "Registered accounts receive three free Basic generations every day.",
    action: "Create account",
  },
  recovery: {
    title: "Reset your password.",
    description: "We will email you a secure link to choose a new password.",
    action: "Email reset link",
  },
};

export function SignInCard({ nextPath = "/account" }: { nextPath?: string }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const changeMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in could not start. Please try again.");
      setLoading(false);
    }
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = createClient();
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        window.location.assign(nextPath);
        return;
      }
      if (mode === "sign-up") {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
        });
        if (authError) throw authError;
        setSuccess("Check your inbox to verify your email, then return here to sign in.");
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (authError) throw authError;
        setSuccess("Password reset link sent. Check your inbox to continue.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="paper-panel w-full max-w-md p-6 sm:p-8">
      <div className="grid size-11 place-items-center bg-[var(--blue-pale)] text-[var(--blue)]"><ShieldCheck size={22} /></div>
      <h1 className="mt-7 text-4xl font-semibold tracking-[-0.055em]">{copy[mode].title}</h1>
      <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">{copy[mode].description}</p>

      {mode !== "recovery" ? (
        <div className="mt-7 grid grid-cols-2 border border-[var(--line)] p-1" role="tablist" aria-label="Account action">
          <button aria-selected={mode === "sign-in"} className={`min-h-10 px-3 text-sm font-bold ${mode === "sign-in" ? "bg-[var(--ink)]" : "text-[var(--ink-soft)]"}`} onClick={() => changeMode("sign-in")} role="tab" style={mode === "sign-in" ? { color: "var(--paper)" } : undefined} type="button">Sign in</button>
          <button aria-selected={mode === "sign-up"} className={`min-h-10 px-3 text-sm font-bold ${mode === "sign-up" ? "bg-[var(--ink)]" : "text-[var(--ink-soft)]"}`} onClick={() => changeMode("sign-up")} role="tab" style={mode === "sign-up" ? { color: "var(--paper)" } : undefined} type="button">Create account</button>
        </div>
      ) : null}

      <form className="mt-6 grid gap-4" onSubmit={submitEmail}>
        <div>
          <label className="field-label" htmlFor="auth-email">Email address</label>
          <input autoComplete="email" className="text-field" id="auth-email" inputMode="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
        </div>
        {mode !== "recovery" ? (
          <div>
            <label className="field-label" htmlFor="auth-password"><span>Password</span>{mode === "sign-up" ? <span className="field-hint">At least 8 characters</span> : null}</label>
            <input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} className="text-field" id="auth-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </div>
        ) : null}
        <button className="button-primary w-full" disabled={loading} type="submit">
          {loading ? <LoaderCircle className="animate-spin" size={17} /> : <Mail size={17} />}
          {loading ? "Working…" : copy[mode].action}
        </button>
      </form>

      {mode === "sign-in" ? <button className="mt-3 text-sm font-bold text-[var(--blue-deep)] underline underline-offset-4" onClick={() => changeMode("recovery")} type="button">Forgot your password?</button> : null}
      {mode === "recovery" ? <button className="mt-3 text-sm font-bold text-[var(--blue-deep)] underline underline-offset-4" onClick={() => changeMode("sign-in")} type="button">Return to sign in</button> : null}

      {mode !== "recovery" ? (
        <>
          <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-soft)]"><span className="h-px flex-1 bg-[var(--line)]" />or<span className="h-px flex-1 bg-[var(--line)]" /></div>
          <button className="button-secondary w-full" disabled={loading} onClick={signInWithGoogle} type="button">
            <svg aria-hidden="true" height="17" viewBox="0 0 24 24" width="17"><path d="M21.6 12.23c0-.71-.06-1.23-.2-1.77h-9.2v3.33h5.4a4.7 4.7 0 0 1-2 3.03l-.02.11 2.9 2.2.2.02c1.8-1.65 2.92-4.08 2.92-6.92" fill="#4285F4"/><path d="M12.2 21.6c2.63 0 4.84-.86 6.46-2.35l-3.08-2.32c-.82.56-1.94.96-3.38.96a5.86 5.86 0 0 1-5.54-4.04l-.1.01-3.02 2.29-.04.1a9.75 9.75 0 0 0 8.7 5.35" fill="#34A853"/><path d="M6.66 13.85A5.9 5.9 0 0 1 6.34 12c0-.64.11-1.27.3-1.85V10L3.6 7.67l-.1.05a9.6 9.6 0 0 0 0 8.53z" fill="#FBBC05"/><path d="M12.2 6.1c1.83 0 3.06.79 3.76 1.43l2.77-2.67A9.4 9.4 0 0 0 12.2 2.4a9.75 9.75 0 0 0-8.7 5.32l3.14 2.43A5.88 5.88 0 0 1 12.2 6.1" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </>
      ) : null}

      {error ? <p aria-live="polite" className="mt-5 border border-[color:oklch(51%_0.19_25/0.28)] bg-[color:oklch(95%_0.025_25)] p-3 text-sm text-[var(--red)]" role="alert">{error}</p> : null}
      {success ? <p aria-live="polite" className="mt-5 flex gap-2 border border-[color:oklch(48%_0.13_153/0.28)] bg-[color:oklch(95%_0.025_153)] p-3 text-sm text-[var(--green)]"><CheckCircle2 className="mt-0.5 shrink-0" size={17} />{success}</p> : null}
      <p className="mt-5 text-center text-xs leading-5 text-[var(--ink-soft)]">By continuing, you agree to the Terms and acknowledge the Privacy Policy.</p>
    </div>
  );
}
