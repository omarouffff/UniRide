'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<any[]>([]);
  const [form, setForm] = useState({ busNumber: '', capacity: '40', licensePlate: '' });

  const load = () => api.get('/admin/buses').then((res) => setBuses(res.data.buses || []));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/admin/buses', { ...form, capacity: Number(form.capacity) });
    setForm({ busNumber: '', capacity: '40', licensePlate: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Buses</h1>
      <Card className="p-6">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="Bus number" value={form.busNumber} onChange={(e) => setForm({ ...form, busNumber: e.target.value })} required />
          <Input placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <Input placeholder="License plate" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} />
          <Button type="submit" className="sm:col-span-3">Add bus</Button>
        </form>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {buses.map((bus) => (
          <Card key={bus.id} className="p-4">
            <p className="font-medium">Bus {bus.busNumber}</p>
            <p className="text-sm text-slate-400">Capacity {bus.capacity} · {bus.status}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
