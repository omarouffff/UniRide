'use client';

import type { ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';

type ProtectedPageProps = {
  children: ReactNode;
  allowedRoles?: Array<'student' | 'driver' | 'admin'>;
};

export function ProtectedPage({ children, allowedRoles }: ProtectedPageProps) {
  useRequireAuth({ allowedRoles });
  return <>{children}</>;
}
