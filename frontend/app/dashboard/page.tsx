'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';

interface DashboardPayload {
  user: { id: string; name: string; email: string; role: string; status: 'pending' | 'approved' | 'rejected'; noShowCount: number };
  upcomingBooking: null | { id: string; route: string; travelDate: string; status: 'confirmed' | 'waiting' | 'cancelled'; seat?: string; waitingPosition?: number; qrCode?: string };
  availableSeats: number;
  confirmedCount: number;
  waitingCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (user.role === 'admin') router.replace('/admin');
    else if (user.role === 'driver') router.replace('/driver/dashboard');
  }, [router, user]);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    let active = true;
    api.get('/bookings/dashboard')
      .then((response) => active && setDashboard(response.data))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user]);

  const currentStatus = (dashboard?.user.status || user?.status || 'pending') as 'pending' | 'approved' | 'rejected';
  const statusMeta = useMemo(() => ({
    pending: { icon: Clock, title: 'Pending admin approval', text: 'Your documents are under review. Booking opens after approval.', color: 'text-amber-200' },
    approved: { icon: CheckCircle2, title: 'Approved', text: 'You can book trips and generate boarding QR codes.', color: 'text-emerald-200' },
    rejected: { icon: XCircle, title: 'Rejected', text: 'Access is blocked. Contact transportation administration for review.', color: 'text-rose-200' },
  }[currentStatus]), [currentStatus]);

  if (!user || user.role !== 'student') return null;
  const StatusIcon = statusMeta.icon;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-cyan-200">Student dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Welcome, {user.name}</h1>
          </div>
          <Button variant="outline" onClick={() => { clearAuth(); router.push('/login'); }}>Sign out</Button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <Card className="rounded-lg">
            <div className="flex items-start gap-4">
              <StatusIcon className={`mt-1 h-6 w-6 ${statusMeta.color}`} />
              <div>
                <h2 className="text-2xl font-semibold text-white">{statusMeta.title}</h2>
                <p className="mt-2 text-slate-400">{statusMeta.text}</p>
              </div>
            </div>
            {currentStatus === 'approved' && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/booking" className="inline-flex h-10 items-center rounded-md bg-indigo-500 px-4 text-sm font-semibold text-white transition hover:bg-indigo-400">Book Trip</Link>
                <Link href="/my-bookings" className="inline-flex h-10 items-center rounded-md border border-slate-700 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">My bookings</Link>
                <Link href="/qr" className="inline-flex h-10 items-center rounded-md border border-slate-700 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">QR code</Link>
              </div>
            )}
          </Card>

          <Card className="rounded-lg">
            <p className="text-sm text-slate-400">Live seats</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div><p className="text-2xl font-semibold text-white">{dashboard?.availableSeats ?? '-'}</p><p className="text-xs text-slate-400">Available</p></div>
              <div><p className="text-2xl font-semibold text-white">{dashboard?.confirmedCount ?? '-'}</p><p className="text-xs text-slate-400">Booked</p></div>
              <div><p className="text-2xl font-semibold text-white">{dashboard?.waitingCount ?? '-'}</p><p className="text-xs text-slate-400">Waiting</p></div>
            </div>
          </Card>
        </div>

        <Card className="rounded-lg">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-cyan-200" />
            <h2 className="text-xl font-semibold text-white">Upcoming trip</h2>
          </div>
          {loading ? (
            <div className="mt-5 h-20 animate-pulse rounded-lg bg-white/10" />
          ) : dashboard?.upcomingBooking ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <p className="text-slate-300">{dashboard.upcomingBooking.route}</p>
              <p className="text-slate-300">{new Date(dashboard.upcomingBooking.travelDate).toLocaleString()}</p>
              <p className="capitalize text-slate-300">{dashboard.upcomingBooking.status}</p>
              <p className="text-slate-300">{dashboard.upcomingBooking.seat || `Waiting #${dashboard.upcomingBooking.waitingPosition || '-'}`}</p>
            </div>
          ) : (
            <p className="mt-5 text-slate-400">No upcoming trips yet.</p>
          )}
        </Card>
      </div>
    </main>
  );
}
