/**
 * Supabase public configuration for Next.js (process.env).
 *
 * Next.js only exposes NEXT_PUBLIC_* to the browser by default.
 * VITE_* aliases are mapped in next.config.mjs for Railway/misnamed deploy vars.
 */

export type SupabasePublicConfig = {
  url: string;
  key: string;
};

export class SupabaseConfigError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Supabase not configured. Set ${missing.join(' and ')}. ` +
        'This project uses Next.js — prefer NEXT_PUBLIC_* names on Vercel/Railway.'
    );
    this.name = 'SupabaseConfigError';
    this.missing = missing;
  }
}

function readFirstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

/** Single source of truth for Supabase URL + anon key. */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = readFirstEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'SUPABASE_URL'
  );

  const key = readFirstEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY'
  );

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabasePublicConfig();
  return Boolean(url && key);
}

export function getSupabaseConfigMissing(): string[] {
  const { url, key } = getSupabasePublicConfig();
  const missing: string[] = [];
  if (!url) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL)');
  }
  if (!key) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)');
  }
  return missing;
}

export function getSupabaseConfigError(): string | null {
  const missing = getSupabaseConfigMissing();
  if (missing.length === 0) return null;
  return new SupabaseConfigError(missing).message;
}

export function logSupabaseConfig(context = 'supabase'): void {
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') return;

  const { url, key } = getSupabasePublicConfig();
  if (!url || !key) {
    console.error(`[UniRide:${context}]`, getSupabaseConfigError());
    return;
  }

  console.info(`[UniRide:${context}] Supabase URL:`, url);
  console.info(`[UniRide:${context}] Supabase anon key:`, `${key.slice(0, 8)}…`);
}
