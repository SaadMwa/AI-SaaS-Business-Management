import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { authStorage } from "../services/api";
import { AiCard } from "../types";
import { historyService } from "../services/history.service";
import AiEntityFormModal from "./AiEntityFormModal";
import { resolveApiBaseUrl } from "../config/env";
import { useAiModal } from "../context/aiModal.context";

const API_BASE_URL = resolveApiBaseUrl();
const AI_URL = `${API_BASE_URL}/ai?stream=false`;
const AI_INTERACTIVE_URL = `${API_BASE_URL}/ai/interactive-submit`;
const AI_RESET_URL = `${API_BASE_URL}/ai/reset-conversation`;

export default function AiChat({
  prefillText,
  onPrefillConsumed,
}: {
  prefillText?: string;
  onPrefillConsumed?: () => void;
}) {
  const { user } = useAuth();
  const { action: formAction, open: formOpen, openModal, closeModal } = useAiModal();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [cards, setCards] = useState<AiCard[]>([]);
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "ai"; text: string; ts: string }>>([]);
  const [sessionId, setSessionId] = useState<string>(() => {
    const stored = window.localStorage.getItem("admin_ai_session_id");
    return stored || `admin-${Date.now()}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"ACTION" | "CHAT" | "BUSINESS_ADVICE">("ACTION");
  const [predictedMode, setPredictedMode] = useState<"ACTION" | "CHAT" | "BUSINESS_ADVICE">(
    "ACTION"
  );
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    type: "delete" | "history_delete";
    prompt: string;
  } | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [aiActionMode, setAiActionMode] = useState<"manual" | "direct" | "hybrid">("hybrid");
  const [businessAdvisorMode, setBusinessAdvisorMode] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const suggestedPrompts = [
    "Create Task",
    "Low stock?",
    "Top products?",
  ];

  const predictModeFromText = (text: string) => {
    const normalized = text.toLowerCase();
    if (!normalized.trim()) return "ACTION";
    if (/(create|update|delete|assign|unassign|task|customer|sale|history)/.test(normalized)) {
      return "ACTION";
    }
    if (/(grow|growth|marketing|strategy|revenue|sales|kpi|acquisition|churn|retention)/.test(normalized)) {
      return "BUSINESS_ADVICE";
    }
    return "CHAT";
  };

  useEffect(() => {
    if (prefillText && prefillText.trim()) {
      setQuestion(prefillText);
      setPredictedMode(predictModeFromText(prefillText));
      onPrefillConsumed?.();
    }
  }, [prefillText, onPrefillConsumed]);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "auto",
    });
  }, [chatLog, loading]);

  const sendQuestion = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setAnswer("");
    setCards([]);
    setPendingConfirmation(null);
    setChatLog((prev) => [...prev, { role: "user", text: trimmed, ts: new Date().toISOString() }]);

    try {
      const token = authStorage.getToken();
      const payload = {
        question: trimmed,
        userId: user?.id,
        sessionId,
        aiActionMode,
        businessAdvisorMode,
      };
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status})`);
      }

      const data = (await response.json()) as {
        answer?: string;
        businessData?: any;
        mode?: "ACTION" | "CHAT" | "BUSINESS_ADVICE";
        requiresConfirmation?: { type: "delete" | "history_delete"; prompt: string };
        cards?: AiCard[];
        sessionId?: string;
        uiAction?: {
          type: "open_form";
          entityType: "task" | "sale" | "customer" | "product";
          mode: "create" | "update";
          prefill?: Record<string, unknown>;
        };
        proactiveActions?: string[];
      };
      const nextAnswer =
        typeof data.answer === "string" && data.answer.trim().length
          ? data.answer
          : "AI did not return a response. Please try again.";
      setAnswer(nextAnswer);
      setCards(Array.isArray(data.cards) ? data.cards : []);
      if (data.sessionId && typeof data.sessionId === "string") {
        setSessionId(data.sessionId);
        window.localStorage.setItem("admin_ai_session_id", data.sessionId);
      }
      setChatLog((prev) => [...prev, { role: "ai", text: nextAnswer, ts: new Date().toISOString() }]);
      if (data.uiAction?.type === "open_form") {
        openModal(data.uiAction);
      }
      if (data.mode === "CHAT" || data.mode === "BUSINESS_ADVICE" || data.mode === "ACTION") {
        setMode(data.mode);
      } else {
        setMode("ACTION");
      }
      if (data.requiresConfirmation) {
        setPendingConfirmation(data.requiresConfirmation);
      }
      if (Array.isArray(data.proactiveActions) && data.proactiveActions.length) {
        const proactiveText = `Proactive next actions:\n- ${data.proactiveActions.join("\n- ")}`;
        setChatLog((prev) => [...prev, { role: "ai", text: proactiveText, ts: new Date().toISOString() }]);
      }
      const results = data.businessData?.execution?.results;
      if (Array.isArray(results) && results.length) {
        if (results.some((result) => result.output?.task || result.output?.tasks)) {
          window.dispatchEvent(new CustomEvent("tasks:refresh"));
        }
        if (results.some((result) => result.output?.customer || result.output?.customers)) {
          window.dispatchEvent(new CustomEvent("customers:refresh"));
        }
        if (results.some((result) => result.output?.sale || result.output?.sales)) {
          window.dispatchEvent(new CustomEvent("sales:refresh"));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach AI service.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (params: {
    entityType: "task" | "sale" | "customer" | "product";
    mode: "create" | "update";
    payload: Record<string, unknown>;
  }) => {
    const token = authStorage.getToken();
    try {
      setSubmittingForm(true);
      const response = await fetch(AI_INTERACTIVE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
      });
      const data = (await response.json()) as {
        success?: boolean;
        answer?: string;
        message?: string;
        cards?: AiCard[];
      };
      if (!response.ok || data.success === false) {
        throw new Error(data.message || `Submission failed (${response.status})`);
      }
      const answerText = data.answer || "Saved successfully.";
      setAnswer(answerText);
      setCards(Array.isArray(data.cards) ? data.cards : []);
      closeModal();
      setChatLog((prev) => [...prev, { role: "ai", text: answerText, ts: new Date().toISOString() }]);
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "success", message: "AI action completed successfully." },
        })
      );
      window.dispatchEvent(new CustomEvent("tasks:refresh"));
      window.dispatchEvent(new CustomEvent("customers:refresh"));
      window.dispatchEvent(new CustomEvent("sales:refresh"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to submit form.");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendQuestion(question);
  };

  const clearChatHistory = async () => {
    setChatLog([]);
    setAnswer("");
    setCards([]);
    setSessionId(`admin-${Date.now()}`);
    closeModal();
    window.localStorage.removeItem("admin_ai_session_id");
    try {
      setClearingHistory(true);
      await historyService.deleteHistory({ entityType: "ai" });
    } catch (error) {
      // Ignore remote clear failures to keep local UX responsive.
    } finally {
      setClearingHistory(false);
    }
  };

  const handleModalCancel = async () => {
    closeModal();
    setPendingConfirmation(null);
    setError(null);
    try {
      const token = authStorage.getToken();
      await fetch(AI_RESET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId }),
      });
      setChatLog((prev) => [
        ...prev,
        { role: "ai", text: "Cancelled current flow and reset pending AI state.", ts: new Date().toISOString() },
      ]);
    } catch {
      // Keep UX resilient even if reset endpoint fails.
    }
  };

  const renderCardDetails = (card: AiCard) => {
    if (card.type === "task") {
      return (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>Description: {String(card.details.description || "-")}</div>
          <div>Assigned: {String(card.details.assignedTo || card.details.assigned_user || "Unassigned")}</div>
          <div>Status: {String(card.details.status || "-")}</div>
        </div>
      );
    }
    if (card.type === "sale") {
      return (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>Product: {String(card.details.product || "-")}</div>
          <div>Quantity: {String(card.details.quantity || "-")}</div>
          <div>Total: ${Number(card.details.total_price || 0).toFixed(2)}</div>
        </div>
      );
    }
    if (card.type === "product") {
      return (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>Price: ${Number(card.details.price || 0).toFixed(2)}</div>
          <div>Stock: {String(card.details.stock || "-")}</div>
          <div>Category: {String(card.details.category || "-")}</div>
          <div className="line-clamp-2">Description: {String(card.details.description || "-")}</div>
          {card.details.image ? (
            <img
              src={String(card.details.image)}
              alt={card.title}
              className="mt-2 h-20 w-full rounded object-cover"
            />
          ) : null}
        </div>
      );
    }

    return (
      <pre className="mt-2 overflow-auto rounded bg-card-muted p-2 text-xs text-muted">
        {JSON.stringify(card.details, null, 2)}
      </pre>
    );
  };

  return (
    <section className="space-y-4 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="uppercase tracking-[0.3em]">Mode</span>
          <span className="chip chip-info">{mode === "BUSINESS_ADVICE" ? "Advisor" : mode}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="uppercase tracking-[0.3em]">Predicted</span>
          <span className="chip chip-success">
            {predictedMode === "BUSINESS_ADVICE" ? "Advisor" : predictedMode}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="btn-ghost rounded-full text-xs"
              onClick={() => {
                setQuestion(prompt);
                setPredictedMode(predictModeFromText(prompt));
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`btn-ghost text-xs ${businessAdvisorMode ? "border-primary text-primary" : ""}`}
          onClick={() => setBusinessAdvisorMode((prev) => !prev)}
        >
          {businessAdvisorMode ? "Business Advisor Mode: ON" : "Business Advisor Mode: OFF"}
        </button>
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={clearChatHistory}
          disabled={clearingHistory}
        >
          {clearingHistory ? "Clearing..." : "Clear chat history"}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Ask a question</label>
        <div className="flex flex-wrap gap-2">
          {(["manual", "direct", "hybrid"] as const).map((modeOption) => (
            <button
              key={modeOption}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                aiActionMode === modeOption
                  ? "border-primary bg-primary/10 text-primary-strong"
                  : "border-border text-muted"
              }`}
              onClick={() => setAiActionMode(modeOption)}
            >
              {modeOption === "manual"
                ? "Mode: Manual Popup"
                : modeOption === "direct"
                ? "Mode: Direct AI"
                : "Mode: Hybrid"}
            </button>
          ))}
        </div>
        <textarea
          value={question}
          onChange={(e) => {
            const next = e.target.value;
            setQuestion(next);
            setPredictedMode(predictModeFromText(next));
          }}
          rows={4}
          placeholder="Ask about revenue, customers, sales trends, or tasks..."
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || question.trim().length === 0}
        >
          {loading ? (
            <>
              <span className="btn-inline-spinner" />
              Thinking...
            </>
          ) : (
            "Ask AI"
          )}
        </button>
      </form>

      {error ? (
        <div className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          {error}
        </div>
      ) : null}

      {!answer && !loading && !error ? (
        <div className="rounded-lg border border-border bg-card-muted px-4 py-3 text-sm text-muted-foreground">
          Ask a question to get AI insights, or use one of the suggested prompts above.
        </div>
      ) : null}

      {answer ? (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {answer}
        </div>
      ) : null}

      {cards.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {cards.map((card) => (
            <article key={`${card.type}-${card.id}`} className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted">{card.type}</div>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{card.title}</h3>
              {card.subtitle ? <p className="text-xs text-muted-foreground">{card.subtitle}</p> : null}
              <div className="mt-2">{renderCardDetails(card)}</div>
            </article>
          ))}
        </div>
      ) : null}

      {chatLog.length ? (
        <div className="glass-surface rounded-lg border border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wide text-muted">Session history</div>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => {
                const blob = new Blob([JSON.stringify(chatLog, null, 2)], {
                  type: "application/json;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `admin-ai-chat-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export Logs
            </button>
          </div>
          <div ref={chatContainerRef} className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {chatLog.slice(-8).map((item, idx) => (
              <div
                key={`${item.ts}-${idx}`}
                className={`rounded-md border p-3 text-sm ${
                  item.role === "user"
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{item.role === "user" ? "You" : "AI"}</span>
                  <button
                    type="button"
                    className="text-xs text-danger-text"
                    onClick={() =>
                      setChatLog((prev) =>
                        prev.filter((entry) => !(entry.ts === item.ts && entry.text === item.text))
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
                <p className="break-words whitespace-pre-wrap text-muted-foreground">{item.text}</p>
                <span className="mt-1 inline-block text-xs text-muted">
                  {new Date(item.ts).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {loading ? (
              <div className="rounded-md border border-border bg-card p-3 text-sm text-muted">
                <div className="typing-dots inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted" />
                  <span className="h-2 w-2 rounded-full bg-muted" />
                  <span className="h-2 w-2 rounded-full bg-muted" />
                </div>
                <span className="ml-2 text-xs uppercase tracking-wider text-muted">
                  AI is thinking...
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {pendingConfirmation ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={loading}
            onClick={() => sendQuestion(pendingConfirmation.prompt)}
          >
            Confirm delete
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={loading}
            onClick={() => setPendingConfirmation(null)}
          >
            Cancel
          </button>
        </div>
      ) : null}

      <AiEntityFormModal
        action={formAction}
        open={formOpen}
        onClose={() => void handleModalCancel()}
        onSubmit={handleFormSubmit}
        submitting={submittingForm}
      />
    </section>
  );
}
