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

  if (axiosError.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. Check your API URL and network connection.';
  }

  if (axiosError.message && !axiosError.response) {
    return axiosError.message;
  }

  return fallback;
}
