import { api } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
  store_id: string;
  full_access?: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },
  profile: async () => {
    const { data } = await api.get<{ success: boolean; user: AuthUser }>("/users/profile");
    return data;
  },
};
