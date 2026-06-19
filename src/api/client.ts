import axios, { type AxiosError } from "axios";
import { clearAuthSession, getAccessToken } from "../lib/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: false,
});

client.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retryCount?: number; _isRetry?: boolean };

    const isAuthLogin = originalRequest?.url?.includes("/auth/login");
    if (error.message === "Network Error" && originalRequest && !isAuthLogin) {
      originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
      if (originalRequest._retryCount <= 3) {
        await new Promise((r) => setTimeout(r, originalRequest._retryCount * 1500));
        return client(originalRequest);
      }
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._isRetry) {
      originalRequest._isRetry = true;
      clearAuthSession();
      window.dispatchEvent(new Event("auth-expired"));
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
