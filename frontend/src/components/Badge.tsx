type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "border-border text-ink-muted bg-surface-muted",
  info: "chip-info",
  success: "chip-success",
  warning: "chip-warning",
  danger: "bg-danger-bg text-danger-text border-danger-border",
};

export default function Badge({
  label,
  tone = "neutral",
  className = "",
}: {
  label: string;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={`chip ${toneClass[tone]} ${className}`.trim()}>
      {label}
    </span>
  );
}
