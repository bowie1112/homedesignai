"use client";

import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordCard() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await createClient().auth.updateUser({ password });
      if (authError) throw authError;
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your password could not be updated. Request a new reset link and try again.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="paper-panel w-full max-w-md p-6 sm:p-8"><div className="grid size-11 place-items-center bg-[var(--blue-pale)] text-[var(--blue)]"><LockKeyhole size={22} /></div><h1 className="mt-7 text-4xl font-semibold tracking-[-0.055em]">Choose a new password.</h1>{complete ? <div className="mt-6"><p className="flex gap-2 text-sm text-[var(--green)]"><CheckCircle2 size={18} />Your password is ready.</p><Link className="button-primary mt-6 w-full" href="/account">Open your account</Link></div> : <form className="mt-6 grid gap-4" onSubmit={updatePassword}><div><label className="field-label" htmlFor="new-password"><span>New password</span><span className="field-hint">At least 8 characters</span></label><input autoComplete="new-password" className="text-field" id="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></div><button className="button-primary w-full" disabled={loading} type="submit">{loading ? <LoaderCircle className="animate-spin" size={17} /> : null}{loading ? "Updating password…" : "Update password"}</button></form>}{error ? <p className="mt-5 border border-[color:oklch(51%_0.19_25/0.28)] bg-[color:oklch(95%_0.025_25)] p-3 text-sm text-[var(--red)]" role="alert">{error}</p> : null}</div>;
}
