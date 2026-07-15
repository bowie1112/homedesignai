"use client";

import { Download, LoaderCircle, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { trackGaEvent, trackProductEvent } from "@/lib/analytics";
import { deleteResult, downloadResult, shareResult } from "@/lib/result-actions";

type ResultActionsProps = {
  jobId: string;
  resultUrl: string | null;
  tool: string;
  tier?: string;
  status: string;
  surface: "generator" | "history";
  onDeleted: () => void;
};

export function ResultActions({ jobId, resultUrl, tool, tier, status, surface, onDeleted }: ResultActionsProps) {
  const [busyAction, setBusyAction] = useState<"download" | "share" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const terminal = ["success", "failed", "refunded"].includes(status);

  const download = async () => {
    if (!resultUrl) return;
    setBusyAction("download");
    setMessage(null);
    const outcome = await downloadResult({ jobId, resultUrl, surface, tool, tier });
    if (!outcome.ok) setMessage(outcome.message);
    setBusyAction(null);
  };

  const share = async () => {
    if (!resultUrl) return;
    setBusyAction("share");
    setMessage(null);
    const outcome = await shareResult({ jobId, resultUrl, surface, tool, tier });
    if (!outcome.ok && !("cancelled" in outcome && outcome.cancelled)) setMessage(outcome.message);
    setBusyAction(null);
  };

  const remove = async () => {
    const requestedEvent = trackProductEvent({ eventName: "result_delete_requested", surface, generationJobId: jobId });
    const confirmed = window.confirm("Delete this design permanently? Its generated image and uploaded references cannot be recovered.");
    if (!confirmed) return;
    await requestedEvent;
    setBusyAction("delete");
    setMessage(null);
    const outcome = await deleteResult(jobId, surface);
    if (outcome.ok) {
      trackGaEvent("result_deleted", { tool, tier: tier ?? "unknown", status, surface });
      onDeleted();
      return;
    }
    setMessage(outcome.message);
    setBusyAction(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-1">
        {resultUrl ? (
          <>
            <button className="button-ghost min-h-9 px-2 text-xs" disabled={busyAction !== null} onClick={download} type="button">
              {busyAction === "download" ? <LoaderCircle className="animate-spin" size={14} /> : <Download size={14} />} Download
            </button>
            <button className="button-ghost min-h-9 px-2 text-xs" disabled={busyAction !== null} onClick={share} type="button">
              {busyAction === "share" ? <LoaderCircle className="animate-spin" size={14} /> : <Share2 size={14} />} Share
            </button>
          </>
        ) : null}
        {terminal ? (
          <button aria-label="Delete design" className="button-ghost min-h-9 px-2 text-xs text-[var(--red)]" disabled={busyAction !== null} onClick={remove} type="button">
            {busyAction === "delete" ? <LoaderCircle className="animate-spin" size={14} /> : <Trash2 size={14} />} Delete
          </button>
        ) : null}
      </div>
      {message ? <p aria-live="polite" className="mt-2 max-w-sm text-right text-xs text-[var(--red)]">{message}</p> : null}
    </div>
  );
}
