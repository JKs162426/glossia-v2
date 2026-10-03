import axios from "axios";

// In production the API serves this app, so a relative URL is enough.
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3000/api" : "/api");

// The session lives in an httpOnly cookie set by the API, so the token is
// never readable from JavaScript; we only need to send cookies along.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
});

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = url.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthCall && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default api;
