import type { Metadata } from "next";
import { SignInCard } from "@/components/sign-in-card";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function SignInPage() {
  return <main className="blueprint-grid grid min-h-[calc(100vh-104px)] place-items-center px-4 py-16" id="main-content"><SignInCard /></main>;
}
