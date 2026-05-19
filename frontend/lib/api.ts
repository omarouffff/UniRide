import axios from 'axios';

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

export default api;
