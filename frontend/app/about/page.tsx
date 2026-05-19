import { Card } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Card className="rounded-lg">
          <p className="text-sm font-medium text-cyan-200">About UniRide</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">University transportation with controlled access</h1>
          <p className="mt-4 text-slate-400">
            UniRide manages student verification, admin approval, trip booking, QR boarding, driver operations, payments, and operational analytics in one connected SaaS system.
          </p>
        </Card>
      </div>
    </main>
  );
}
