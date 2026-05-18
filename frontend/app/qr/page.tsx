'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

export default function QRPage() {
  const user = useAuthStore((s) => s.user);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/bookings/dashboard');
        if (mounted) setQr(data.upcomingBooking?.qrCode ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <Card className="text-center space-y-6 p-8">
          <h1 className="text-2xl font-semibold">Your Boarding QR</h1>
          {loading ? (
            <div className="h-72" />
          ) : qr ? (
            <div className="mx-auto w-64">
              <div className="animate-pulse rounded-2xl p-4 bg-slate-900/60">
                <img src={qr} alt="Booking QR" className="w-full h-auto" />
              </div>
            </div>
          ) : (
            <p className="text-slate-400">No confirmed booking found with a QR code.</p>
          )}
        </Card>
      </div>
    </main>
  );
}
