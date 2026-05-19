'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';

export default function PassengerListPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    api.get('/driver/bookings').then((response) => setBookings(response.data.bookings || [])).catch(() => undefined);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-3xl font-semibold text-white">Passenger List</h1>
        {bookings.map((booking) => (
          <Card key={booking.id} className="rounded-lg">
            <p className="font-semibold text-white">{booking.user?.name || 'Unknown passenger'}</p>
            <p className="text-sm text-slate-400">{booking.route} - Seat {booking.seat || 'TBD'}</p>
          </Card>
        ))}
        {bookings.length === 0 && <Card className="rounded-lg text-slate-400">No confirmed passengers right now.</Card>}
      </div>
    </main>
  );
}
