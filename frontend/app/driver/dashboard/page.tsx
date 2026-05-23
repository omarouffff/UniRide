'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DriverBooking {
  id: string;
  route: string;
  pickupPoint: string;
  destination: string;
  travelDate: string;
  seat: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    universityId: string;
  } | null;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'driver') {
      router.replace('/dashboard');
    }
  }, [router, user]);

  useEffect(() => {
    if (!user || user.role !== 'driver') return;

    async function loadBookings() {
      try {
        setLoading(true);
        const response = await api.get('/driver/bookings');
        setBookings(response.data.bookings || []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Could not load driver bookings');
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [user]);

  if (!user || user.role !== 'driver') {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Driver dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Hello, {user.name}</h1>
            <p className="mt-2 text-slate-400">View active assigned rides and confirmed passenger details.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => { clearAuth(); router.push('/login'); }}>
              Sign out
            </Button>
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Confirmed ride roster</h2>
              <p className="mt-2 text-slate-400">All confirmed bookings are shown in travel date order.</p>
            </div>
            <div className="rounded-3xl bg-slate-800 px-4 py-2 text-sm text-slate-300">{bookings.length} confirmed rides</div>
          </div>
        </Card>

        {loading ? (
          <Card>
            <p className="text-slate-400">Loading confirmed rides…</p>
          </Card>
        ) : error ? (
          <Card className="border border-rose-500">
            <p className="text-rose-300">{error}</p>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <p className="text-slate-400">No confirmed rides are available right now.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Route</p>
                    <h3 className="text-xl font-semibold text-white">{booking.route}</h3>
                    <p className="text-sm text-slate-400">{booking.pickupPoint} → {booking.destination}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-slate-400">Travel date</p>
                    <p className="text-lg font-semibold text-white">{new Date(booking.travelDate).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-400">Seat {booking.seat ?? 'TBD'}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                    <p className="text-sm text-slate-400">Passenger</p>
                    <p className="mt-2 text-white">{booking.user?.name || 'Unknown'}</p>
                    <p className="text-sm text-slate-400">{booking.user?.email || 'No email provided'}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                    <p className="text-sm text-slate-400">University ID</p>
                    <p className="mt-2 text-white">{booking.user?.universityId || 'Not available'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
