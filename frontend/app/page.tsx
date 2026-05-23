'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Clock, Users, QrCode, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { buttonVariants } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { MobileNav } from '@/components/layout/MobileNav';
import { TripCardSkeleton } from '@/components/ui/shimmer';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';

interface TripOption {
  id: string;
  title: string;
  pickupPoint: string;
  destination: string;
  departureTime: string;
  capacity: number;
  confirmedCount: number;
  availableSeats: number;
  busNumber: string;
}

interface ActiveBooking {
  id: string;
  route: string;
  status: string;
  seat?: string | null;
  travelDate: string;
}

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedTripId, setSelectedTripId] = useState('');
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get('/bookings/public/trips')
      .then((res) => {
        if (!active) return;
        const list: TripOption[] = res.data.trips || [];
        setTrips(list);
        if (list[0]) {
          setPickup(list[0].pickupPoint);
          setDestination(list[0].destination);
          setSelectedTripId(list[0].id);
        }
      })
      .finally(() => active && setLoadingTrips(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user || user.status !== 'approved') return;
    let active = true;
    api
      .get('/bookings/dashboard')
      .then((res) => {
        if (!active) return;
        const upcoming = res.data.upcomingBooking;
        if (upcoming) {
          setActiveBooking({
            id: upcoming.id,
            route: upcoming.route,
            status: upcoming.status,
            seat: upcoming.seat,
            travelDate: upcoming.travelDate,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const pickupMatch = !pickup || trip.pickupPoint.toLowerCase().includes(pickup.toLowerCase());
      const destMatch = !destination || trip.destination.toLowerCase().includes(destination.toLowerCase());
      return pickupMatch && destMatch;
    });
  }, [trips, pickup, destination]);

  const pickupOptions = useMemo(() => [...new Set(trips.map((t) => t.pickupPoint))], [trips]);
  const destinationOptions = useMemo(() => [...new Set(trips.map((t) => t.destination))], [trips]);

  const handleBook = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const tripId = selectedTripId || filteredTrips[0]?.id;
    router.push(tripId ? `/bookings/new?tripId=${tripId}` : '/bookings/new');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-24 sm:pb-0">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25">
              UR
            </div>
            <div>
              <p className="text-sm font-semibold">UniRide</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Move faster</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link href="/dashboard" className={buttonVariants({ size: 'sm' })}>
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-300 hover:text-cyan-300">
                  {t('auth.login')}
                </Link>
                <Link href="/register" className={buttonVariants({ size: 'sm' })}>
                  {t('auth.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{t('home.availableRides')}</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">{t('home.headline')}</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">{t('home.subtext')}</p>
        </motion.div>

        {activeBooking && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-200">Active booking</p>
                <p className="font-semibold">{activeBooking.route}</p>
                <p className="text-sm text-slate-300">
                  {format(new Date(activeBooking.travelDate), 'PPp')} · {activeBooking.status}
                  {activeBooking.seat ? ` · Seat ${activeBooking.seat}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/qr" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  <QrCode className="mr-1 h-4 w-4" /> QR
                </Link>
                <Link href="/my-trips" className={buttonVariants({ size: 'sm' })}>
                  <Radio className="mr-1 h-4 w-4" /> Live
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/40"
          >
            <h2 className="text-lg font-semibold">{t('home.bookSeat')}</h2>
            <div className="mt-5 space-y-4">
              <label className="block space-y-2 text-sm">
                <span className="text-slate-300 flex items-center gap-2"><MapPin className="h-4 w-4" />{t('home.pickup')}</span>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/60"
                >
                  {pickupOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-sm">
                <span className="text-slate-300 flex items-center gap-2"><MapPin className="h-4 w-4" />{t('home.destination')}</span>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400/60"
                >
                  {destinationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={handleBook} className={`${buttonVariants({ size: 'lg' })} w-full mt-2`}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {t('home.bookSeat')}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('home.fastRoutesReady')}</h2>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">{t('home.live')}</span>
            </div>
            <div className="mt-5 space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {loadingTrips &&
                Array.from({ length: 3 }).map((_, i) => <TripCardSkeleton key={i} />)}
              {!loadingTrips && filteredTrips.length === 0 && (
                <p className="text-sm text-slate-400">No trips match your route. Check back soon.</p>
              )}
              {filteredTrips.map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selectedTripId === trip.id
                      ? 'border-cyan-400/50 bg-cyan-500/10'
                      : 'border-white/10 bg-slate-950/70 hover:border-white/20'
                  }`}
                >
                  <p className="font-semibold">{trip.pickupPoint} → {trip.destination}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(trip.departureTime), 'p')}</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{trip.availableSeats} seats</span>
                    <span>Bus {trip.busNumber}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="hidden sm:block border-t border-white/10 py-8 text-center text-sm text-slate-500">
        {t('home.footer')}
      </footer>
      <MobileNav />
    </main>
  );
}
