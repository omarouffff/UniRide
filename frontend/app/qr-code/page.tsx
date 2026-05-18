'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function QRCodePage() {
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
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <div className="space-y-4 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Boarding QR code</p>
            <h1 className="text-3xl font-semibold text-white">Present this QR at boarding</h1>
            <p className="text-slate-400">
              Scan this code with the driver app to confirm your seat and complete boarding in real time.
            </p>
            <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-3xl bg-slate-800 text-slate-400">
              <div className="text-center">
                <p className="mb-3 text-sm uppercase tracking-[0.3em] text-indigo-300">QR PASS</p>
                <div className="mx-auto h-40 w-40 rounded-3xl bg-slate-900 p-6 shadow-inner shadow-slate-950/40" />
                <p className="mt-4 text-sm text-slate-500">Simulated boarding QR code for demo purposes.</p>
              </div>
            </div>
            <Button onClick={() => router.push('/bookings')}>Back to bookings</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
