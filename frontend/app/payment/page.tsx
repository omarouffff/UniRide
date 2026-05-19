'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel } from '@/components/ui/form';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

export default function PaymentPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [router, user]);

  useEffect(() => {
    if (!user) return;
    api.get('/payments/mine').then((response) => setPayments(response.data.payments || [])).catch(() => undefined);
  }, [user]);

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const response = await api.post('/payments', form);
      setPayments((current) => [response.data.payment, ...current]);
      toast({ variant: 'success', title: 'Payment submitted', description: 'Your payment proof is waiting for admin review.' });
      event.currentTarget.reset();
    } catch (error: any) {
      toast({ variant: 'error', title: 'Payment failed', description: error?.response?.data?.message || 'Try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="rounded-lg">
          <h1 className="text-2xl font-semibold text-white">Submit Payment</h1>
          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submitPayment}>
            <FormField>
              <FormLabel htmlFor="amount">Amount</FormLabel>
              <Input id="amount" name="amount" type="number" min="1" placeholder="250" required />
            </FormField>
            <FormField>
              <FormLabel htmlFor="method">Method</FormLabel>
              <Input id="method" name="method" placeholder="cash" defaultValue="cash" required />
            </FormField>
            <FormField className="sm:col-span-2">
              <FormLabel htmlFor="proofImage">Payment proof image</FormLabel>
              <Input id="proofImage" name="proofImage" type="file" accept="image/png,image/jpeg,image/webp" />
            </FormField>
            <Button type="submit" disabled={loading} className="sm:col-span-2">{loading ? 'Submitting...' : 'Submit payment'}</Button>
          </form>
        </Card>

        <Card className="rounded-lg">
          <h2 className="text-xl font-semibold text-white">Payment History</h2>
          <div className="mt-4 space-y-3">
            {payments.map((payment) => (
              <div key={payment._id || payment.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                <p className="font-medium text-white">{payment.amount} {payment.currency || 'EGP'} - {payment.status}</p>
                {payment.proofImage && <a className="text-sm text-cyan-200" href={payment.proofImage} target="_blank">View proof</a>}
              </div>
            ))}
            {payments.length === 0 && <p className="text-slate-400">No payments yet.</p>}
          </div>
        </Card>
      </div>
    </main>
  );
}
