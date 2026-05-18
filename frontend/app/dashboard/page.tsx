'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, Clock, XCircle, ArrowRight, Plus, Users } from 'lucide-react';
import api from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { StatCard, LoadingCard } from '@/components/StatCard';

interface DashboardPayload {
  user: { id: string; name: string; email: string; role: string; status: 'pending' | 'approved' | 'rejected'; noShowCount: number };
  upcomingBooking: null | { id: string; route: string; travelDate: string; status: 'confirmed' | 'waiting' | 'cancelled'; seat?: string; waitingPosition?: number; qrCode?: string };
  availableSeats: number;
  confirmedCount: number;
  waitingCount: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
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
    else if (user.status !== 'approved') router.replace(user.status === 'pending' ? '/pending-approval' : '/login');
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
    pending: { icon: Clock, title: 'Pending admin approval', text: 'Your documents are under review. Booking opens after approval.', color: 'text-amber-200', bgColor: 'from-amber-500/20 to-orange-500/10' },
    approved: { icon: CheckCircle2, title: 'Account Verified', text: 'You can book trips and generate boarding QR codes. Enjoy seamless travel!', color: 'text-emerald-200', bgColor: 'from-emerald-500/20 to-green-500/10' },
    rejected: { icon: XCircle, title: 'Access Restricted', text: 'Access is blocked. Contact transportation administration for review.', color: 'text-rose-200', bgColor: 'from-rose-500/20 to-red-500/10' },
  }[currentStatus]), [currentStatus]);

  if (!user || user.role !== 'student') return null;
  const StatusIcon = statusMeta.icon;

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Welcome Section */}
            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-4xl font-bold text-white">
                Welcome back, {user.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-slate-400">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </motion.div>

            {/* Account Status Card */}
            <motion.div variants={itemVariants}>
              <div className={`p-8 rounded-xl border border-white/10 bg-gradient-to-br ${statusMeta.bgColor} backdrop-blur-sm`}>
                <div className="flex items-start gap-4">
                  <StatusIcon className={`mt-1 h-8 w-8 ${statusMeta.color} flex-shrink-0`} />
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-white">{statusMeta.title}</h2>
                    <p className="mt-2 text-slate-300">{statusMeta.text}</p>
                  </div>
                </div>
                {currentStatus === 'approved' && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/booking" className={buttonVariants({ size: 'sm' })}>
                      <Plus className="w-4 h-4 mr-2" />
                      Book Trip
                    </Link>
                    <Link href="/my-bookings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                      My Bookings
                    </Link>
                    <Link href="/qr" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                      QR Code
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats Grid */}
            {loading ? (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[1, 2, 3].map((i) => (
                  <LoadingCard key={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <StatCard
                  title="Available Seats"
                  value={dashboard?.availableSeats || 0}
                  icon={<Users className="w-6 h-6 text-cyan-400" />}
                />
                <StatCard
                  title="Your Bookings"
                  value={dashboard?.confirmedCount || 0}
                  icon={<CheckCircle2 className="w-6 h-6 text-green-400" />}
                  change={{ value: dashboard?.confirmedCount ? 100 : 0, type: 'up' }}
                />
                <StatCard
                  title="Waiting List"
                  value={dashboard?.waitingCount || 0}
                  icon={<Clock className="w-6 h-6 text-yellow-400" />}
                />
              </motion.div>
            )}

            {/* Upcoming Trip Section */}
            <motion.div variants={itemVariants}>
              <div className="p-8 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                  <CalendarClock className="h-6 w-6 text-cyan-400" />
                  <h2 className="text-2xl font-semibold text-white">Upcoming Trip</h2>
                </div>
                {loading ? (
                  <div className="h-24 bg-white/5 rounded-lg animate-pulse" />
                ) : dashboard?.upcomingBooking ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Route</p>
                        <p className="text-lg font-semibold text-white mt-1">
                          {dashboard.upcomingBooking.route}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Departure</p>
                        <p className="text-lg font-semibold text-white mt-1">
                          {new Date(dashboard.upcomingBooking.travelDate).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Status</p>
                        <p className={`text-lg font-semibold mt-1 capitalize ${
                          dashboard.upcomingBooking.status === 'confirmed' 
                            ? 'text-green-400' 
                            : 'text-yellow-400'
                        }`}>
                          {dashboard.upcomingBooking.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Seat</p>
                        <p className="text-lg font-semibold text-white mt-1">
                          {dashboard.upcomingBooking.seat || `Waiting #${dashboard.upcomingBooking.waitingPosition || '-'}`}
                        </p>
                      </div>
                    </div>
                    {dashboard.upcomingBooking.qrCode && (
                      <Link href="/qr" className={buttonVariants({ size: 'sm' })}>
                        View QR Code
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No upcoming trips yet</p>
                    <Link href="/booking" className={buttonVariants({ size: 'sm' })}>
                      <Plus className="w-4 h-4 mr-2" />
                      Book Your First Trip
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Link
                href="/booking"
                className="group p-6 rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 hover:border-cyan-400/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white">Browse Available Trips</h3>
                    <p className="text-sm text-slate-400">Find and book your next ride</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/qr"
                className="group p-6 rounded-lg border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/10 hover:border-purple-400/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white">Your QR Code</h3>
                    <p className="text-sm text-slate-400">Show your QR for boarding verification</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
