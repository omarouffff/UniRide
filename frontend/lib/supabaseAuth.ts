import type { Session, User } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { UserProfile } from '@/types/user';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

const createSupabaseBrowser = () =>
  createBrowserClient(supabaseUrl!, supabaseKey!);

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
  const supabase = createSupabaseBrowser();
  return supabase.auth.getSession();
};

export const getServerSupabaseSession = async (cookieStore: Parameters<typeof createServerClient>[2]['cookies']) => {
  const supabase = createServerClient(supabaseUrl!, supabaseKey!, { cookies: cookieStore });
  return supabase.auth.getSession();
};
