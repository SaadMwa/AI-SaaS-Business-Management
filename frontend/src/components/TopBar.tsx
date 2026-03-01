const ThemeIcon = ({ theme }: { theme: "light" | "dark" | "system" }) => {
  if (theme === "dark") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" />
      </svg>
    );
  }
  if (theme === "system") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.9 4.9l1.4 1.4" />
      <path d="M17.7 17.7l1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.9 19.1l1.4-1.4" />
      <path d="M17.7 6.3l1.4-1.4" />
    </svg>
  );
};

export default function TopBar({
  title,
  theme,
  resolvedTheme,
  onToggleTheme,
  activityCount,
  health,
}: {
  title: string;
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  onToggleTheme: () => void;
  activityCount: number;
  health: { ai: "ok" | "degraded"; db: "ok" | "degraded" } | null;
}) {
  const label = theme === "system" ? `System (${resolvedTheme})` : `${theme} mode`;
  const aiHealthy = health?.ai === "ok";
  const dbHealthy = health?.db === "ok";

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">AI Insights</p>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-ghost flex items-center gap-2 whitespace-nowrap" onClick={onToggleTheme}>
            <ThemeIcon theme={theme} />
            {label}
          </button>
          <div className="hidden sm:flex items-center gap-3 flex-wrap">
            <div className="chip chip-info">Activity (24h): {activityCount}</div>
            <div className={`chip ${aiHealthy ? "chip-success" : "chip-warning"}`}>
              AI: {aiHealthy ? "Online" : "Degraded"}
            </div>
            <div className={`chip ${dbHealthy ? "chip-success" : "chip-warning"}`}>
              DB: {dbHealthy ? "Online" : "Degraded"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
