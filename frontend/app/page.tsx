'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Bus, Star } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import HomeMap from '@/components/HomeMap'

export default function LandingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/60 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/10">
              UR
            </div>
            <div>
              <p className="text-sm font-semibold text-white">UniRide</p>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Campus transport</p>
            </div>
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/login" className="text-sm text-slate-300 transition hover:text-cyan-400">
              Login
            </Link>
            <Link href="/register" className={buttonVariants({ size: 'sm' })}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-28 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),transparent_20%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),transparent_20%)]" />
        <div className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.85fr] items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                <Bus className="h-4 w-4" />
                Track buses, book seats, and ride campus faster.
              </div>

              <div className="space-y-6">
                <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                  Book Your Seat with a premium university ride experience.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-400">
                  Transform your campus commute into a modern transportation flow with live bus positions, route previews, seat availability, and instant booking.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Today’s rides', value: '18+' },
                  { label: 'Seats available', value: '72' },
                  { label: 'Average ETA', value: '5 min' },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/20">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { title: 'Live route preview', description: 'See routes and pickup points before you book.' },
                  { title: 'Quick boarding', description: 'Nearest departure times with seat counts.' },
                  { title: 'Premium feel', description: 'Glassmorphism, motion, and modern UI.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{item.title}</p>
                    <p className="mt-3 text-white">{item.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl"
            >
              <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Interactive booking</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Book Your Seat</h2>
              </div>

              <div className="grid gap-4">
                <label className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Pickup location</span>
                  <select className="mt-2 w-full rounded-2xl bg-slate-950/80 px-4 py-3 text-white outline-none ring-1 ring-slate-700 transition focus:ring-cyan-400">
                    <option>Central Library</option>
                    <option>North Gate</option>
                    <option>Sports Hub</option>
                    <option>Campus Gate</option>
                  </select>
                </label>

                <label className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Destination</span>
                  <select className="mt-2 w-full rounded-2xl bg-slate-950/80 px-4 py-3 text-white outline-none ring-1 ring-slate-700 transition focus:ring-cyan-400">
                    <option>Engineering Block</option>
                    <option>Business School</option>
                    <option>Student Residence</option>
                    <option>Main Gate</option>
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Trip date</span>
                    <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-2 w-full rounded-2xl bg-slate-950/80 px-4 py-3 text-white outline-none ring-1 ring-slate-700 transition focus:ring-cyan-400" />
                  </label>
                  <label className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Trip time</span>
                    <input type="time" defaultValue="08:30" className="mt-2 w-full rounded-2xl bg-slate-950/80 px-4 py-3 text-white outline-none ring-1 ring-slate-700 transition focus:ring-cyan-400" />
                  </label>
                </div>

                <label className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Seat count</span>
                  <input type="number" min="1" max="4" defaultValue={1} className="mt-2 w-full rounded-2xl bg-slate-950/80 px-4 py-3 text-white outline-none ring-1 ring-slate-700 transition focus:ring-cyan-400" />
                </label>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Available buses</p>
                    <p className="mt-2 text-2xl font-semibold text-white">4 buses nearby</p>
                  </div>
                  <span className="rounded-3xl bg-cyan-400/10 px-4 py-3 text-cyan-200">ETA 6 min</span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Standard seat</span>
                    <span>₤ 9.50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Express route</span>
                    <span>₤ 12.00</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/bookings/new" className={buttonVariants({ size: 'lg' }) + ' w-full text-center'}>
                  Find Your Ride <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/register" className={buttonVariants({ variant: 'outline', size: 'lg' }) + ' w-full text-center'}>
                  Book Your Seat
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-[0.9fr_0.6fr]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/30"
            >
              <div className="flex items-center justify-between gap-4 text-slate-400">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em]">Live transportation feed</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Available trips now</h2>
                </div>
                <span className="rounded-3xl bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-emerald-300">Live</span>
              </div>

              <div className="mt-8 grid gap-4">
                {[
                  { route: 'Central Library → Engineering Block', seats: 4, occupancy: 72, price: '₤ 9.50', eta: '5 min' },
                  { route: 'North Gate → Business School', seats: 2, occupancy: 85, price: '₤ 8.00', eta: '7 min' },
                  { route: 'Student Residence → Main Gate', seats: 6, occupancy: 42, price: '₤ 7.00', eta: '4 min' },
                ].map((trip, index) => (
                  <div key={index} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-inner shadow-slate-950/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-400">{trip.route}</p>
                        <p className="mt-2 text-xl font-semibold text-white">{trip.price}</p>
                      </div>
                      <span className="rounded-3xl bg-slate-800/80 px-3 py-2 text-sm text-slate-300">ETA {trip.eta}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span>{trip.seats} seats left</span>
                      <span className="h-1 w-1 rounded-full bg-slate-400" />
                      <span>Bus occupancy {trip.occupancy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/30"
            >
              <h3 className="text-xl font-semibold text-white">Live pickup points</h3>
              <p className="mt-2 text-sm text-slate-400">Nearest boarding locations with crowd and seat updates.</p>
              <div className="mt-6 space-y-4">
                {[
                  { name: 'North Gate', status: 'Busy', seats: 8, eta: '3 min' },
                  { name: 'Central Library', status: 'Steady', seats: 5, eta: '6 min' },
                  { name: 'Campus Gate', status: 'Calmer', seats: 11, eta: '10 min' },
                ].map((point) => (
                  <div key={point.name} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{point.name}</p>
                        <p className="text-sm text-slate-400">{point.status}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-300">ETA {point.eta}</span>
                    </div>
                    <div className="mt-4 text-sm text-slate-400">{point.seats} seats available at this boarding point.</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-[0.55fr_0.45fr]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <HomeMap pickup="Central Library" destination="Engineering Block" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="space-y-8"
            >
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Seat availability</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Smart capacity tracking</h3>
                  </div>
                  <span className="rounded-3xl bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">+12% demand</span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { label: 'Central Library → Engineering Block', fill: 72 },
                    { label: 'North Gate → Business School', fill: 85 },
                    { label: 'Residence → Main Gate', fill: 42 },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>{stat.label}</span>
                        <span>{stat.fill}% full</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-900">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${stat.fill}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/30">
                <div className="flex items-center gap-3">
                  <div className="rounded-3xl bg-cyan-400/10 p-3 text-cyan-300">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Student reviews</p>
                    <p className="mt-2 text-2xl font-semibold text-white">Rated 4.9 / 5 by campus riders</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { name: 'Sara', quote: 'Booking feels instant, the live route preview is fantastic.' },
                    { name: 'Adam', quote: 'This is the best way to commute between lectures.' },
                  ].map((review) => (
                    <div key={review.name} className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm text-slate-300">“{review.quote}”</p>
                      <p className="mt-3 text-sm font-semibold text-white">{review.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <section className="mt-20 space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Frequently asked</p>
              <h2 className="text-3xl font-semibold text-white">Everything a student needs to know</h2>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
              {[
                { q: 'Can I book without an account?', a: 'You can preview routes now, but confirmation and ticket QR are available after sign-up.' },
                { q: 'How early should I book?', a: 'Book at least 10 minutes before your trip to secure the best pickup point.' },
                { q: 'Are routes updated live?', a: 'Yes, route and seat availability refresh in real-time as buses move.' },
              ].map((item, index) => (
                <motion.div
                  key={item.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20"
                >
                  <p className="text-sm font-semibold text-white">{item.q}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.a}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mt-20 rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-950/95 to-slate-900/80 p-10 shadow-2xl shadow-slate-950/30">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Download the experience</p>
                <h2 className="mt-4 text-4xl font-semibold text-white">Ride smarter. Book faster. Campus transport, reimagined.</h2>
                <p className="mt-4 max-w-xl text-lg text-slate-400">From route suggestions to seat counts, this is a mobility platform built for students who want a premium, modern booking flow.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: 'Smart routes', description: 'Suggested pickups and destinations based on demand.' },
                  { title: 'Recurring rides', description: 'Save your daily line and book with one tap.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{item.title}</p>
                    <p className="mt-3 text-white">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className={buttonVariants({ size: 'lg' }) + ' w-full text-center'}>
                Start booking
              </Link>
              <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' }) + ' w-full text-center'}>
                Already have an account?
              </Link>
            </div>
          </section>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/90 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-400">
          © 2026 UniRide. All rights reserved.
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button className="flex-1 rounded-3xl bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15">Book</button>
          <button className="flex-1 rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800">Map</button>
          <button className="flex-1 rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800">Trips</button>
        </div>
      </div>
    </main>
  )
}
