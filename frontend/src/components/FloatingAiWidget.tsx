import { useState } from "react";
import AiChat from "./AiChat";

export default function FloatingAiWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Admin AI Assistant</div>
              <div className="text-xs text-slate-500">Conversational task/sale/product workflows</div>
            </div>
            <button
              type="button"
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="max-h-[70vh] overflow-auto p-4">
            <AiChat />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="mt-3 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-card hover:bg-primary-strong"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "Hide AI" : "Ask Admin AI"}
      </button>
    </div>
  );
}
