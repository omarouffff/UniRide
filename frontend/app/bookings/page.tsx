'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BookingCard {
  _id: string;
  route: string;
  travelDate: string;
  seat?: string;
  status: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    async function fetchBookings() {
      try {
        const response = await api.get('/bookings');
        setBookings(response.data.bookings || []);
      } catch (error) {
        console.error('Failed to fetch bookings', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [router, user]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Bookings</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">My current rides</h1>
          </div>
          <Button onClick={() => router.push('/bookings/new')}>Book new ride</Button>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <Card>
              <p className="text-slate-400">Loading your bookings…</p>
            </Card>
          ) : bookings.length === 0 ? (
            <Card>
              <div className="space-y-3 text-slate-300">
                <p className="text-lg font-semibold text-white">No active bookings yet.</p>
                <p className="text-sm text-slate-400">Create a new booking to get a seat on the next shuttle.</p>
                <Button onClick={() => router.push('/bookings/new')}>Book your first ride</Button>
              </div>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking._id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">{new Date(booking.travelDate).toLocaleDateString()}</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{booking.route}</h2>
                    <p className="mt-2 text-slate-400">Seat {booking.seat || 'Pending'} • {booking._id}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100">
                    {booking.status}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/qr" className="inline-flex items-center rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:border-indigo-300 hover:text-indigo-200">
                    View boarding QR
                  </Link>
                  <Link href="/profile" className="inline-flex items-center rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
                    View profile
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
