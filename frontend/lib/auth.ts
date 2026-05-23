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

import { formatApiError } from '@/lib/apiErrors';

export function extractApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  return formatApiError(error, fallback);
}
