import { UserProfile } from '@/types/user';

export type AppRoute = '/admin' | '/driver' | '/pending-approval' | '/dashboard';

export function getPostLoginPath(user: UserProfile): AppRoute {
  if (user.role === 'admin') return '/admin';
  if (user.role === 'driver') return '/driver';
  if (user.status === 'pending') return '/pending-approval';
  return '/dashboard';
}

export function clearAuthTokens() {
  // Supabase session is cleared via signOutSupabase
}

export function extractApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const axiosError = error as {
    response?: { data?: { message?: string } };
    message?: string;
    code?: string;
  };

  const apiMessage = axiosError.response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage;
  }

  if (axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ECONNABORTED') {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    return `Unable to reach the server${apiUrl ? ` at ${apiUrl}` : ''}. Check your connection and API configuration.`;
  }

  return axiosError.message || fallback;
}
