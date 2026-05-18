import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-12">
      <section className="mx-auto max-w-6xl rounded-3xl border border-slate-700 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-md">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-indigo-500/20 px-4 py-1 text-sm font-semibold text-indigo-200">
              Production-ready university transit platform
            </span>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Manage student rides, approvals, and waiting lists in real time.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Secure login, smart booking, campus QR boarding, and a responsive admin dashboard powered by Next.js, Tailwind, Socket.io, and MongoDB.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/login" className={buttonVariants({ size: 'lg' })}>
                Login
              </Link>
              <Link href="/auth/register" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Register
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-800 p-8 ring-1 ring-slate-700/80">
            <h2 className="text-xl font-semibold text-white">Student experience</h2>
            <div className="mt-6 space-y-4 text-slate-300">
              <p>• Upload university ID proof and track verification status.</p>
              <p>• Book buses, view waiting list position, and receive QR boarding codes.</p>
              <p>• Real-time updates for live seat availability and notifications.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
