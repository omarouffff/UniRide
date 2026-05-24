/**
 * Public environment validation for Vercel / browser runtime.
 * All NEXT_PUBLIC_* vars are inlined at build time.
 */

import { getSupabasePublicConfig, isSupabaseConfigured } from '@/lib/supabaseEnv';

export type PublicEnv = {
  apiUrl: string;
  socketUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isProduction: boolean;
};

export class EnvConfigError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Set them in Vercel → Project → Settings → Environment Variables, then redeploy.'
    );
    this.name = 'EnvConfigError';
    this.missing = missing;
  }
}

function normalizeApiUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

/** Returns API base URL or throws in production when unset. */
export function getRequiredApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

  if (raw?.trim()) {
    return normalizeApiUrl(raw);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new EnvConfigError(['NEXT_PUBLIC_API_URL']);
  }

  return 'http://localhost:4000/api';
}

/** Returns socket origin (no /api suffix) or throws in production when unset. */
export function getRequiredSocketUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    const apiRaw = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiRaw?.trim()) {
      return normalizeApiUrl(apiRaw).replace(/\/api\/?$/, '');
    }
    throw new EnvConfigError(['NEXT_PUBLIC_SOCKET_URL', 'NEXT_PUBLIC_API_URL']);
  }

  return 'http://localhost:4000';
}

export function getPublicEnv(): PublicEnv {
  const isProduction = process.env.NODE_ENV === 'production';

  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabasePublicConfig();

  if (isProduction) {
    const missing: string[] = [];
    if (!process.env.NEXT_PUBLIC_API_URL?.trim() && !process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) {
      missing.push('NEXT_PUBLIC_API_URL');
    }
    if (!isSupabaseConfigured()) {
      if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL)');
      if (!supabaseAnonKey) {
        missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)');
      }
    }
    if (missing.length > 0) {
      throw new EnvConfigError(missing);
    }
  }

  return {
    apiUrl: getRequiredApiUrl(),
    socketUrl: getRequiredSocketUrl(),
    supabaseUrl,
    supabaseAnonKey,
    isProduction,
  };
}

export function validatePublicEnvAtBuildTime(): void {
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    getPublicEnv();
  }
}
