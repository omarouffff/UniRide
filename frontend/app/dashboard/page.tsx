'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Student dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Hello, {user.name}</h1>
            <p className="mt-2 text-slate-400">Your current verification status is {user.universityIdStatus}.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/bookings" className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400">
              My bookings
            </Link>
            <Button variant="outline" onClick={() => { clearAuth(); router.push('/auth/login'); }}>
              Sign out
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold text-white">Verification status</h2>
            <p className="mt-4 text-slate-300">Your ID is currently <span className="font-semibold text-indigo-200">{user.universityIdStatus}</span>.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/verify-university-id" className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700">
                Upload ID
              </Link>
              <Link href="/bookings" className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-transparent px-4 py-3 text-sm font-semibold text-white hover:border-indigo-300 hover:text-indigo-200">
                Go to bookings
              </Link>
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-white">Waiting list snapshot</h2>
            <p className="mt-4 text-slate-300">Based on your university ID verification, you will gain access to booking and waiting list updates.</p>
            <div className="mt-6 space-y-2 text-slate-400">
              <p>• No-show count: {user.noShowCount ?? 0}</p>
              <p>• Waiting position: {user.waitingListPosition ?? 'Not assigned'}</p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
