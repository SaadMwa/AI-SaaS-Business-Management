import { useEffect, useMemo, useState } from "react";
import { historyService } from "../services/history.service";
import { HistoryEntry, HistorySettings } from "../types";
import { logger } from "../utils/logger";
import ConfirmModal from "../components/ConfirmModal";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("all");
  const [performedBy, setPerformedBy] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [settings, setSettings] = useState<HistorySettings | null>(null);
  const [retentionChoice, setRetentionChoice] = useState<string>("90");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    run: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const filters = useMemo(() => {
    return {
      entityType: entityType === "all" ? undefined : (entityType as any),
      performedBy: performedBy === "all" ? undefined : (performedBy as any),
      from: from || undefined,
      to: to || undefined,
      search: debouncedSearch || undefined,
    };
  }, [entityType, performedBy, from, to, debouncedSearch]);

  const detailLabel = (entry: HistoryEntry) => {
    const details = entry.details || entry.meta || {};
    if ((details as any).question) return String((details as any).question);
    if ((details as any).summary) return String((details as any).summary);
    if ((details as any).filters) return `Filters: ${JSON.stringify((details as any).filters)}`;
    return "-";
  };

  const safeText = (value: string) => value.replace(/\s+/g, " ").trim();

  const performedByLabel = (entry: HistoryEntry) =>
    entry.performedBy === "ai" ? "AI" : "User";

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`history-skeleton-${index}`}
          className="rounded-lg border border-slate-100 bg-white p-4"
        >
          <div className="skeleton h-3 w-40 rounded" />
          <div className="skeleton mt-3 h-3 w-28 rounded" />
          <div className="skeleton mt-3 h-3 w-full rounded" />
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await historyService.getHistory(filters);
        setHistory(data);
      } catch (error) {
        logger.error("history_load_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [filters]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await historyService.getSettings();
        setSettings(data);
        if (data?.retentionDays === null) {
          setRetentionChoice("forever");
        } else if (typeof data?.retentionDays === "number") {
          setRetentionChoice(String(data.retentionDays));
        }
      } catch (error) {
        logger.error("history_settings_load_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };
    void loadSettings();
  }, []);

  const applyRetention = async () => {
    const retentionDays =
      retentionChoice === "forever" ? null : Number(retentionChoice || "90");
    const updated = await historyService.updateSettings(retentionDays);
    setSettings(updated);
  };

  const handleDelete = async (
    label: string,
    deleteFilters: Parameters<typeof historyService.deleteHistory>[0]
  ) => {
    try {
      setDeleting(true);
      await historyService.deleteHistory(deleteFilters);
      const data = await historyService.getHistory(filters);
      setHistory(data);
    } catch (error) {
      logger.error("history_delete_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setDeleting(false);
      setConfirmAction(null);
    }
  };

  const downloadExport = async (format: "json" | "csv") => {
    try {
      setExporting(true);
      const payload = await historyService.exportHistory(format, filters);
      const blob = new Blob([payload], {
        type: format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `history-export-${ts}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error("history_export_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">History</p>
          <h1 className="text-3xl sm:text-4xl text-foreground font-semibold">
            Action Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Track task, customer, and sales activity including AI queries.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void downloadExport("csv")}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void downloadExport("json")}
            disabled={exporting}
          >
            Export JSON
          </button>
          <button
            type="button"
            className={`btn-ghost ${viewMode === "table" ? "border border-slate-300" : ""}`}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
          <button
            type="button"
            className={`btn-ghost ${viewMode === "timeline" ? "border border-slate-300" : ""}`}
            onClick={() => setViewMode("timeline")}
          >
            Timeline
          </button>
        </div>
      </div>

      <div className="card w-full max-w-full space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-500">
            Entity
            <select
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="task">Tasks</option>
              <option value="customer">Customers</option>
              <option value="sale">Sales</option>
              <option value="ai">AI</option>
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Performed By
            <select
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
            >
              <option value="all">All</option>
              <option value="user">User</option>
              <option value="ai">AI</option>
            </select>
          </label>
          <label className="text-xs text-slate-500">
            From
            <input
              type="date"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input
              type="date"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-500 lg:col-span-2">
            Search
            <input
              type="text"
              className="mt-2 w-full max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Search actions, questions, or entities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="card space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Retention Settings</h2>
            <p className="text-sm text-muted-foreground">
              Choose how long to keep history before auto-cleanup runs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={retentionChoice}
              onChange={(e) => setRetentionChoice(e.target.value)}
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
            <button className="btn-primary" type="button" onClick={applyRetention}>
              Save Retention
            </button>
          </div>
        </div>
        {settings && (
          <p className="text-xs text-slate-500">
            Current retention:{" "}
            {settings.retentionDays === null ? "Forever" : `${settings.retentionDays} days`}
          </p>
        )}
      </div>

      <div className="card space-y-4 p-4 sm:p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Manual Cleanup</h2>
          <p className="text-sm text-muted-foreground">
            Remove history entries manually with safe confirmation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            disabled={deleting}
            onClick={() =>
              setConfirmAction({
                title: "Clear All History",
                message: "This will permanently remove all history entries.",
                run: () => handleDelete("clear all history", {}),
              })
            }
          >
            Clear All History
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={deleting}
            onClick={() =>
              setConfirmAction({
                title: "Clear Task History",
                message: "This will permanently remove task history entries.",
                run: () => handleDelete("clear task history", { entityType: "task" }),
              })
            }
          >
            Clear Task History
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={deleting}
            onClick={() =>
              setConfirmAction({
                title: "Clear Customer History",
                message: "This will permanently remove customer history entries.",
                run: () => handleDelete("clear customer history", { entityType: "customer" }),
              })
            }
          >
            Clear Customer History
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={deleting}
            onClick={() =>
              setConfirmAction({
                title: "Clear Sales History",
                message: "This will permanently remove sales history entries.",
                run: () => handleDelete("clear sales history", { entityType: "sale" }),
              })
            }
          >
            Clear Sales History
          </button>
        </div>
      </div>

      <div className="card w-full max-w-full p-4 sm:p-5">
        {loading ? (
          renderLoadingSkeleton()
        ) : viewMode === "timeline" ? (
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry._id} className="rounded-xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    {formatDate(entry.createdAt)}
                  </div>
                  <span
                    className={`chip ${entry.performedBy === "ai" ? "chip-info" : "chip-success"}`}
                  >
                    {performedByLabel(entry)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-800 font-semibold">
                  {(entry.actionType || entry.action || "action").toUpperCase()} -{" "}
                  {entry.entityType.toUpperCase()}
                  {entry.entityId || entry.entityNumber
                    ? ` #${entry.entityId || entry.entityNumber}`
                    : ""}
                </div>
                <div className="mt-2 break-words text-sm text-slate-500">
                  {safeText(detailLabel(entry))}
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    className="text-xs text-rose-600"
                    disabled={deleting}
                    onClick={() =>
                      setConfirmAction({
                        title: "Delete History Entry",
                        message: "This will permanently delete this history entry.",
                        run: async () => {
                          try {
                            setDeleting(true);
                            await historyService.deleteEntry(entry._id);
                            const data = await historyService.getHistory(filters);
                            setHistory(data);
                          } finally {
                            setDeleting(false);
                            setConfirmAction(null);
                          }
                        },
                      })
                    }
                  >
                    Delete entry
                  </button>
                </div>
              </div>
            ))}
            {!history.length && (
              <div className="rounded-lg border border-dashed border-border bg-card-muted py-10 text-center">
                <p className="text-sm font-semibold text-foreground">No history entries found</p>
                <p className="mt-1 text-xs text-muted">
                  Try adjusting filters or clearing the search query.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-lg border border-slate-100">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[860px] w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="w-[140px] px-3 py-3">Timestamp</th>
                  <th className="w-[110px] px-3 py-3">Entity</th>
                  <th className="w-[120px] px-3 py-3">Action</th>
                  <th className="w-[110px] px-3 py-3">By</th>
                  <th className="px-3 py-3">Details</th>
                  <th className="w-[88px] px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry._id} className="table-row-hover border-t border-slate-100">
                    <td className="px-3 py-3 align-top text-muted-foreground">{formatDate(entry.createdAt)}</td>
                    <td className="px-3 py-3 align-top text-muted-foreground">
                      {entry.entityType.toUpperCase()}
                      {entry.entityId || entry.entityNumber
                        ? ` #${entry.entityId || entry.entityNumber}`
                        : ""}
                    </td>
                    <td className="px-3 py-3 align-top text-muted-foreground break-words">{entry.actionType || entry.action}</td>
                    <td className="px-3 py-3 align-top">
                      <span
                        className={`chip ${
                          entry.performedBy === "ai" ? "chip-info" : "chip-success"
                        }`}
                      >
                        {performedByLabel(entry)}
                      </span>
                    </td>
                  <td className="px-3 py-3 align-top text-muted">
                    <div className="max-w-[36rem] break-words whitespace-pre-wrap">
                      {safeText(detailLabel(entry))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <button
                      type="button"
                      className="text-xs text-rose-600"
                      disabled={deleting}
                      onClick={() =>
                        setConfirmAction({
                          title: "Delete History Entry",
                          message: "This will permanently delete this history entry.",
                          run: async () => {
                            try {
                              setDeleting(true);
                              await historyService.deleteEntry(entry._id);
                              const data = await historyService.getHistory(filters);
                              setHistory(data);
                            } finally {
                              setDeleting(false);
                              setConfirmAction(null);
                            }
                          },
                        })
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!history.length && (
                <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <div className="mx-auto max-w-sm space-y-1">
                        <p className="text-sm font-semibold text-slate-700">No history entries found</p>
                        <p className="text-xs text-slate-500">
                          Try adjusting filters or clearing the search query.
                        </p>
                      </div>
                    </td>
                </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title || "Confirm"}
        message={confirmAction?.message || ""}
        confirmText="Delete"
        loading={deleting}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) void confirmAction.run();
        }}
      />
    </div>
  );
}
