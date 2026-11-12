import { api } from "@/lib/api";
import type { User } from "@/types/api";

export interface LoginResponse {
  access: string;
  user: User;
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const r = await api.post<LoginResponse>("/auth/login/", { email, password });
  return r.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout/");
};

export const me = async (): Promise<User> => {
  const r = await api.get<User>("/auth/me/");
  return r.data;
};

export const refresh = async (): Promise<string> => {
  const r = await api.post<{ access: string }>("/auth/refresh/");
  return r.data.access;
};