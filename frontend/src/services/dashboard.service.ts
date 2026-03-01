import { api } from "./api";
import { DashboardResponse, Insight } from "../types";

export const dashboardService = {
  getDashboard: async () => {
    const { data } = await api.get<{ success: boolean } & DashboardResponse>("/dashboard");
    return data;
  },
  getInsights: async () => {
    const { data } = await api.get<{ success: boolean; insights: Insight[] }>("/insights");
    return data.insights;
  },
};
