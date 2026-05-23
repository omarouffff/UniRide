import axios, { AxiosError } from 'axios';
import { getApiBaseUrl, logApiConfig } from '@/lib/apiConfig';
import { getSupabaseAccessToken } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/useAuthStore';

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev';

if (typeof window !== 'undefined') {
  logApiConfig('init');
}

const api = axios.create({
  withCredentials: true,
  timeout: 30000,
  headers: {
    'x-client-version': appVersion,
    'Content-Type': 'application/json',
  },
});

let csrfToken: string | null = null;
let csrfInitPromise: Promise<string | null> | null = null;

export async function refreshCsrfToken() {
  if (csrfInitPromise) return csrfInitPromise;

  csrfInitPromise = (async () => {
    try {
      const response = await api.get('/csrf-token');
      csrfToken = response.data.csrfToken;
      api.defaults.headers.common['x-csrf-token'] = csrfToken;
      return csrfToken;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[UniRide] Failed to fetch CSRF token', error);
      }
      return null;
    } finally {
      csrfInitPromise = null;
    }
  })();

  return csrfInitPromise;
}

api.interceptors.request.use(async (config) => {
  config.baseURL = config.baseURL || getApiBaseUrl();
  config.headers = config.headers || {};

  if (!csrfToken && config.method !== 'get') {
    await refreshCsrfToken();
  }
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken;
  }

  const accessToken = await getSupabaseAccessToken();
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

const shouldRetryRequest = (error: AxiosError) => {
  if (!error.config) return false;
  const retryableCodes = ['ECONNABORTED', 'ERR_NETWORK', 'ECONNRESET', 'ETIMEDOUT'];
  const status = error.response?.status;
  return (
    retryableCodes.includes(error.code || '') ||
    (!error.response && Boolean(error.request)) ||
    (status !== undefined && status >= 500 && status < 600)
  );
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean; _retryCount?: number };

    if (originalRequest?.url?.includes('/csrf-token') && error.response?.status === 404) {
      const misconfigured = new Error(
        `API not reachable at ${getApiBaseUrl()}. Set NEXT_PUBLIC_API_URL to your Render backend (e.g. https://your-app.onrender.com/api).`
      );
      return Promise.reject(misconfigured);
    }

    if (shouldRetryRequest(error) && originalRequest && (originalRequest._retryCount || 0) < 2) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, 1000 * originalRequest._retryCount!));
      return api(originalRequest);
    }

    if (error.response?.status === 403 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      await refreshCsrfToken();
      return api(originalRequest);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve: resolve as () => void, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = await getSupabaseAccessToken();
        if (token) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          processQueue(null);
          isRefreshing = false;
          return api(originalRequest);
        }
        throw error;
      } catch (err) {
        processQueue(err);
        isRefreshing = false;
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export { formatApiError } from '@/lib/apiErrors';

export const apiBaseUrl = () => getApiBaseUrl();
export default api;
