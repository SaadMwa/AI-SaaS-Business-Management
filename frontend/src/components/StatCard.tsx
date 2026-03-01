import { useEffect, useMemo, useState } from "react";

const formatCompact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

export default function StatCard({
  title,
  value,
  numericValue,
  formatter,
  delta,
  helper,
}: {
  title: string;
  value?: string;
  numericValue?: number;
  formatter?: (value: number) => string;
  delta?: string;
  helper?: string;
}) {
  const [animatedValue, setAnimatedValue] = useState<number>(numericValue || 0);

  useEffect(() => {
    if (typeof numericValue !== "number") return;
    const start = animatedValue;
    const end = numericValue;
    const duration = 480;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(start + (end - start) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numericValue]);

  const displayValue = useMemo(() => {
    if (typeof numericValue === "number") {
      if (formatter) return formatter(animatedValue);
      return formatCompact(animatedValue);
    }
    return value || "0";
  }, [animatedValue, formatter, numericValue, value]);

  return (
    <div className="card lift-hover p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">{title}</p>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-2xl font-semibold text-ink">{displayValue}</div>
        {delta ? (
          <span className="text-sm font-semibold text-success-text">{delta}</span>
        ) : null}
      </div>
      {helper ? <p className="mt-2 text-xs text-ink-muted">{helper}</p> : null}
    </div>
  );
}
