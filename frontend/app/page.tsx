'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'

const PICKUP_OPTIONS = ['Central Library', 'North Gate', 'Sports Hub', 'Campus Gate']
const DESTINATION_OPTIONS = ['Engineering Block', 'Business School', 'Student Residence', 'Main Gate']
const TIME_OPTIONS = ['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM']
const AVAILABLE_RIDES = [
  { route: 'Library → Engineering Block', seats: 4, eta: '5 min', price: '₤ 9.50' },
  { route: 'North Gate → Business School', seats: 3, eta: '7 min', price: '₤ 8.00' },
  { route: 'Campus Gate → Main Hall', seats: 5, eta: '4 min', price: '₤ 7.20' },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [pickup, setPickup] = useState(PICKUP_OPTIONS[0])
  const [destination, setDestination] = useState(DESTINATION_OPTIONS[0])
  const [time, setTime] = useState(TIME_OPTIONS[1])

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const handleBookSeat = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push('/bookings/new')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
              UR
            </div>
            <div>
              <p className="text-sm font-semibold text-white">UniRide</p>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Book a Seat</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <LanguageSwitcher />
            <Link href="/login" className="text-sm text-slate-300 transition hover:text-cyan-300">
              {t('auth.login')}
            </Link>
            <Link href="/register" className={buttonVariants({ size: 'sm' })}>
              {t('auth.register')}
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{t('home.availableRides')}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t('home.headline')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              {t('home.subtext')}
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onSubmit={handleBookSeat}
              className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/30 backdrop-blur-xl"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">{t('home.pickup')}</label>
                  <select
                    value={pickup}
                    onChange={(event) => setPickup(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-white outline-none ring-1 ring-slate-800 transition focus:ring-cyan-400"
                  >
                    {PICKUP_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-slate-950 text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">{t('home.destination')}</label>
                  <select
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-white outline-none ring-1 ring-slate-800 transition focus:ring-cyan-400"
                  >
                    {DESTINATION_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-slate-950 text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">{t('home.time')}</label>
                  <select
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-white outline-none ring-1 ring-slate-800 transition focus:ring-cyan-400"
                  >
                    {TIME_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-slate-950 text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className={`${buttonVariants({ size: 'lg' })} w-full justify-center py-4 text-base font-semibold`}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {t('home.bookSeat')}
                </button>
              </div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/30 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-300">Available rides</p>
                  <p className="mt-1 text-lg font-semibold text-white">Fast routes ready now</p>
                </div>
                <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
                  Live
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {AVAILABLE_RIDES.map((ride) => (
                  <div key={ride.route} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 transition hover:border-cyan-400/30 hover:bg-slate-900/95">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{ride.route}</p>
                        <p className="mt-1 text-sm text-slate-400">{ride.eta} • {ride.seats} seats left</p>
                      </div>
                      <p className="text-base font-semibold text-cyan-300">{ride.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-500">
          UniRide · Simple campus ride booking · © 2026
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 py-3">
        <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-300">
          <button className="rounded-3xl bg-slate-900/80 px-3 py-3 transition hover:bg-slate-800">Home</button>
          <button className="rounded-3xl bg-slate-900/80 px-3 py-3 transition hover:bg-slate-800">My Trips</button>
          <button className="rounded-3xl bg-slate-900/80 px-3 py-3 transition hover:bg-slate-800">QR</button>
          <button className="rounded-3xl bg-slate-900/80 px-3 py-3 transition hover:bg-slate-800">Profile</button>
        </div>
      </div>
    </main>
  )
}
