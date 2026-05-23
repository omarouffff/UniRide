import { AxiosError } from 'axios';
import { getApiBaseUrl } from '@/lib/apiConfig';

export function formatApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AxiosError) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      try {
        return `Cannot reach the API at ${getApiBaseUrl()}. Check NEXT_PUBLIC_API_URL and that the Render backend is running.`;
      } catch {
        return 'API URL is not configured. Set NEXT_PUBLIC_API_URL in Vercel.';
      }
    }
    const message = error.response.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (error.response.status === 404) {
      return `API route not found (${error.config?.url}). Verify NEXT_PUBLIC_API_URL points to your Render service.`;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
