import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from '@/lib/supabaseEnv';

export function getBrowserSupabase() {
  const { url, key } = getSupabasePublicConfig();
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
    );
  }
  return createBrowserClient(url, key);
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const supabase = getBrowserSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
