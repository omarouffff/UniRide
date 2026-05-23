'use client';

import { ReactNode, useState } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import AuthBootstrap from '@/components/providers/AuthBootstrap';
import { ApiConfigGuard } from '@/components/config/ApiConfigGuard';
import LanguageProvider from '@/components/i18n/LanguageProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1 } } }));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LanguageProvider>
            <ApiConfigGuard>
              <AuthBootstrap>{children}</AuthBootstrap>
            </ApiConfigGuard>
          </LanguageProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
