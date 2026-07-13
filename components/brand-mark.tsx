import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex min-h-11 items-center gap-2.5" aria-label="Home Design AI home">
      <span className="relative grid size-8 place-items-center overflow-hidden bg-[var(--blue)] text-white">
        <span className="absolute inset-[6px] border border-white/80" />
        <span className="h-px w-5 rotate-45 bg-white/80" />
        <span className="absolute h-px w-5 -rotate-45 bg-white/80" />
      </span>
      <span className={compact ? "hidden font-semibold tracking-[-0.03em] sm:block" : "font-semibold tracking-[-0.03em]"}>
        Home Design <span className="text-[var(--blue)]">AI</span>
      </span>
    </Link>
  );
}
