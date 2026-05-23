import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from '@/lib/supabaseEnv';

const { url: supabaseUrl, key: supabaseKey } = getSupabasePublicConfig();

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
