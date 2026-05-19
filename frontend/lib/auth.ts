import { UserProfile } from '@/types/user';

const ACCESS_TOKEN_KEY = 'uniride_access_token';
const REFRESH_TOKEN_KEY = 'uniride_refresh_token';

export function saveAuthTokens(accessToken?: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  if (accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getPostLoginPath(user: UserProfile): string {
  if (user.role === 'admin') return '/admin';
  if (user.role === 'driver') return '/driver';
  if (user.status === 'pending') return '/pending-approval';
  return '/dashboard';
}

export function extractApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const axiosError = error as {
    response?: { data?: { message?: string; status?: string }; status?: number };
    message?: string;
    code?: string;
  };

  const apiMessage = axiosError.response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage;
  }

  if (axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ECONNABORTED') {
    const apiUrl =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '(not set — using localhost in dev only)'
        : '';
    return `Unable to reach the server at ${apiUrl || 'the configured API URL'}. Verify NEXT_PUBLIC_API_URL on Vercel and that the backend is online (/api/health).`;
  }

  if (axiosError.message && !axiosError.response) {
    return axiosError.message;
  }

  return fallback;
}
