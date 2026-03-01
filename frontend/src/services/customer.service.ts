import { api } from "./api";
import { Customer } from "../types";

export const customerService = {
  list: async (query?: string) => {
    const { data } = await api.get<{ success: boolean; customers: Customer[] }>("/customers", {
      params: query ? { q: query } : undefined,
    });
    return data.customers;
  },
  get: async (id: string) => {
    const { data } = await api.get<{ success: boolean; customer: Customer }>(`/customers/${id}`);
    return data.customer;
  },
  getByNumber: async (customerNumber: string) => {
    const { data } = await api.get<{ success: boolean; customer: Customer }>(
      `/customers/number/${customerNumber}`
    );
    return data.customer;
  },
  create: async (payload: Pick<Customer, "name" | "email" | "phone">) => {
    const { data } = await api.post<{ success: boolean; customer: Customer }>(
      "/customers",
      payload
    );
    return data.customer;
  },
  update: async (id: string, payload: Partial<Customer>) => {
    const { data } = await api.put<{ success: boolean; customer: Customer }>(
      `/customers/${id}`,
      payload
    );
    return data.customer;
  },
  updateByNumber: async (customerNumber: string, payload: Partial<Customer>) => {
    const { data } = await api.put<{ success: boolean; customer: Customer }>(
      `/customers/number/${customerNumber}`,
      payload
    );
    return data.customer;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/customers/${id}`);
    return data.message;
  },
  removeByNumber: async (customerNumber: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/customers/number/${customerNumber}`
    );
    return data.message;
  },
};
