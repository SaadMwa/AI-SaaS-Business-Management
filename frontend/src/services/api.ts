import axios, { type AxiosInstance } from "axios";
import { resolveAiBaseUrl, resolveApiBaseUrl } from "../config/env";

const TOKEN_KEY = "auth_token";

const apiBaseUrl = resolveApiBaseUrl();
const aiBaseUrl = resolveAiBaseUrl();

const dispatchLoading = (pending: number) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("app:loading", {
      detail: { pending },
    })
  );
};

const normalizeMessage = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "Unexpected error";
    }
  }
  return "Unexpected error";
};

const dispatchApiErrorToast = (message: unknown) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("app:toast", {
      detail: {
        type: "error",
        message: normalizeMessage(message),
      },
    })
  );
};

const attachInterceptors = (client: AxiosInstance) => {
  let pendingRequests = 0;

  client.interceptors.request.use((config) => {
    pendingRequests += 1;
    dispatchLoading(pendingRequests);
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      pendingRequests = Math.max(0, pendingRequests - 1);
      dispatchLoading(pendingRequests);
      return response;
    },
    (error) => {
      pendingRequests = Math.max(0, pendingRequests - 1);
      dispatchLoading(pendingRequests);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unexpected error";
      dispatchApiErrorToast(message);
      return Promise.reject(error);
    }
  );
};

export const api = axios.create({
  // Base URL points to your backend /api prefix.
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export const aiApi = axios.create({
  // Base URL points to your backend /api/ai prefix.
  baseURL: aiBaseUrl,
  withCredentials: true,
});

attachInterceptors(api);
attachInterceptors(aiApi);

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

export const apiUrls = {
  apiBaseUrl,
  aiBaseUrl,
};

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const candidate =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;
    return normalizeMessage(candidate);
  }
  return normalizeMessage(error);
};
