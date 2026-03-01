import axios from "axios";
import { resolveApiBaseUrl } from "../config/env";

const TOKEN_KEY = "auth_token";

export const api = axios.create({
  // Base URL points to your backend /api prefix.
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

const dispatchApiErrorToast = (message: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("app:toast", {
      detail: {
        type: "error",
        message,
      },
    })
  );
};

// Attach JWT to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Unexpected error";
    dispatchApiErrorToast(message);
    return Promise.reject(error);
  }
);

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message
    );
  }
  return "Unexpected error";
};
