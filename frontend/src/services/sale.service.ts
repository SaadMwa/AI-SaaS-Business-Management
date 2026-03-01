import { api } from "./api";
import { Sale } from "../types";

export const saleService = {
  list: async () => {
    const { data } = await api.get<{ success: boolean; sales: Sale[] }>("/sales");
    return data.sales;
  },
  get: async (id: string) => {
    const { data } = await api.get<{ success: boolean; sale: Sale }>(`/sales/${id}`);
    return data.sale;
  },
  getByNumber: async (saleNumber: string) => {
    const { data } = await api.get<{ success: boolean; sale: Sale }>(
      `/sales/number/${saleNumber}`
    );
    return data.sale;
  },
  create: async (payload: Partial<Sale>) => {
    const { data } = await api.post<{ success: boolean; sale: Sale }>("/sales", payload);
    return data.sale;
  },
  update: async (id: string, payload: Partial<Sale>) => {
    const { data } = await api.put<{ success: boolean; sale: Sale }>(`/sales/${id}`, payload);
    return data.sale;
  },
  updateByNumber: async (saleNumber: string, payload: Partial<Sale>) => {
    const { data } = await api.put<{ success: boolean; sale: Sale }>(
      `/sales/number/${saleNumber}`,
      payload
    );
    return data.sale;
  },
  assignByNumber: async (saleNumber: string, payload: { assignedTo?: string; assigneeEmail?: string }) => {
    const { data } = await api.post<{ success: boolean; sale: Sale }>(
      `/sales/number/${saleNumber}/assign`,
      payload
    );
    return data.sale;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/sales/${id}`);
    return data.message;
  },
  removeByNumber: async (saleNumber: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/sales/number/${saleNumber}`
    );
    return data.message;
  },
};
