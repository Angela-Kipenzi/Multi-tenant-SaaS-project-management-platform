import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

let accessToken: string | null = null;
let currentWorkspaceId: string | null = null;

export const setAccessToken = (t: string | null) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;

export const setCurrentWorkspaceId = (id: string | null) => {
  currentWorkspaceId = id;
};
export const getCurrentWorkspaceId = () => currentWorkspaceId;

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // send the refresh cookie
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (currentWorkspaceId) {
    config.headers.set("X-Workspace-ID", currentWorkspaceId);
  }
  return config;
});

// On 401, try to refresh once using the cookie, then replay the original request.
// If refresh fails, propagate the 401 — caller decides what to do.
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      !original._retry &&
      original.url !== "/auth/refresh/"
    ) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = api
            .post<{ access: string }>("/auth/refresh/")
            .then((r) => {
              setAccessToken(r.data.access);
              return r.data.access;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const newToken = await refreshing;
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api(original);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);