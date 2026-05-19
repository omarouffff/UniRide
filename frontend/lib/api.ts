import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const base = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev';

const api = axios.create({
  baseURL: base,
  withCredentials: true,
  headers: {
    'x-client-version': appVersion,
  },
});

let csrfToken: string | null = null;

export async function refreshCsrfToken() {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
    api.defaults.headers.common['x-csrf-token'] = csrfToken;
    return csrfToken;
  } catch (error) {
    return null;
  }
}

api.interceptors.request.use((config) => {
  if (csrfToken) {
    config.headers = config.headers || {};
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        isRefreshing = false;
        return api(originalRequest);
      } catch (err) {
        processQueue(err);
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
