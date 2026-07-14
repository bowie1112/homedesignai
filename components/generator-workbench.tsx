"use client";

import {
  Check,
  ChevronDown,
  Clock3,
  Download,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  MoveRight,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  aspectRatios,
  designStyles,
  roomTypes,
  toolMap,
  type ToolKey,
} from "@/lib/site";

type JobStatus = "idle" | "uploading" | "queued" | "processing" | "delayed" | "persisting" | "success" | "failed" | "refunded";

type GenerationResponse = {
  id: string;
  status: Exclude<JobStatus, "idle" | "uploading">;
  resultUrl?: string | null;
  error?: string | null;
};

const homeTabs: { label: string; mobileLabel: string; tool: ToolKey }[] = [
  { label: "AI Interior Design", mobileLabel: "Interior", tool: "interior-design-ai" },
  { label: "AI Virtual Staging", mobileLabel: "Staging", tool: "virtual-staging-ai" },
  { label: "Home Exterior Design", mobileLabel: "Exterior", tool: "ai-home-exterior-design-free" },
];

const statusCopy: Record<Exclude<JobStatus, "idle" | "success" | "failed" | "refunded">, string> = {
  uploading: "Securing your reference images…",
  queued: "Your design is in the queue…",
  processing: "Building the composition…",
  delayed: "The model is busy. We are retrying safely…",
  persisting: "Saving the final image to your private library…",
};

function getExampleImage(tool: ToolKey) {
  if (tool === "ai-home-exterior-design-free" || tool === "ai-garden-design-free" || tool === "ai-landscape-design") {
    return "/images/exterior-concept.webp";
  }
  if (tool.startsWith("floor-plan") || tool === "sketch-to-floor-plan") {
    return "/images/floor-plan-2-5d.webp";
  }
  return "/images/hero-interior.webp";
}

