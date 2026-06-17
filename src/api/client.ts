import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const sessionStr = localStorage.getItem("securenet_auth");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      } catch (e) {
        console.error("Error parsing auth session", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for retries and error handling
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Retry logic for network errors (up to 3 times)
    if (error.message === "Network Error" && !originalRequest._retryCount) {
      originalRequest._retryCount = 1;
      return new Promise((resolve) => {
        setTimeout(() => resolve(client(originalRequest)), 1500);
      });
    } else if (error.message === "Network Error" && originalRequest._retryCount < 3) {
      originalRequest._retryCount += 1;
      return new Promise((resolve) => {
        setTimeout(() => resolve(client(originalRequest)), originalRequest._retryCount * 1500);
      });
    }

    // Handle token refresh or session expiration
    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true;
      localStorage.removeItem("securenet_auth_session");
      window.dispatchEvent(new Event("auth-expired"));
    }

    return Promise.reject(error);
  }
);
