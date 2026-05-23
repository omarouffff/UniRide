'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { refreshCsrfToken } from '@/lib/api';
import { logApiConfig } from '@/lib/apiConfig';
import { useAuthStore } from '@/store/useAuthStore';
import { getBrowserSupabase } from '@/lib/supabaseClient';
import {
  mapSupabaseUserToProfile,
  signInWithEmail,
  signOutSupabase,
  signUpWithEmail,
  getBrowserSupabaseSession,
} from '@/lib/supabaseAuth';
import type { UserProfile } from '@/types/user';

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  sessionActive: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (payload: {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    college: string;
    academicYear: string;
    universityId: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthBootstrap');
  }
  return context;
}

async function hydrateProfile() {
  try {
    const response = await api.get('/auth/me');
    return response.data.user as UserProfile;
  } catch {
    const session = await getBrowserSupabaseSession();
    return mapSupabaseUserToProfile(session.data?.session?.user ?? null);
  }
}

export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const bootstrap = async () => {
      logApiConfig('bootstrap');
      setLoading(true);
      try {
        await refreshCsrfToken();
        const session = await getBrowserSupabaseSession();
        if (session.data?.session) {
          const profile = await hydrateProfile();
          if (active) {
            setUser(profile);
            setSessionActive(true);
            await api.post('/auth/sync').catch(() => undefined);
          }
        } else if (active) {
          setUser(null);
          setSessionActive(false);
        }
      } catch {
        if (active) {
          setUser(null);
          setSessionActive(false);
        }
      } finally {
        if (active) {
          setLoading(false);
          setHydrated(true);
        }
      }
    };

    const subscribeAuthState = () => {
      const supabase = getBrowserSupabase();
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!active) return;
        if (session?.user) {
          const profile = await hydrateProfile();
          setUser(profile);
          setSessionActive(true);
          await api.post('/auth/sync').catch(() => undefined);
        } else {
          setUser(null);
          setSessionActive(false);
        }
      });
      subscription = data.subscription;
    };

    bootstrap();
    subscribeAuthState();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [setHydrated, setLoading, setUser]);

  const signIn = async (email: string, password: string) => {
    const supabaseResult = await signInWithEmail(email, password);
    if (supabaseResult.error) throw supabaseResult.error;
    await refreshCsrfToken();
    const profile = await hydrateProfile();
    setUser(profile);
    setSessionActive(true);
    await api.post('/auth/sync').catch(() => undefined);
    return profile;
  };

  const signUp = async (payload: {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    college: string;
    academicYear: string;
    universityId: string;
  }) => {
    const supabaseResult = await signUpWithEmail(payload);
    if (supabaseResult.error) throw supabaseResult.error;
    setUser(null);
    setSessionActive(Boolean(supabaseResult.data?.session));
  };

  const signOut = async () => {
    await signOutSupabase().catch(() => undefined);
    setUser(null);
    setSessionActive(false);
  };

  const value = useMemo(
    () => ({ user, loading, sessionActive, signIn, signUp, signOut }),
    [user, loading, sessionActive]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
