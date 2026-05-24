import type { Session, User } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { UserProfile } from '@/types/user';

import { getSupabasePublicConfig, SupabaseConfigError } from '@/lib/supabaseEnv';
import { tryGetBrowserSupabase } from '@/lib/supabaseClient';

type SupabaseUserMetadata = {
  role?: 'student' | 'admin' | 'driver';
  status?: 'pending' | 'approved' | 'rejected';
  name?: string;
  phoneNumber?: string;
  college?: string;
  academicYear?: string;
  universityId?: string;
  universityIdStatus?: 'pending' | 'approved' | 'verified' | 'rejected';
  profileImage?: string;
  idCardImage?: string;
  noShowCount?: number;
  waitingListPosition?: number;
};

function normalizeMetadata(metadata: unknown): SupabaseUserMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return { role: 'student', status: 'pending' };
  }

  const typed = metadata as SupabaseUserMetadata;
  return {
    role: typed.role ?? 'student',
    status: typed.status ?? 'pending',
    name: typed.name,
    phoneNumber: typed.phoneNumber,
    college: typed.college,
    academicYear: typed.academicYear,
    universityId: typed.universityId,
    universityIdStatus: typed.universityIdStatus ?? 'pending',
    profileImage: typed.profileImage,
    idCardImage: typed.idCardImage,
    noShowCount: typed.noShowCount ?? 0,
    waitingListPosition: typed.waitingListPosition ?? undefined,
  };
}

export function mapSupabaseUserToProfile(user: User | null): UserProfile | null {
  if (!user || !user.email) {
    return null;
  }

  const metadata = normalizeMetadata(user.user_metadata);

  return {
    id: user.id,
    name: metadata.name || user.email.split('@')[0],
    email: user.email,
    role: metadata.role ?? 'student',
    status: metadata.status ?? 'pending',
    phoneNumber: metadata.phoneNumber,
    college: metadata.college,
    academicYear: metadata.academicYear,
    profileImage: metadata.profileImage,
    universityId: metadata.universityId ?? '',
    universityIdStatus: metadata.universityIdStatus ?? 'pending',
    idCardImage: metadata.idCardImage,
    noShowCount: metadata.noShowCount ?? 0,
    waitingListPosition: metadata.waitingListPosition ?? null,
  };
}

function createSupabaseBrowser() {
  const client = tryGetBrowserSupabase();
  if (client) return client;

  const { url, key } = getSupabasePublicConfig();
  if (!url || !key) {
    throw new SupabaseConfigError([
      'NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL)',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)',
    ]);
  }
  return createBrowserClient(url, key);
}

export const signInWithEmail = async (email: string, password: string) => {
  const supabase = createSupabaseBrowser();
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = async (payload: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  college: string;
  academicYear: string;
  universityId: string;
}) => {
  const supabase = createSupabaseBrowser();
  return supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        role: 'student',
        status: 'pending',
        name: payload.name,
        phoneNumber: payload.phoneNumber,
        college: payload.college,
        academicYear: payload.academicYear,
        universityId: payload.universityId,
        universityIdStatus: 'pending',
      },
    },
  });
};

export const signOutSupabase = async () => {
  const supabase = createSupabaseBrowser();
  return supabase.auth.signOut();
};

export const getBrowserSupabaseSession = async () => {
  const supabase = tryGetBrowserSupabase();
  if (!supabase) {
    return { data: { session: null }, error: null };
  }
  return supabase.auth.getSession();
};

export function getAuthRedirectBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_FRONTEND_URL || '';
}

export const requestPasswordReset = async (email: string) => {
  const supabase = createSupabaseBrowser();
  const redirectTo = `${getAuthRedirectBaseUrl()}/auth/reset-password`;
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
};

export const updatePassword = async (password: string) => {
  const supabase = createSupabaseBrowser();
  return supabase.auth.updateUser({ password });
};

export const resendSignupVerification = async (email: string) => {
  const supabase = createSupabaseBrowser();
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${getAuthRedirectBaseUrl()}/auth/verify-email`,
    },
  });
};

export const verifyEmailOtp = async (tokenHash: string, type: 'signup' | 'email' | 'recovery' = 'signup') => {
  const supabase = createSupabaseBrowser();
  return supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
};

export const getServerSupabaseSession = async (cookieStore: Parameters<typeof createServerClient>[2]['cookies']) => {
  const { url, key } = getSupabasePublicConfig();
  if (!url || !key) {
    throw new SupabaseConfigError([
      'NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL)',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)',
    ]);
  }
  const supabase = createServerClient(url, key, { cookies: cookieStore });
  return supabase.auth.getSession();
};
