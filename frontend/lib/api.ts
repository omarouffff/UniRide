import axios from 'axios';
import { getAccessToken, getRefreshToken, saveAuthTokens } from '@/lib/auth';
import { getApiBaseUrl, logApiConfig } from '@/lib/apiConfig';
import { useAuthStore } from '@/store/useAuthStore';

const AUTH_ROUTES_SKIP_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/password-reset/request',
  '/auth/password-reset/confirm',
  '/auth/verify-email',
];

function shouldSkipAuthRefresh(url?: string) {
  if (!url) return false;
  return AUTH_ROUTES_SKIP_REFRESH.some((route) => url.includes(route));
}

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
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[UniRide] Failed to fetch CSRF token', error);
    }
    return null;
  }
}

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  const accessToken = getAccessToken();
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

const shouldRetryRequest = (error: any) => {
  if (!error || !error.config) return false;
  const retryableCodes = ['ECONNABORTED', 'ERR_NETWORK', 'ECONNRESET', 'ETIMEDOUT'];
  const status = error.response?.status;
  return (
    retryableCodes.includes(error.code) ||
    (!error.response && error.request) ||
    (status >= 500 && status < 600)
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

    if (process.env.NODE_ENV === 'development' && error.code === 'ERR_NETWORK') {
      console.error('[UniRide] Network error', {
        baseURL: api.defaults.baseURL,
        url: originalRequest?.url,
        message: error.message,
      });
    }

    if (shouldRetryRequest(error) && originalRequest && originalRequest._retryCount < 2) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, 1000 * originalRequest._retryCount));
      return api(originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipAuthRefresh(originalRequest.url)) {
      if (originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve: resolve as () => void, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = getRefreshToken();
        const refreshResponse = await api.post(
          '/auth/refresh',
          storedRefreshToken ? { refreshToken: storedRefreshToken } : undefined
        );
        if (refreshResponse.data?.accessToken || refreshResponse.data?.refreshToken) {
          saveAuthTokens(refreshResponse.data.accessToken, refreshResponse.data.refreshToken);
        }
        processQueue(null);
        isRefreshing = false;
        return api(originalRequest);
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
