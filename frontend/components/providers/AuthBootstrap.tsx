'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { refreshCsrfToken } from '@/lib/api';
import { logApiConfig } from '@/lib/apiConfig';
import { useAuthStore } from '@/store/useAuthStore';
import { createBrowserClient } from '@supabase/ssr';
import { mapSupabaseUserToProfile, signInWithEmail, signOutSupabase, signUpWithEmail, getBrowserSupabaseSession } from '@/lib/supabaseAuth';
import { saveAuthTokens } from '@/lib/auth';
import type { UserProfile } from '@/types/user';

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  sessionActive: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
        const result = await getBrowserSupabaseSession();
        const supabaseSession = result.data?.session;
        const supabaseUser = mapSupabaseUserToProfile(supabaseSession?.user ?? null);

        await refreshCsrfToken();

        try {
          const response = await api.get('/auth/me');
          if (active) {
            setUser(response.data.user);
            setSessionActive(Boolean(supabaseSession));
          }
        } catch {
          if (active) {
            setUser(supabaseUser);
            setSessionActive(Boolean(supabaseSession));
          }
        }
      } catch (error) {
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

    const subscribeAuthState = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      const { data } = await supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        const profile = mapSupabaseUserToProfile(session?.user ?? null);
        if (session?.user) {
          setUser(profile);
          setSessionActive(true);
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
    if (supabaseResult.error) {
      throw supabaseResult.error;
    }

    await refreshCsrfToken();
    const response = await api.post('/auth/login', { email, password });
    saveAuthTokens(response.data.accessToken, response.data.refreshToken);
    setUser(response.data.user);
    setSessionActive(true);
    return response.data.user;
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
    const response = await api.post('/auth/register', payload);
    const supabaseResult = await signUpWithEmail(payload);
    if (supabaseResult.error) {
      throw supabaseResult.error;
    }
    setUser(null);
    setSessionActive(Boolean(supabaseResult.data?.session));
    return response.data;
  };

  const signOut = async () => {
    await signOutSupabase().catch(() => undefined);
    await api.post('/auth/logout').catch(() => undefined);
    setUser(null);
    setSessionActive(false);
  };

  const value = useMemo(
    () => ({ user, loading, sessionActive, signIn, signUp, signOut }),
    [user, loading, sessionActive, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
