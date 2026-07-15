"use client";

import { Clock3, ImageIcon, LoaderCircle, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ResultActions } from "@/components/result-actions";
import { trackProductEvent } from "@/lib/analytics";

type HistoryJob = {
  id: string;
  tool: string;
  tier: "basic" | "pro";
  prompt: string;
  status: string;
  resultUrl: string | null;
  createdAt: string;
};

export function HistoryGallery() {
  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/generations", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { jobs?: HistoryJob[]; message?: string };
        if (!response.ok) throw new Error(payload.message ?? "Your history could not be loaded.");
        if (!cancelled) {
          setJobs(payload.jobs ?? []);
          void trackProductEvent({ eventName: "history_opened", surface: "history" });
        }
      })
      .catch((cause) => {
        if (!cancelled) setMessage(cause instanceof Error ? cause.message : "Your history could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="flex min-h-64 items-center justify-center gap-3 border border-[var(--line)] bg-[var(--white)] text-sm text-[var(--ink-soft)]"><LoaderCircle className="animate-spin" size={18} /> Loading your design history…</div>;
  if (message) return <div className="paper-panel p-8 text-center"><Clock3 className="mx-auto text-[var(--blue)]" /><h2 className="mt-4 text-xl font-semibold">Sign in to see your designs</h2><p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-soft)]">{message}</p><Link className="button-primary mt-6" href="/auth/sign-in">Sign in with Google <MoveRight size={15} /></Link></div>;
  if (jobs.length === 0) return <div className="paper-panel p-8 text-center"><ImageIcon className="mx-auto text-[var(--blue)]" /><h2 className="mt-4 text-xl font-semibold">No designs yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-soft)]">Create your first design to build a private, reusable visual history.</p><Link className="button-primary mt-6" href="/floor-plan-generator">Create a design <MoveRight size={15} /></Link></div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <article className="overflow-hidden border border-[var(--line)] bg-[var(--white)]" key={job.id}>
          <div className="relative aspect-[4/3] bg-[var(--paper-deep)]">
            {job.resultUrl ? <Image alt="Generated design" className="object-cover" fill sizes="(max-width: 768px) 100vw, 33vw" src={job.resultUrl} /> : <div className="grid h-full place-items-center"><LoaderCircle className="animate-spin text-[var(--blue)]" /></div>}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-soft)]"><span>{job.tool.replaceAll("-", " ")}</span><span>{job.status}</span></div>
            <p className="mt-3 line-clamp-2 text-sm leading-5">{job.prompt}</p>
            <div className="mt-4 border-t border-[var(--line)] pt-3">
              <ResultActions jobId={job.id} onDeleted={() => setJobs((current) => current.filter((item) => item.id !== job.id))} resultUrl={job.resultUrl} status={job.status} surface="history" tier={job.tier} tool={job.tool} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
