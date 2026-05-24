import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getSupabasePublicConfig, SupabaseConfigError } from '@/lib/supabaseEnv';

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  const { url, key } = getSupabasePublicConfig();
  if (!url || !key) {
    throw new SupabaseConfigError([
      'NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL)',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)',
    ]);
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component without mutable cookies — safe to ignore when middleware refreshes sessions.
        }
      },
    },
  });
};
