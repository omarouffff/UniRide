'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthBootstrap';
import { getPostLoginPath } from '@/lib/auth';

export function useAuth() {
  const context = useAuthContext();
  if (!context) {
    throw new Error('useAuth must be used within AuthBootstrap');
  }
  return context;
}

export function useRequireAuth(options?: { allowedRoles?: Array<'student' | 'driver' | 'admin'> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (options?.allowedRoles && !options.allowedRoles.includes(user.role)) {
      router.replace(getPostLoginPath(user));
      return;
    }

    if (user.status === 'pending' && pathname !== '/pending-approval') {
      router.replace('/pending-approval');
    }
  }, [loading, user, router, pathname, options?.allowedRoles]);
}

export function useRedirectAuthenticated() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    router.replace(getPostLoginPath(user));
  }, [loading, user, router]);
}
