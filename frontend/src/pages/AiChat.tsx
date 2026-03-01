import { useState } from "react";
import AiChat from "../components/AiChat";
import AiGuidePanel from "../components/AiGuidePanel";

export default function AiChatPage() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [prefillText, setPrefillText] = useState<string | null>(null);
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Ask AI</p>
          <h1 className="text-3xl sm:text-4xl text-foreground font-semibold">AI Insights Studio</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Turn raw operational data into clear next steps. The AI analyst can surface
            risks, summarize KPIs, and draft plans for your teams.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip chip-success">Real-time</span>
          <span className="chip chip-info">Secure</span>
          <button className="btn-ghost" onClick={() => setGuideOpen(true)}>
            AI Guide
          </button>
        </div>
      </div>

      <AiChat prefillText={prefillText ?? undefined} onPrefillConsumed={() => setPrefillText(null)} />
      <AiGuidePanel
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onExampleSelect={(example) => {
          setPrefillText(example);
          setGuideOpen(false);
        }}
      />
    </div>
  );
}
