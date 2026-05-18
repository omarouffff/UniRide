'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'card' | 'wallet'>('card');

  function handlePay() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
    // This is a mock-ready flow; integrate Stripe in future
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Card className="p-8 space-y-6">
          <h1 className="text-2xl font-semibold">Mock Payment</h1>
          <p className="text-slate-400">Choose a payment method. This is a mock UI ready for Stripe integration.</p>

          <div className="flex gap-3">
            <Button variant={method === 'card' ? 'default' : 'outline'} onClick={() => setMethod('card')}>Card</Button>
            <Button variant={method === 'wallet' ? 'default' : 'outline'} onClick={() => setMethod('wallet')}>Wallet</Button>
          </div>

          <div className="pt-4">
            <Button onClick={handlePay} className="w-full" disabled={loading}>{loading ? 'Processing…' : 'Pay now'}</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
