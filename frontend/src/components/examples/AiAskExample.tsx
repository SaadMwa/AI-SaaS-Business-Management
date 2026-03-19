import { useState, type FormEvent } from "react";
import { useAi } from "../../hooks/useAi";
import type { AiChatResponse } from "../../services/ai.service";

interface AiAskFormState {
  question: string;
}

export default function AiAskExample() {
  const { data, loading, error, request, reset } = useAi<AiChatResponse>();
  const [formState, setFormState] = useState<AiAskFormState>({ question: "" });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formState.question.trim()) return;
    await request({
      method: "POST",
      url: "/",
      data: {
        question: formState.question.trim(),
        businessAdvisorMode: true,
      },
    });
  };

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <header>
        <h2 className="text-lg font-semibold text-foreground">AI Ask</h2>
        <p className="text-sm text-muted-foreground">
          Example form calling <code>/api/ai</code> (POST).
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="text-sm font-medium text-foreground" htmlFor="ai-question">
          Question
        </label>
        <textarea
          id="ai-question"
          rows={3}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={formState.question}
          onChange={(event) => setFormState({ question: event.target.value })}
          placeholder="Ask about sales trends, inventory, or tasks..."
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Thinking..." : "Ask AI"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setFormState({ question: "" });
              reset();
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {error ? <div className="text-sm text-danger-text">Error: {error}</div> : null}

      {data?.answer ? (
        <div className="rounded-lg border border-border bg-card-muted p-3 text-sm text-muted-foreground">
          {data.answer}
        </div>
      ) : null}
    </section>
  );
}