export function GeneratorWorkbench({
  defaultTool = "floor-plan-generator",
  showTabs = false,
}: {
  defaultTool?: ToolKey;
  showTabs?: boolean;
}) {
  const [activeTool, setActiveTool] = useState<ToolKey>(defaultTool);
  const [prompt, setPrompt] = useState(() => toolMap.get(defaultTool)?.promptPlaceholder ?? "");
  const [tier, setTier] = useState<"basic" | "pro">("basic");
  const [roomType, setRoomType] = useState("Living room");
  const [style, setStyle] = useState("Warm minimal");
  const [aspectRatio, setAspectRatio] = useState("4:3");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const tool = toolMap.get(activeTool) ?? toolMap.get("floor-plan-generator")!;
  const needsImage = tool.inputMode === "image";
  const canGenerate = prompt.trim().length >= 12 && (!needsImage || files.length > 0) && status !== "uploading" && status !== "processing" && status !== "queued" && status !== "persisting";

  const imageUrls = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => () => {
    imageUrls.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [imageUrls]);

  const selectTool = (nextTool: ToolKey) => {
    setActiveTool(nextTool);
    setPrompt(toolMap.get(nextTool)?.promptPlaceholder ?? "");
    setFiles([]);
    setStatus("idle");
    setResult(null);
    setError(null);
  };

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted = Array.from(incoming).filter((file) => file.type.startsWith("image/") && file.size <= 30 * 1024 * 1024);
    const maxFiles = tier === "pro" ? 14 : 10;
    if (accepted.length !== incoming.length) {
      setError("Use JPG, PNG, or WebP images no larger than 30 MB each.");
    } else {
      setError(null);
    }
    setFiles((current) => [...current, ...accepted].slice(0, maxFiles));
  };

  const pollJob = useCallback(async (id: string) => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      const response = await fetch(`/api/generations/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("We could not refresh this design. Your credits remain protected.");
      const job = (await response.json()) as GenerationResponse;
      setResult(job);
      setStatus(job.status);
      if (job.status === "success") return;
      if (job.status === "failed") throw new Error(job.error ?? "The model could not complete this design. Your credits were returned.");
      if (job.status === "refunded") {
        setError("This design exceeded the 60-minute window, so its credits were returned. Late results will still be recovered to your history.");
        return;
      }
    }
    setStatus("delayed");
  }, []);

  const generate = async () => {
    if (!canGenerate) return;
    setError(null);
    setResult(null);
    try {
      setStatus(files.length ? "uploading" : "queued");
      const inputAssetIds: string[] = [];
      if (files.length) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        for (const file of files) {
          const signResponse = await fetch("/api/assets/upload-url", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
          });
          const signed = (await signResponse.json()) as { assetId?: string; path?: string; token?: string; message?: string };
          if (!signResponse.ok || !signed.assetId || !signed.path || !signed.token) throw new Error(signed.message ?? "A secure upload could not be prepared.");
          const { error: uploadError } = await supabase.storage.from("private-assets").uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
          if (uploadError) throw new Error(`The reference image could not be uploaded: ${uploadError.message}`);
          inputAssetIds.push(signed.assetId);
        }
      }

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tool: activeTool, tier, prompt: prompt.trim(), inputAssetIds, roomType, style, aspectRatio }),
      });
      const payload = (await response.json()) as GenerationResponse & { message?: string; signIn?: boolean };
      if (response.status === 401) {
        throw new Error("Sign in with Google to save private uploads and use your credits.");
      }
      if (!response.ok) {
        throw new Error(payload.message ?? payload.error ?? "We could not start this design. No credits were used.");
      }
      setResult(payload);
      setStatus(payload.status);
      await pollJob(payload.id);
    } catch (cause) {
      setStatus("failed");
      setError(cause instanceof Error ? cause.message : "We could not start this design. No credits were used.");
    }
  };

  const reset = () => {
    setPrompt(tool.promptPlaceholder);
    setFiles([]);
    setStatus("idle");
    setResult(null);
    setError(null);
  };

  const previewUrl = result?.resultUrl ?? getExampleImage(activeTool);
  const isBusy = ["uploading", "queued", "processing", "delayed", "persisting"].includes(status);

  return (
    <section className="overflow-hidden border border-[var(--line)] bg-[var(--white)] shadow-[var(--shadow-lg)]" aria-label={`${tool.title} workspace`}>
      {showTabs ? (
        <div className="grid grid-cols-3 border-b border-[var(--line)] bg-[var(--paper)]" role="tablist" aria-label="Generator type">
          {homeTabs.map((tab) => (
            <button
              aria-selected={activeTool === tab.tool}
              className={`relative min-h-14 border-r border-[var(--line)] px-2 text-xs font-bold transition-colors last:border-r-0 sm:px-5 sm:text-sm ${activeTool === tab.tool ? "bg-[var(--white)] text-[var(--blue-deep)]" : "text-[var(--ink-soft)] hover:bg-[var(--paper-deep)]"}`}
              key={tab.tool}
              onClick={() => selectTool(tab.tool)}
              role="tab"
              type="button"
            >
              <span className="sm:hidden">{tab.mobileLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTool === tab.tool ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--blue)]" /> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid lg:grid-cols-[minmax(330px,0.8fr)_minmax(0,1.2fr)]">
        <div className="border-b border-[var(--line)] p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="eyebrow">{tool.eyebrow}</span>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.045em]">{tool.title}</h2>
            </div>
            <button className="grid size-11 shrink-0 place-items-center text-[var(--ink-soft)] hover:bg-[var(--paper)]" onClick={reset} type="button" aria-label="Reset generator">
              <RotateCcw size={17} />
            </button>
          </div>

          {tool.inputMode !== "text" ? (
            <div className="mt-6">
              <span className="field-label">Reference image <span className="field-hint">JPG, PNG, WebP · 30 MB</span></span>
              {files.length === 0 ? (
                <button
                  className="group grid min-h-36 w-full place-items-center border border-dashed border-[var(--line-strong)] bg-[var(--paper)] px-6 text-center transition-colors hover:border-[var(--blue)] hover:bg-[var(--blue-pale)]"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleFiles(event.dataTransfer.files);
                  }}
                  type="button"
                >
                  <span>
                    <UploadCloud className="mx-auto text-[var(--blue)]" size={25} />
                    <span className="mt-2 block text-sm font-bold">Upload a room or plan</span>
                    <span className="mt-1 block text-xs text-[var(--ink-soft)]">or drag it into this area</span>
                  </span>
                </button>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {imageUrls.map(({ file, url }, index) => (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-[var(--line)]" key={`${file.name}-${file.lastModified}`}>
                      {/* Local object URLs intentionally use a standard image element. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={`Reference ${index + 1}`} className="h-full w-full object-cover" src={url} />
                      <button
                        aria-label={`Remove ${file.name}`}
                        className="absolute right-1 top-1 grid size-7 place-items-center bg-[var(--ink)] text-white"
                        onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button className="grid h-24 w-24 shrink-0 place-items-center border border-dashed border-[var(--line-strong)] text-[var(--blue)]" onClick={() => fileInput.current?.click()} type="button" aria-label="Add another image">
                    <UploadCloud size={20} />
                  </button>
                </div>
              )}
              <input
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                multiple
                onChange={(event) => handleFiles(event.target.files)}
                ref={fileInput}
                type="file"
              />
            </div>
          ) : null}

          <div className="mt-6">
            <label className="field-label" htmlFor={`prompt-${activeTool}`}>
              Design brief <span className="field-hint">{prompt.length}/20,000</span>
            </label>
            <textarea
              className="field"
              id={`prompt-${activeTool}`}
              maxLength={20000}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={tool.promptPlaceholder}
              value={prompt}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tool.examples.map((example) => (
                <button className="min-h-8 border border-[var(--line)] bg-[var(--paper)] px-2.5 text-xs font-medium hover:border-[var(--blue)]" key={example} onClick={() => setPrompt(`${prompt.split("…")[0]}. Direction: ${example}.`)} type="button">
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <label>
              <span className="field-label">Room type</span>
              <select className="select-field" onChange={(event) => setRoomType(event.target.value)} value={roomType}>
                {roomTypes.map((room) => <option key={room}>{room}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Style</span>
              <select className="select-field" onChange={(event) => setStyle(event.target.value)} value={style}>
                {designStyles.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4">
            <span className="field-label">Model</span>
            <div className="grid grid-cols-2 border border-[var(--line)] p-1">
              {(["basic", "pro"] as const).map((option) => (
                <button
                  className={`min-h-12 px-3 text-left text-xs transition-colors ${tier === option ? "bg-[var(--ink)] text-[var(--paper)]" : "hover:bg-[var(--paper)]"}`}
                  key={option}
                  onClick={() => setTier(option)}
                  type="button"
                >
                  <span className="flex items-center justify-between font-bold capitalize">
                    {option}
                    {option === "pro" ? <Zap size={13} /> : <Sparkles size={13} />}
                  </span>
                  <span className={`mt-0.5 block ${tier === option ? "text-[color:oklch(82%_0.025_84)]" : "text-[var(--ink-soft)]"}`}>
                    {option === "basic" ? "1 credit · fast" : "3 credits · 2K"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 border-y border-[var(--line)]">
            <button className="flex min-h-12 w-full items-center justify-between text-sm font-bold" onClick={() => setAdvancedOpen((value) => !value)} type="button" aria-expanded={advancedOpen}>
              Output settings <ChevronDown className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`} size={16} />
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ${advancedOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <label className="block pb-4">
                  <span className="field-label">Aspect ratio</span>
                  <select className="select-field" onChange={(event) => setAspectRatio(event.target.value)} value={aspectRatio}>
                    {aspectRatios.map((ratio) => <option key={ratio}>{ratio}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 border border-[color:oklch(51%_0.19_25/0.3)] bg-[color:oklch(95%_0.025_25)] p-3 text-sm text-[var(--red)]" role="alert">
              <p>{error}</p>
              {error.startsWith("Sign in") ? <Link className="mt-2 inline-flex items-center gap-1 font-bold underline" href="/auth/sign-in">Sign in with Google <MoveRight size={14} /></Link> : null}
            </div>
          ) : null}

          <button className="button-primary mt-6 w-full" disabled={!canGenerate} onClick={generate} type="button">
            {isBusy ? <LoaderCircle className="animate-spin" size={17} /> : <Sparkles size={17} />}
            {isBusy ? "Creating your design" : `Create with ${tier === "basic" ? "1" : "3"} credit${tier === "basic" ? "" : "s"}`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--ink-soft)]">
            <LockKeyhole size={12} /> Private uploads · automatic refund on model failure
          </p>
        </div>

        <div className="flex min-h-[520px] flex-col bg-[var(--paper)] lg:min-h-[720px]">
          <div className="flex min-h-14 items-center justify-between border-b border-[var(--line)] px-5 sm:px-7">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em]">
              <span className={`size-2 rounded-full ${status === "success" ? "bg-[var(--green)]" : isBusy ? "bg-[var(--amber)]" : status === "failed" || status === "refunded" ? "bg-[var(--red)]" : "bg-[var(--line-strong)]"}`} />
              {status === "idle" ? "Preview" : status}
            </div>
            <span className="text-xs text-[var(--ink-soft)]">{aspectRatio} · {tier === "pro" ? "2K" : "standard"}</span>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
            <div className="blueprint-grid absolute inset-0 opacity-65" />
            <div className="relative w-full overflow-hidden border border-[var(--line)] bg-[var(--white)] shadow-[var(--shadow-sm)]">
              <div className="relative aspect-[4/3]">
                <Image
                  alt={result?.resultUrl ? `Generated result for ${tool.title}` : `Editorial example for ${tool.title}`}
                  className={`object-cover transition-[filter,opacity] duration-500 ${isBusy ? "scale-[1.01] blur-[3px] opacity-50" : "opacity-100"}`}
                  fill
                  priority={showTabs}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  src={previewUrl}
                />
                {!result?.resultUrl && status === "idle" ? (
                  <span className="absolute left-3 top-3 bg-[var(--ink)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-white">Editorial example</span>
                ) : null}
                {isBusy ? (
                  <div className="absolute inset-0 grid place-items-center bg-[color:oklch(22%_0.035_257/0.22)] p-6 text-center text-white">
                    <div className="w-full max-w-sm bg-[var(--ink)] p-5 shadow-[var(--shadow-lg)]">
                      <div className="mb-4 h-1 overflow-hidden bg-[color:oklch(96.8%_0.008_84/0.2)]"><div className="progress-drift h-full w-1/3 bg-[var(--blue)]" /></div>
                      <p className="text-sm font-bold">{statusCopy[status as keyof typeof statusCopy]}</p>
                      <p className="mt-1 text-xs text-[color:oklch(82%_0.02_84)]">You can safely leave this page. Reconciliation keeps watching the job.</p>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex min-h-14 items-center justify-between border-t border-[var(--line)] px-4">
                <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                  {status === "success" ? <Check className="text-[var(--green)]" size={15} /> : <ImageIcon size={15} />}
                  {status === "success" ? "Saved to your history" : "Your final result appears here"}
                </div>
                {result?.resultUrl ? (
                  <a className="button-ghost min-h-9 px-2 text-xs" download href={result.resultUrl}>
                    <Download size={14} /> Download
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-[var(--line)] bg-[var(--white)] px-5 py-4 text-xs sm:px-7">
            <span className="flex items-center gap-2 text-[var(--ink-soft)]"><Clock3 size={14} /> Recent designs</span>
            <Link className="text-right font-bold text-[var(--blue-deep)]" href="/history">Open history <MoveRight className="ml-1 inline" size={13} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
