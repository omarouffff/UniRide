'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

interface Booking {
  _id: string;
  id?: string;
  route: string;
  travelDate: string;
  status: 'confirmed' | 'waiting' | 'cancelled';
  seat?: string;
  waitingPosition?: number;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [router, user]);

  useEffect(() => {
    api.get('/bookings')
      .then((response) => setBookings(response.data.bookings || []))
      .finally(() => setLoading(false));
  }, []);

  async function cancelBooking(id: string) {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setBookings((current) => current.map((item) => ((item._id || item.id) === id ? { ...item, status: 'cancelled' } : item)));
      toast({ variant: 'success', title: 'Booking cancelled', description: 'Your seat has been released.' });
    } catch (error: any) {
      toast({ variant: 'error', title: 'Cannot cancel', description: error?.response?.data?.message || 'Cancellation deadline may have passed.' });
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <p className="text-sm font-medium text-cyan-200">Ride history</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">My Bookings</h1>
        </header>
        {loading ? <div className="h-32 animate-pulse rounded-lg bg-white/10" /> : bookings.map((booking) => {
          const id = booking._id || booking.id!;
          return (
            <Card key={id} className="rounded-lg">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-white">{booking.route}</h2>
                  <p className="mt-1 text-sm text-slate-400">{new Date(booking.travelDate).toLocaleString()}</p>
                  <p className="mt-2 text-sm capitalize text-cyan-100">{booking.status} {booking.seat ? `- ${booking.seat}` : booking.waitingPosition ? `#${booking.waitingPosition}` : ''}</p>
                </div>
                {booking.status !== 'cancelled' && <Button variant="outline" onClick={() => cancelBooking(id)}>Cancel</Button>}
              </div>
            </Card>
          );
        })}
        {!loading && bookings.length === 0 && <Card className="rounded-lg text-slate-400">You have no bookings yet.</Card>}
      </div>
    </main>
  );
}
