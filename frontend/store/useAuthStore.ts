'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '@/types/user';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  setUser: (user: UserProfile, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      setUser: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'uni-transportation-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
