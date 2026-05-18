'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [router, user]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <div className="grid gap-6 md:grid-cols-[0.7fr_0.9fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Student profile</p>
              <h2 className="mt-4 text-2xl font-semibold text-white">{user.name}</h2>
              <p className="mt-2 text-slate-400">{user.email}</p>
              <div className="mt-6 space-y-3 text-slate-300">
                <p><span className="font-semibold text-white">University ID:</span> {user.universityId}</p>
                <p><span className="font-semibold text-white">Status:</span> {user.universityIdStatus}</p>
                <p><span className="font-semibold text-white">No-shows:</span> {user.noShowCount ?? 0}</p>
              </div>
              <div className="mt-6">
                <Button onClick={() => router.push('/bookings')}>
                  Back to bookings
                </Button>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">University ID proof</p>
              {user.universityIdImage ? (
                <img src={user.universityIdImage} alt="University ID" className="mt-4 w-full rounded-3xl border border-slate-700 object-cover" />
              ) : (
                <div className="mt-4 rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-10 text-center text-slate-500">
                  No university ID image uploaded yet.
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
