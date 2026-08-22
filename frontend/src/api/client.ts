import axios, { type AxiosError } from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export type ApiErrorBody = {
  success: false;
  data: null;
  error: { code: string; message: string; fields?: Record<string, string> };
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
};

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dayflow_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundary for FormData uploads.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export function getApiError(err: unknown): ApiErrorBody["error"] {
  const ax = err as AxiosError<ApiErrorBody>;
  if (ax.response?.data?.error) return ax.response.data.error;
  return { code: "NETWORK_ERROR", message: ax.message || "Network error" };
}
