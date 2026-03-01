import { api } from "./api";
import { AiGuide } from "../types";

export const aiHelpService = {
  getGuide: async () => {
    const { data } = await api.get<{ success: boolean; guide: AiGuide }>("/ai/help");
    return data.guide;
  },
};
