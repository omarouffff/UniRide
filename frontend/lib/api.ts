import axios from 'axios';
import { getApiBaseUrl, logApiConfig } from '@/lib/apiConfig';
import { getSupabaseAccessToken } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/useAuthStore';

const base = getApiBaseUrl();
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev';

if (typeof window !== 'undefined') {
  logApiConfig('init');
}

const api = axios.create({
  baseURL: base,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'x-client-version': appVersion,
    'Content-Type': 'application/json',
  },
});

let csrfToken: string | null = null;

export async function refreshCsrfToken() {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
    api.defaults.headers.common['x-csrf-token'] = csrfToken;
    return csrfToken;
  } catch {
    return null;
  }
}

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};
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

const shouldRetryRequest = (error: { code?: string; response?: { status?: number }; request?: unknown }) => {
  const retryableCodes = ['ECONNABORTED', 'ERR_NETWORK', 'ECONNRESET', 'ETIMEDOUT'];
  const status = error.response?.status;
  return (
    retryableCodes.includes(error.code || '') ||
    (!error.response && error.request) ||
    (status !== undefined && status >= 500 && status < 600)
  );
};

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (shouldRetryRequest(error) && originalRequest && (originalRequest._retryCount || 0) < 2) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, 1000 * originalRequest._retryCount));
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

export { base as apiBaseUrl };
export default api;
