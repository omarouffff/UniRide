'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DashboardBooking {
  id: string;
  pickupPoint: string;
  destination: string;
  route: string;
  travelDate: string;
  status: 'confirmed' | 'waiting' | 'cancelled';
  seat: string | null;
  waitingPosition: number | null;
  qrCode?: string | null;
}

interface DashboardPayload {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    universityIdStatus: 'pending' | 'verified' | 'rejected';
    noShowCount: number;
    waitingListPosition: number | null;
  };
  upcomingBooking: DashboardBooking | null;
  totalSeats: number;
  availableSeats: number;
  confirmedCount: number;
  waitingCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (user.role === 'admin') {
      router.replace('/admin/dashboard');
      return;
    }

    if (user.role === 'driver') {
      router.replace('/driver/dashboard');
      return;
    }
  }, [router, user]);

  if (!user || user.role !== 'student') {
    return null;
  }

  useEffect(() => {
    if (!token || !user) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
    const url = `${baseUrl}/api/bookings/dashboard`;
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load dashboard');
        }

        const payload: DashboardPayload = await response.json();
        setDashboard(payload);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unable to fetch dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
    const socketClient = io(baseUrl || window.location.origin, {
      transports: ['websocket'],
    });

    socketClient.on('connect', () => {
      socketClient.emit('subscribe', { userId: user.id });
      setSocket(socketClient);
    });

    socketClient.on('bookingUpdate', (payload: DashboardBooking) => {
      setDashboard((current) =>
        current
          ? {
              ...current,
              upcomingBooking: payload,
            }
          : current
      );
    });

    socketClient.on('routeUpdate', (payload: { availableSeats: number; confirmedCount: number; waitingCount: number }) => {
      setDashboard((current) =>
        current
          ? {
              ...current,
              availableSeats: payload.availableSeats,
              confirmedCount: payload.confirmedCount,
              waitingCount: payload.waitingCount,
            }
          : current
      );
    });

    socketClient.on('connect_error', (socketError) => {
      console.error('Socket connection failed:', socketError);
    });

    return () => {
      socketClient.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    if (!socket || !dashboard?.upcomingBooking?.route) return;
    socket.emit('subscribeRoute', {
      route: dashboard.upcomingBooking.route,
      date: dashboard.upcomingBooking.travelDate,
    });
  }, [socket, dashboard]);

  const bookingCard = useMemo(() => {
    if (!dashboard?.upcomingBooking) return null;
    const booking = dashboard.upcomingBooking;
    const dateLabel = new Date(booking.travelDate).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const statusLabel = booking.status === 'confirmed' ? 'Confirmed seat' : 'Waiting list';

    return (
      <Card className="space-y-5 bg-slate-900/95">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Next ride</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{statusLabel}</h2>
          </div>
          <div className="rounded-3xl bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-100">
            {booking.status === 'confirmed' ? booking.seat || 'Seat assigned' : `Waiting #${booking.waitingPosition}`}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-sm text-slate-400">Route</p>
            <p className="text-lg font-semibold text-white">{booking.route}</p>
            <p className="text-sm text-slate-400">From {booking.pickupPoint} to {booking.destination}</p>
            <p className="text-sm text-slate-400">Travel date</p>
            <p className="text-lg font-semibold text-white">{dateLabel}</p>
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-sm text-slate-400">Booking status</p>
            <div className="rounded-3xl bg-slate-900/95 p-4 text-white">
              <p className="text-base font-semibold capitalize">{booking.status}</p>
              {booking.status === 'waiting' ? (
                <p className="mt-2 text-sm text-slate-400">You are currently <span className="font-semibold text-indigo-200">#{booking.waitingPosition}</span> in the queue.</p>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Your seat is ready. Show the code below at pickup.</p>
              )}
            </div>
          </div>
        </div>

        {booking.status === 'confirmed' && booking.qrCode ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
            <p className="text-sm text-slate-400">Boarding QR code</p>
            <div className="mt-4 flex flex-col items-center justify-center gap-4">
              <img src={booking.qrCode} alt="Booking QR Code" className="h-52 w-52 rounded-3xl bg-white/5 p-4" />
              <p className="text-sm text-slate-300">Present this QR code when you board the shuttle.</p>
            </div>
          </div>
        ) : null}
      </Card>
    );
  }, [dashboard]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Student dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Welcome back, {user.name}</h1>
            <p className="mt-2 text-slate-400">Track live seat availability, waiting updates, and your next ride in one place.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/bookings" className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400">
              View all bookings
            </Link>
            <Button variant="outline" onClick={() => { clearAuth(); router.push('/auth/login'); }}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.8fr_1.2fr]">
          <div className="space-y-6">
            {loading ? (
              <Card className="rounded-3xl border border-slate-800 bg-slate-900/85 p-8">
                <p className="text-sm text-slate-400">Loading your student dashboard...</p>
              </Card>
            ) : error ? (
              <Card className="rounded-3xl border border-rose-500 bg-slate-900/85 p-8">
                <p className="text-sm text-rose-300">{error}</p>
              </Card>
            ) : bookingCard}

            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Live booking status</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Real-time ride updates</h2>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">Socket live</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm text-slate-400">Confirmed seats</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{dashboard?.confirmedCount ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm text-slate-400">Available seats</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{dashboard?.availableSeats ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm text-slate-400">Waiting students</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{dashboard?.waitingCount ?? 0}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-5 bg-slate-900/95">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Student status</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Verification & queue</h2>
                </div>
                <span className="rounded-3xl bg-slate-800 px-3 py-1 text-sm text-slate-300">{user.universityIdStatus}</span>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
                <div className="flex items-center justify-between text-slate-300">
                  <span>No-show count</span>
                  <span className="font-semibold text-white">{user.noShowCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Your waiting position</span>
                  <span className="font-semibold text-white">{user.waitingListPosition ?? 'None'}</span>
                </div>
              </div>
              <div className="space-y-3 text-slate-300">
                <p>• Your dashboard updates automatically when seats open or your booking moves on the queue.</p>
                <p>• Confirmed rides display a boarding QR code for fast check-in.</p>
                <p>• Use the booking page if you want to reserve another trip.</p>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-white">Quick actions</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Link href="/bookings/new" className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400">
                  Book a new ride
                </Link>
                <Link href="/bookings" className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-transparent px-4 py-3 text-sm font-semibold text-white hover:border-indigo-300 hover:text-indigo-200">
                  Review your ride history
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
