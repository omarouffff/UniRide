import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { getSupabasePublicConfig } from '@/lib/supabaseEnv';

export const createClient = (request: NextRequest) => {
  const { url, key } = getSupabasePublicConfig();

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!url || !key) {
    return { supabase: null, response: supabaseResponse };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  return { supabase, response: supabaseResponse };
};
