import { api } from "./api";
import { Task } from "../types";

export const taskService = {
  list: async () => {
    const { data } = await api.get<{ success: boolean; tasks: Task[] }>("/tasks");
    return data.tasks;
  },
  get: async (id: string) => {
    const { data } = await api.get<{ success: boolean; task: Task }>(`/tasks/${id}`);
    return data.task;
  },
  getByNumber: async (taskNumber: number) => {
    const { data } = await api.get<{ success: boolean; task: Task }>(
      `/tasks/number/${taskNumber}`
    );
    return data.task;
  },
  create: async (payload: Partial<Task>) => {
    const { data } = await api.post<{ success: boolean; task: Task }>("/tasks", payload);
    return data.task;
  },
  update: async (id: string, payload: Partial<Task>) => {
    const { data } = await api.put<{ success: boolean; task: Task }>(`/tasks/${id}`, payload);
    return data.task;
  },
  updateByNumber: async (taskNumber: number, payload: Partial<Task>) => {
    const { data } = await api.put<{ success: boolean; task: Task }>(
      `/tasks/number/${taskNumber}`,
      payload
    );
    return data.task;
  },
  updateStatus: async (id: string, status: Task["status"]) => {
    const { data } = await api.patch<{ success: boolean; task: Task }>(`/tasks/${id}/status`, {
      status,
    });
    return data.task;
  },
  updateStatusByNumber: async (taskNumber: number, status: Task["status"]) => {
    const { data } = await api.put<{ success: boolean; task: Task }>(
      `/tasks/number/${taskNumber}`,
      { status }
    );
    return data.task;
  },
  updatePriorityByNumber: async (taskNumber: number, priority: Task["priority"]) => {
    const { data } = await api.put<{ success: boolean; task: Task }>(
      `/tasks/number/${taskNumber}`,
      { priority }
    );
    return data.task;
  },
  assignByNumber: async (taskNumber: number, payload: { assignedTo?: string; assigneeEmail?: string }) => {
    const { data } = await api.post<{ success: boolean; task: Task }>(
      `/tasks/number/${taskNumber}/assign`,
      payload
    );
    return data.task;
  },
  unassignByNumber: async (taskNumber: number) => {
    const { data } = await api.post<{ success: boolean; task: Task }>(
      `/tasks/number/${taskNumber}/unassign`
    );
    return data.task;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/tasks/${id}`);
    return data.message;
  },
  removeByNumber: async (taskNumber: number) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/tasks/number/${taskNumber}`
    );
    return data.message;
  },
};
