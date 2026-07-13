import type { Metadata } from "next";
import { UpdatePasswordCard } from "@/components/update-password-card";

export const metadata: Metadata = { title: "Update password", robots: { index: false, follow: false } };

export default function UpdatePasswordPage() {
  return <main className="blueprint-grid grid min-h-[calc(100vh-104px)] place-items-center px-4 py-16" id="main-content"><UpdatePasswordCard /></main>;
}
