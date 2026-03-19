import { aiApi } from "./api";
import { AiGuide } from "../types";

export const aiHelpService = {
  getGuide: async () => {
    const { data } = await aiApi.get<{ success: boolean; guide: AiGuide }>("/help");
    return data.guide;
  },
};
