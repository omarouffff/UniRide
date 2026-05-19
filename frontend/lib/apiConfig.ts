/**
 * Resolves the backend API base URL for axios.
 * In production, NEXT_PUBLIC_API_URL (or NEXT_PUBLIC_API_BASE_URL) must be set in Vercel.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

  if (raw && raw.trim()) {
    const trimmed = raw.trim();
    return trimmed.endsWith('/api') ? trimmed : `${trimmed.replace(/\/$/, '')}/api`;
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[UniRide] Missing NEXT_PUBLIC_API_URL. Set it in Vercel to your backend URL, e.g. https://your-app.onrender.com/api'
    );
    return '';
  }

  return 'http://localhost:4000/api';
}

export function getSocketUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const apiBase = getApiBaseUrl();
  if (apiBase) return apiBase.replace(/\/api\/?$/, '');

  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000';
}

export function logApiConfig(context = 'api') {
  if (typeof window === 'undefined') return;
  const base = getApiBaseUrl();
  console.info(`[UniRide:${context}] API base URL:`, base || '(not configured)');
  console.info(`[UniRide:${context}] Socket URL:`, getSocketUrl() || '(not configured)');
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}
