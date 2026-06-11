import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (v: number) => void;
  autoFocus?: boolean;
  className?: string;
  /** Hide the +/- quick buttons (rarely needed). */
  compact?: boolean;
};

const QUICK = [1_000, 5_000, 10_000, 50_000, 100_000, 500_000];

/**
 * Reusable money input for VND.
 * - Large formatted display at top
 * - Direct keyboard entry (digits only, no negatives)
 * - Quick +/- buttons, Clear / Double / Half
 */
export function MoneyInput({
  value,
  onChange,
  autoFocus,
  className,
  compact,
}: Props) {
  const [text, setText] = useState(value > 0 ? String(Math.round(value)) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  // keep local text in sync when parent value changes externally
  useEffect(() => {
    const current = Number(text.replace(/\D/g, "")) || 0;
    if (current !== value) {
      setText(value > 0 ? String(Math.round(value)) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const set = (n: number) => {
    const v = Math.max(0, Math.round(n));
    setText(v > 0 ? String(v) : "");
    onChange(v);
  };

  const formatted = text ? Number(text).toLocaleString("vi-VN") : "";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-2xl bg-primary-soft p-5 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <input
            ref={inputRef}
            inputMode="numeric"
            value={formatted}
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, "");
              setText(clean);
              onChange(Number(clean) || 0);
            }}
            placeholder="0"
            className="min-w-0 flex-1 text-3xl font-bold text-center bg-transparent border-0 outline-none h-12 p-0 font-display"
          />
          <span className="text-xl font-bold text-primary">đ</span>
        </div>
      </div>

      {!compact && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {QUICK.map((q) => (
              <button
                key={"+" + q}
                type="button"
                onClick={() => set(value + q)}
                className="h-11 rounded-2xl bg-success/10 text-success font-semibold text-sm active:scale-95 transition-transform"
              >
                +{q.toLocaleString("vi-VN")}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK.map((q) => (
              <button
                key={"-" + q}
                type="button"
                onClick={() => set(value - q)}
                disabled={value < q}
                className="h-11 rounded-2xl bg-muted text-foreground font-semibold text-sm active:scale-95 transition-transform disabled:opacity-40"
              >
                -{q.toLocaleString("vi-VN")}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => set(0)}
              className="h-11 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm active:scale-95 transition-transform"
            >
              Xoá hết
            </button>
            <button
              type="button"
              onClick={() => set(value * 2)}
              className="h-11 rounded-2xl bg-accent text-accent-foreground font-semibold text-sm active:scale-95 transition-transform"
            >
              Gấp đôi
            </button>
            <button
              type="button"
              onClick={() => set(Math.floor(value / 2))}
              className="h-11 rounded-2xl bg-accent text-accent-foreground font-semibold text-sm active:scale-95 transition-transform"
            >
              Chia đôi
            </button>
          </div>
        </>
      )}
    </div>
  );
}
