import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getSupabaseConfigMissing,
  getSupabasePublicConfig,
  isSupabaseConfigured,
  logSupabaseConfig,
  SupabaseConfigError,
} from '@/lib/supabaseEnv';

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton browser Supabase client, or throws SupabaseConfigError if env is missing.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    logSupabaseConfig('getBrowserSupabase');
    throw new SupabaseConfigError(getSupabaseConfigMissing());
  }

  if (!browserClient) {
    const { url, key } = getSupabasePublicConfig();
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
}

/** Safe accessor — returns null instead of throwing (use in bootstrap / optional flows). */
export function tryGetBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    logSupabaseConfig('tryGetBrowserSupabase');
    return null;
  }

  if (!browserClient) {
    const { url, key } = getSupabasePublicConfig();
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const supabase = tryGetBrowserSupabase();
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch (error) {
    console.warn('[UniRide] Failed to read Supabase session', error);
    return null;
  }
}
