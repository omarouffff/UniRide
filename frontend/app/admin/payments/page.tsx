'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);

  const load = () => api.get('/admin/payments').then((res) => setPayments(res.data.payments || []));

  useEffect(() => {
    load();
  }, []);

  const verify = async (id: string, status: 'completed' | 'failed') => {
    await api.patch(`/admin/payments/${id}/verify`, { status });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <div className="space-y-3">
        {payments.map((payment) => (
          <Card key={payment.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{payment.user?.name || payment.userId}</p>
              <p className="text-sm text-slate-400">
                {payment.method} · EGP {payment.amount} · {payment.status}
              </p>
              {payment.proofImage && (
                <a href={payment.proofImage} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 underline">
                  View screenshot
                </a>
              )}
            </div>
            {payment.status === 'under_review' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => verify(payment.id, 'completed')}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => verify(payment.id, 'failed')}>Reject</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
