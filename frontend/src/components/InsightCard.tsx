import { Insight } from "../types";

const typeStyles: Record<Insight["type"], string> = {
  opportunity: "border-success-border bg-success-bg",
  risk: "border-danger-border bg-danger-bg",
  efficiency: "border-warning-border bg-warning-bg",
};

export default function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 ${typeStyles[insight.type]} animate-rise`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink">{insight.title}</h4>
        <span className="text-xs uppercase tracking-[0.2em] text-ink-faint">
          {insight.priority}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-muted">{insight.message}</p>
      <p className="mt-3 text-xs font-semibold text-ink-subtle">
        Action: {insight.action}
      </p>
    </div>
  );
}
