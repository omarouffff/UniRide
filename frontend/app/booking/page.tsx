'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bus, Clock3, Users } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

interface Trip {
  id: string;
  _id: string;
  title: string;
  route: string;
  busNumber: string;
  capacity: number;
  availableSeats: number;
  waitingCount: number;
  departureTime: string;
}

export default function BookingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (user.status !== 'approved') router.replace('/dashboard');
  }, [router, user]);

  useEffect(() => {
    let active = true;
    api.get('/bookings/trips')
      .then((response) => active && setTrips(response.data.trips || []))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function bookTrip(trip: Trip) {
    setBookingId(trip.id || trip._id);
    try {
      const response = await api.post('/bookings', { tripId: trip.id || trip._id });
      toast({
        variant: 'success',
        title: response.data.booking.status === 'confirmed' ? 'Booking confirmed' : 'Added to waiting list',
        description: response.data.booking.status === 'confirmed' ? 'Your seat is reserved.' : 'You will move up when a seat opens.',
      });
      setTrips((current) => current.map((item) => {
        const same = (item.id || item._id) === (trip.id || trip._id);
        if (!same) return item;
        return response.data.booking.status === 'confirmed'
          ? { ...item, availableSeats: Math.max(0, item.availableSeats - 1) }
          : { ...item, waitingCount: item.waitingCount + 1 };
      }));
    } catch (error: any) {
      toast({ variant: 'error', title: 'Booking failed', description: error?.response?.data?.message || 'Try again later.' });
    } finally {
      setBookingId(null);
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <p className="text-sm font-medium text-cyan-200">Available trips</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Book Trip</h1>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-lg bg-white/10" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip) => (
              <Card key={trip.id || trip._id} className="rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{trip.title}</h2>
                    <p className="mt-1 text-slate-400">{trip.route}</p>
                  </div>
                  <Bus className="h-5 w-5 text-cyan-200" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div><Clock3 className="mb-2 h-4 w-4 text-slate-400" />{new Date(trip.departureTime).toLocaleString()}</div>
                  <div><Users className="mb-2 h-4 w-4 text-slate-400" />{trip.availableSeats}/{trip.capacity} seats</div>
                  <div>Waiting<br />{trip.waitingCount}</div>
                </div>
                <Button className="mt-5 w-full" onClick={() => bookTrip(trip)} disabled={bookingId === (trip.id || trip._id)}>
                  {bookingId === (trip.id || trip._id) ? 'Booking...' : trip.availableSeats > 0 ? 'Confirm booking' : 'Join waiting list'}
                </Button>
              </Card>
            ))}
            {trips.length === 0 && <Card className="rounded-lg text-slate-400">No active trips are scheduled yet.</Card>}
          </div>
        )}
      </div>
    </main>
  );
}
