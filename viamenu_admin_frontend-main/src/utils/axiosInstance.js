// axiosInstance.js
import axios from 'axios';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Flag to prevent multiple concurrent refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Auth tokens live in httpOnly cookies set by the server — never in JS-readable
// storage. withCredentials makes the browser send/receive those cookies on every
// cross-origin request to the API.
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refreshing is in progress, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is sent automatically via cookie; server responds with
        // fresh Set-Cookie headers, no token handling needed on this side.
        await axios.post(`${BASE_URL}/admin/auth/refresh-token`, {}, { withCredentials: true });

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle logout
export const handleLogout = () => {
  localStorage.removeItem('isLoggedIn');

  // Best-effort: tell the server to clear cookies / invalidate the refresh token.
  // Fire-and-forget — UI navigation shouldn't wait on (or fail because of) this.
  axios
    .post(`${BASE_URL}/admin/auth/logout`, {}, { withCredentials: true })
    .catch(() => {});

  toast.error('Your session has expired. Please login again.');
  window.location.href = '/';
};

export default axiosInstance;