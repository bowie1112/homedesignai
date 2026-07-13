"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  return <button className="button-secondary" disabled={loading} onClick={async () => { setLoading(true); await createClient().auth.signOut(); window.location.assign("/"); }} type="button"><LogOut size={16} />{loading ? "Signing out…" : "Sign out"}</button>;
}
