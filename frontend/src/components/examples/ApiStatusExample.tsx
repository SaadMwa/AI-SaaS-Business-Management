import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiService, type ApiStatusResponse } from "../../services/api.service";

export default function ApiStatusExample() {
  const { data, loading, error, request } = useApi<ApiStatusResponse>();
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const handleCheck = async () => {
    const response = await request({ method: "GET", url: "/status" });
    setLastChecked(response.status.ts);
  };

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <header>
        <h2 className="text-lg font-semibold text-foreground">API Status</h2>
        <p className="text-sm text-muted-foreground">
          Example call to <code>/api/status</code>.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" type="button" onClick={handleCheck} disabled={loading}>
          {loading ? "Checking..." : "Check Status"}
        </button>
        <button
          className="btn-ghost"
          type="button"
          onClick={() => void apiService.status()}
        >
          Direct Service Call
        </button>
      </div>

      {error ? <div className="text-sm text-danger-text">Error: {error}</div> : null}

      {data ? (
        <div className="text-sm text-muted-foreground">
          <div>API: {data.status.api}</div>
          <div>DB: {data.status.db}</div>
          <div>AI: {data.status.ai}</div>
          <div>Server Time: {new Date(data.status.ts).toLocaleString()}</div>
          {lastChecked ? <div>Last Checked: {new Date(lastChecked).toLocaleString()}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
