'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function QRScannerPage() {
  const { toast } = useToast();
  const [payload, setPayload] = useState('');
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    try {
      await api.post('/driver/scan', { qrPayload: payload });
      toast({ variant: 'success', title: 'Passenger boarded', description: 'The booking was marked as boarded.' });
      setPayload('');
    } catch (error: any) {
      toast({ variant: 'error', title: 'Scan failed', description: error?.response?.data?.message || 'Invalid QR code.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-lg">
          <h1 className="text-3xl font-semibold text-white">QR Scanner</h1>
          <p className="mt-2 text-slate-400">Paste the encrypted QR payload from the passenger QR code.</p>
          <div className="mt-6 space-y-4">
            <Input value={payload} onChange={(event) => setPayload(event.target.value)} placeholder="Encrypted QR payload" />
            <Button onClick={scan} disabled={loading || !payload}>{loading ? 'Scanning...' : 'Mark boarded'}</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
