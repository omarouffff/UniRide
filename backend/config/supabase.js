const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let adminClient = null;
let anonClient = null;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

/** Public anon client for password sign-in / sign-up (server-side auth API). */
function getSupabaseAnon() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!anonClient) {
    anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return anonClient;
}

module.exports = { getSupabaseAdmin, getSupabaseAnon, supabaseUrl };
