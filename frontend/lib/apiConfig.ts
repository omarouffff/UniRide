import { EnvConfigError, getPublicEnv, getRequiredApiUrl, getRequiredSocketUrl } from '@/lib/env';

export { EnvConfigError };

let cachedEnv: ReturnType<typeof getPublicEnv> | null = null;

function getEnv() {
  if (!cachedEnv) {
    cachedEnv = getPublicEnv();
  }
  return cachedEnv;
}

/** Backend REST API base URL (always ends with /api). */
export function getApiBaseUrl(): string {
  try {
    return getRequiredApiUrl();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:4000/api';
    }
    throw error;
  }
}

/** Socket.io server origin (no /api path). */
export function getSocketUrl(): string {
  try {
    return getRequiredSocketUrl();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:4000';
    }
    throw error;
  }
}

export function logApiConfig(context = 'api') {
  if (typeof window === 'undefined') return;
  try {
    const env = getEnv();
    console.info(`[UniRide:${context}] API:`, env.apiUrl);
    console.info(`[UniRide:${context}] Socket:`, env.socketUrl);
  } catch (error) {
    if (error instanceof EnvConfigError) {
      console.error(`[UniRide:${context}] ${error.message}`);
    }
  }
}

export function isApiConfigured(): boolean {
  try {
    getApiBaseUrl();
    return true;
  } catch {
    return false;
  }
}

export function getConfigErrorMessage(): string | null {
  try {
    getPublicEnv();
    return null;
  } catch (error) {
    return error instanceof EnvConfigError ? error.message : 'Configuration error';
  }
}
