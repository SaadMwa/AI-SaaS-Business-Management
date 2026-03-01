import { api } from "./api";
import { HistoryEntry, HistorySettings } from "../types";

export type HistoryFilters = {
  entityType?: "task" | "customer" | "sale" | "ai";
  performedBy?: "user" | "ai";
  actionType?: string;
  entityId?: number;
  olderThanDays?: number;
  search?: string;
  from?: string;
  to?: string;
};

export const historyService = {
  getHistory: async (filters: HistoryFilters = {}) => {
    const { data } = await api.get<{ success: boolean; history: HistoryEntry[] }>("/history", {
      params: filters,
    });
    return data.history || [];
  },
  getCount: async (days = 1) => {
    const { data } = await api.get<{ success: boolean; count: number }>("/history/count", {
      params: { days },
    });
    return data.count || 0;
  },
  deleteHistory: async (filters: HistoryFilters = {}) => {
    const { data } = await api.delete<{ success: boolean; deleted: number }>("/history", {
      data: filters,
    });
    return data.deleted || 0;
  },
  deleteEntry: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; deleted: number }>(`/history/${id}`);
    return data.deleted || 0;
  },
  exportHistory: async (format: "json" | "csv", filters: HistoryFilters = {}) => {
    const response = await api.get<string>("/history/export", {
      params: { ...filters, format },
      responseType: "text",
    });
    return response.data;
  },
  getSettings: async () => {
    const { data } = await api.get<{ success: boolean; settings: HistorySettings }>(
      "/history/settings"
    );
    return data.settings;
  },
  updateSettings: async (retentionDays: number | null) => {
    const { data } = await api.put<{ success: boolean; settings: HistorySettings }>(
      "/history/settings",
      { retentionDays }
    );
    return data.settings;
  },
};
