import { useCallback, useState } from "react";
import type { AxiosRequestConfig } from "axios";
import { aiApi, getErrorMessage } from "../services/api";

export interface AiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useAi = <T = unknown>() => {
  const [state, setState] = useState<AiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(async (config: AxiosRequestConfig) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await aiApi.request<T>(config);
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, request, reset };
};
