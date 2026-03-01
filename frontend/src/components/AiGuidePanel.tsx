import { useEffect, useState } from "react";
import Modal from "./Modal";
import { aiHelpService } from "../services/ai-help.service";
import { AiGuide } from "../types";
import { logger } from "../utils/logger";

export default function AiGuidePanel({
  open,
  onClose,
  onExampleSelect,
}: {
  open: boolean;
  onClose: () => void;
  onExampleSelect?: (example: string) => void;
}) {
  const [guide, setGuide] = useState<AiGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "capabilities" | "commands" | "examples" | "tips"
  >("overview");
  const [search, setSearch] = useState("");
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await aiHelpService.getGuide();
        setGuide(data);
      } catch (error) {
        logger.error("ai_guide_load_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const viewed = window.localStorage.getItem("ai_guide_walkthrough_seen");
    if (!viewed) {
      setShowWalkthrough(true);
      window.localStorage.setItem("ai_guide_walkthrough_seen", "1");
    }
  }, [open]);

  const includeBySearch = (value: string) =>
    !search.trim() || value.toLowerCase().includes(search.trim().toLowerCase());

  return (
    <Modal title="AI Guide" open={open} onClose={onClose}>
      {loading && <div className="text-sm text-slate-500">Loading AI guide...</div>}
      {!loading && !guide && (
        <div className="text-sm text-slate-500">AI guide is unavailable.</div>
      )}
      {guide && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Search commands..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="button" className="btn-ghost text-xs" onClick={() => setShowWalkthrough((v) => !v)}>
              {showWalkthrough ? "Hide Tutorial" : "Show Tutorial"}
            </button>
          </div>

          {showWalkthrough ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Quick Start Tutorial</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Start with a command like `Create a task` or `Show low stock products`.</li>
                <li>If AI opens a form, fill required fields or type follow-ups (e.g. `Title is Fix login`).</li>
                <li>Use `Cancel flow` or `Reset conversation` to stop any pending operation.</li>
              </ol>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Welcome" },
              { id: "capabilities", label: "What AI Can Do" },
              { id: "commands", label: "How to Talk" },
              { id: "examples", label: "Interactive Examples" },
              { id: "tips", label: "Tips" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">{guide.welcome.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{guide.welcome.description}</p>
                {guide.role ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Role: {guide.role}
                  </p>
                ) : null}
              </div>
              {guide.modes?.length ? (
                <div className="grid gap-2">
                  {guide.modes.map((mode) => (
                    <div key={mode.id} className="rounded-lg border border-slate-100 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-800">{mode.label}</p>
                      <p className="text-xs text-slate-500">{mode.description}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <ul className="space-y-2 text-sm text-slate-600">
                {guide.overview.map((item) => (
                  includeBySearch(item) ? (
                  <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
                    {item}
                  </li>
                  ) : null
                ))}
              </ul>
            </div>
          )}

          {activeTab === "capabilities" && (
            <div className="space-y-4">
              {[
                { label: "Task Management", items: guide.capabilities.tasks },
                { label: "Customer Management", items: guide.capabilities.customers },
                { label: "Sales Management", items: guide.capabilities.sales },
                { label: "Product Management", items: guide.capabilities.products || [] },
                { label: "Business Insights", items: guide.capabilities.insights },
                { label: "History Management", items: guide.capabilities.history },
              ].map((section) => (
                <div key={section.label}>
                  <h4 className="text-sm font-semibold text-slate-900">{section.label}</h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {section.items.map((item) => (
                      includeBySearch(item) ? (
                      <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
                        {item}
                      </li>
                      ) : null
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === "commands" && (
            <div className="space-y-4">
              {[
                { label: "Basic", items: guide.howToTalk.basic },
                { label: "Tasks", items: guide.howToTalk.tasks },
                { label: "Customers", items: guide.howToTalk.customers },
                { label: "Sales", items: guide.howToTalk.sales },
                { label: "Products", items: guide.howToTalk.products || [] },
                { label: "History", items: guide.howToTalk.history },
              ].map((section) => (
                <div key={section.label}>
                  <h4 className="text-sm font-semibold text-slate-900">{section.label}</h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {section.items.map((item) => (
                      includeBySearch(item) ? (
                      <li key={item} className="rounded-lg border border-slate-100 px-3 py-2">
                        {item}
                      </li>
                      ) : null
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === "examples" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Click an example to prefill the AI input box.
              </p>
              <div className="grid gap-2">
                {guide.interactiveExamples.map((item) => (
                  includeBySearch(item) ? (
                  <button
                    key={item}
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => onExampleSelect?.(item)}
                  >
                    {item}
                  </button>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {activeTab === "tips" && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Tips & Best Practices</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {guide.tips.map((item) => (
                  includeBySearch(item) ? (
                  <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
                    {item}
                  </li>
                  ) : null
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
