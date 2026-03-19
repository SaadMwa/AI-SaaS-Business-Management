import { aiApi } from "./api";

export type AiActionMode = "manual" | "direct" | "hybrid";

export interface AiChatRequest {
  question: string;
  userId?: string;
  sessionId?: string;
  aiActionMode?: AiActionMode;
  businessAdvisorMode?: boolean;
}

export interface AiUiAction {
  type: "open_form";
  entityType: "task" | "sale" | "customer" | "product";
  mode: "create" | "update";
  prefill?: Record<string, unknown>;
}

export interface AiChatResponse {
  answer?: string;
  mode?: "ACTION" | "CHAT" | "BUSINESS_ADVICE";
  requiresConfirmation?: { type: "delete" | "history_delete"; prompt: string };
  cards?: Array<Record<string, unknown>>;
  sessionId?: string;
  uiAction?: AiUiAction;
  proactiveActions?: string[];
}

export interface AiInteractiveRequest {
  entityType: "task" | "sale" | "customer" | "product";
  mode: "create" | "update";
  payload: Record<string, unknown>;
}

export interface AiInteractiveResponse {
  success?: boolean;
  answer?: string;
  message?: string;
  cards?: Array<Record<string, unknown>>;
  rateLimited?: boolean;
}

export const aiService = {
  ask: async (payload: AiChatRequest) => {
    const { data } = await aiApi.post<AiChatResponse>("/", payload);
    return data;
  },
  interactiveSubmit: async (payload: AiInteractiveRequest) => {
    const { data } = await aiApi.post<AiInteractiveResponse>("/interactive-submit", payload);
    return data;
  },
  resetConversation: async (sessionId?: string) => {
    const { data } = await aiApi.post<{ success: boolean; message: string }>("/reset-conversation", {
      sessionId,
    });
    return data;
  },
  ping: async () => {
    const { data } = await aiApi.get<{ ok: boolean; ts: string }>("/ping");
    return data;
  },
};
