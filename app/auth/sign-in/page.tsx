import type { Metadata } from "next";
import { SignInCard } from "@/components/sign-in-card";
import { sanitizeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeNextPath(requestedNext);
  return <main className="blueprint-grid grid min-h-[calc(100vh-104px)] place-items-center px-4 py-16" id="main-content"><SignInCard nextPath={nextPath} /></main>;
}
