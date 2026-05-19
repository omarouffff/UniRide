'use client';

import { create } from 'zustand';
import { clearAuthTokens } from '@/lib/auth';
import { UserProfile } from '@/types/user';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  hydrated: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  hydrated: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setHydrated: (hydrated) => set({ hydrated }),
  clearAuth: () => {
    clearAuthTokens();
    set({ user: null });
  },
}));
