import type { Metadata } from "next";
import { HistoryGallery } from "@/components/history-gallery";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Design History", robots: { index: false, follow: false } };

export default function HistoryPage() {
  return <main id="main-content"><PageIntro eyebrow="Private library" title="Design history" text="Return to completed results, check in-progress jobs, and download the files stored in your private workspace." /><section className="site-shell py-16 sm:py-24"><HistoryGallery /></section></main>;
}
