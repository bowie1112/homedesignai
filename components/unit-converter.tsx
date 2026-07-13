"use client";

import { ArrowLeftRight } from "lucide-react";
import { useMemo, useState } from "react";

export function UnitConverter({ from, to, factor }: { from: string; to: string; factor: number }) {
  const [value, setValue] = useState("100");
  const result = useMemo(() => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed * factor;
  }, [factor, value]);

  return (
    <div className="paper-panel p-5 sm:p-8">
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <label>
          <span className="field-label">From ({from})</span>
          <input className="select-field text-lg tabular-nums" inputMode="decimal" onChange={(event) => setValue(event.target.value)} value={value} />
        </label>
        <div className="grid size-11 place-items-center border border-[var(--line)] bg-[var(--paper)]"><ArrowLeftRight size={18} /></div>
        <div>
          <span className="field-label">Result ({to})</span>
          <output className="flex min-h-12 w-full items-center border border-[var(--line)] bg-[var(--blue-pale)] px-4 text-lg font-semibold tabular-nums">
            {result === null ? "Enter a number" : Number(result.toFixed(4)).toLocaleString("en-US")}
          </output>
        </div>
      </div>
      <p className="mt-5 text-xs text-[var(--ink-soft)]">Formula: {value || "value"} {from} × {factor} = {result === null ? "—" : Number(result.toFixed(4))} {to}</p>
    </div>
  );
}
