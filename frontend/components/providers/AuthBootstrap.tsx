'use client';

import { ReactNode, useEffect } from 'react';
import api, { apiBaseUrl, refreshCsrfToken } from '@/lib/api';
import { logApiConfig } from '@/lib/apiConfig';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      logApiConfig('bootstrap');
      if (!apiBaseUrl) {
        console.error('[UniRide] API URL is not configured. Set NEXT_PUBLIC_API_URL in Vercel environment variables.');
        setLoading(false);
        setHydrated(true);
        return;
      }

      await refreshCsrfToken();

      try {
        const versionResponse = await api.get('/version');
        const serverVersion = versionResponse.data.version;
        const clientVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
        if (serverVersion !== clientVersion && active) {
          window.location.reload();
          return;
        }
      } catch {
        // keep running, version check failed gracefully
      }

      try {
        const response = await api.get('/auth/me');
        if (active) setUser(response.data.user);
      } catch (error) {
        if (active) setUser(null);
      } finally {
        if (active) {
          setLoading(false);
          setHydrated(true);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [setHydrated, setLoading, setUser]);

  return children;
}
