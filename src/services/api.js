// src/services/api.js
import axios from "axios";

// Automatically use the host IP/domain the frontend is accessed from, defaulting to 127.0.0.1
export const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_URL ||
  `http://${window.location.hostname || "127.0.0.1"}:8000`;

const API_BASE_URL =
  import.meta.env.VITE_API_URL || `${BACKEND_ORIGIN}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ==========================================
// REQUEST INTERCEPTOR
// Automatically attach JWT access token
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// LOGOUT HELPER
// ==========================================
export const logout = async () => {
  try {
    await axios.post(`${API_BASE_URL}/accounts/logout/`, {}, { withCredentials: true });
  } catch (e) {
    console.error("Backend logout error:", e);
  }
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");

  // Replace history so Back button won't return
  // to protected pages
  window.location.replace("/login");
};

// ==========================================
// RESPONSE INTERCEPTOR
// Refresh token automatically on 401
// ==========================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized and request has not been retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Request a new access token using the HTTP-only cookie
        const response = await axios.post(
          `${API_BASE_URL}/accounts/token/refresh/`,
          {},
          { withCredentials: true }
        );

        const newAccessToken =
          response.data.access;

        // Save the new token
        sessionStorage.setItem(
          "accessToken",
          newAccessToken
        );

        // Backward compatibility
        sessionStorage.setItem(
          "token",
          newAccessToken
        );

        // Update Authorization header
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → logout
        localStorage.setItem("session_closed_logout", "true");
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;