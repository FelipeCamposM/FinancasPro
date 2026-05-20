"use client";

import { Minus, Plus } from "lucide-react";

interface NumberStepperProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: number;
  min?: number;
  placeholder?: string;
  color?: string;
}

export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  placeholder = "0",
  color = "text-white/80",
}: NumberStepperProps) {
  const current = value ?? 0;

  function decrement() {
    const next = Math.max(min, parseFloat((current - step).toFixed(6)));
    onChange(next === 0 && min === 0 ? undefined : next);
  }

  function increment() {
    onChange(parseFloat((current + step).toFixed(6)));
  }

  return (
    <div className="flex items-center rounded-lg border border-white/[0.12] bg-white/[0.04]">
      <button
        type="button"
        onClick={decrement}
        className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-white/[0.08] text-white/35 transition-colors hover:bg-white/[0.07] hover:text-white/80"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value === undefined ? "" : String(value)}
        onChange={(e) => {
          const raw = e.target.value.replace(",", ".");
          if (raw === "") {
            onChange(undefined);
            return;
          }
          const n = parseFloat(raw);
          if (!isNaN(n)) onChange(n);
        }}
        className={`w-0 flex-1 min-w-0 bg-transparent text-center text-sm font-bold tabular-nums outline-none placeholder:text-white/20 ${color}`}
      />
      <button
        type="button"
        onClick={increment}
        className="flex h-10 w-10 shrink-0 items-center justify-center border-l border-white/[0.08] text-white/35 transition-colors hover:bg-white/[0.07] hover:text-white/80"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
