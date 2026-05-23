'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', pickupPoint: '', destination: '', baseFare: '25' });

  const load = () => api.get('/admin/routes').then((res) => setRoutes(res.data.routes || []));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/admin/routes', { ...form, baseFare: Number(form.baseFare) });
    setForm({ name: '', pickupPoint: '', destination: '', baseFare: '25' });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Routes</h1>
      <Card className="p-6 space-y-4">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Route name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Pickup" value={form.pickupPoint} onChange={(e) => setForm({ ...form, pickupPoint: e.target.value })} required />
          <Input placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
          <Input placeholder="Base fare" value={form.baseFare} onChange={(e) => setForm({ ...form, baseFare: e.target.value })} />
          <Button type="submit" className="sm:col-span-2">Add route</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {routes.map((route) => (
          <Card key={route.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{route.name}</p>
              <p className="text-sm text-slate-400">{route.pickupPoint} → {route.destination}</p>
            </div>
            <span className="text-cyan-300">EGP {route.baseFare}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
