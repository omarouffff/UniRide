'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bus, LogIn, UserPlus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(user ? '/dashboard' : '/login');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [router, user]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-10 opacity-0 animate-[fadeIn_260ms_ease-out_forwards]">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <Bus className="h-4 w-4" />
            UniRide transport system
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-white sm:text-6xl">
            University rides, approvals, bookings, and boarding in one fast SaaS workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Students upload documents, admins approve access, drivers scan QR codes, and seats update live.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className={buttonVariants({ size: 'lg' })}>
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
            <Link href="/register" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <UserPlus className="mr-2 h-4 w-4" />
              Register
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {['Pending approval', 'Seat allocation', 'Encrypted QR boarding'].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/40">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{item}</p>
                <ArrowRight className="h-4 w-4 text-cyan-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
