import { api } from "./api";

export interface AssignableUser {
  _id: string;
  name: string;
  email: string;
}

export const userService = {
  list: async () => {
    const { data } = await api.get<{ success: boolean; users: AssignableUser[] }>("/users");
    return data.users;
  },
};
