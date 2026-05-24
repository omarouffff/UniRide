import { tryGetBrowserSupabase } from '@/lib/supabaseClient';

/** @deprecated Prefer `getBrowserSupabase` from `@/lib/supabaseClient` */
export const createClient = () => {
  const client = tryGetBrowserSupabase();
  if (!client) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return client;
};
