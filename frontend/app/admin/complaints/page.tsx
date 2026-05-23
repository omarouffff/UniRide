'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);

  const load = () => api.get('/admin/complaints').then((res) => setComplaints(res.data.complaints || []));

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/admin/complaints/${id}`, { status });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Complaints</h1>
      <div className="space-y-3">
        {complaints.map((item) => (
          <Card key={item.id} className="p-4 space-y-2">
            <div className="flex justify-between gap-2">
              <p className="font-medium">{item.subject}</p>
              <span className="text-xs uppercase text-slate-400">{item.status}</span>
            </div>
            <p className="text-sm text-slate-300">{item.message}</p>
            <p className="text-xs text-slate-500">{item.user?.email}</p>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'in_progress')}>In progress</Button>
              <Button size="sm" onClick={() => updateStatus(item.id, 'resolved')}>Resolve</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
