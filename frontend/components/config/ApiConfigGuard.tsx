'use client';

import { ReactNode, useMemo } from 'react';
import { getConfigErrorMessage } from '@/lib/apiConfig';
import { getSupabaseConfigError } from '@/lib/supabaseEnv';

export function ApiConfigGuard({ children }: { children: ReactNode }) {
  const error = useMemo(() => {
    if (process.env.NODE_ENV !== 'production') return null;
    return getConfigErrorMessage() || getSupabaseConfigError();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
          <h1 className="text-xl font-semibold text-rose-200">Production configuration required</h1>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">{error}</p>
          <p className="mt-4 text-xs text-amber-200/90">
            This app uses <strong>Next.js</strong> (not Vite). Use <code className="text-cyan-300">NEXT_PUBLIC_*</code>{' '}
            variables, or <code className="text-cyan-300">VITE_*</code> aliases (mapped at build time).
          </p>
          <ul className="mt-6 text-left text-sm text-slate-400 space-y-2">
            <li>
              <code className="text-cyan-300">NEXT_PUBLIC_API_URL</code> — e.g.{' '}
              <code className="text-xs">https://your-backend.up.railway.app/api</code>
            </li>
            <li>
              <code className="text-cyan-300">NEXT_PUBLIC_SOCKET_URL</code> — e.g.{' '}
              <code className="text-xs">https://your-backend.up.railway.app</code>
            </li>
            <li>
              <code className="text-cyan-300">NEXT_PUBLIC_SUPABASE_URL</code> — e.g.{' '}
              <code className="text-xs">https://ssykhipljhshlvcotyjy.supabase.co</code>
            </li>
            <li>
              <code className="text-cyan-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — Supabase → Settings → API → anon
              public
            </li>
          </ul>
          <p className="mt-6 text-xs text-slate-500">
            Redeploy Vercel or Railway after saving variables. Railway-only VITE_* names are supported via next.config.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
