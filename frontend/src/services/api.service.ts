import { api } from "./api";

export interface ApiStatusResponse {
  success: boolean;
  status: {
    api: "ok";
    db: "ok" | "degraded";
    ai: "ok" | "degraded";
    ts: string;
  };
}

export interface ApiHealthResponse {
  success: boolean;
  message: string;
}

export const apiService = {
  health: async () => {
    const { data } = await api.get<ApiHealthResponse>("/");
    return data;
  },
  status: async () => {
    const { data } = await api.get<ApiStatusResponse>("/status");
    return data;
  },
};
