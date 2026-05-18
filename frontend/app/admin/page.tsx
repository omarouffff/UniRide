'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Bus, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel } from '@/components/ui/form';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'driver';
  status: 'pending' | 'approved' | 'rejected';
  idCardImage?: string;
  paymentProofImage?: string;
}

interface Analytics {
  bookingsCount: number;
  pendingUsers: number;
  noShowStats: number;
  tripsCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [tripForm, setTripForm] = useState({ title: '', pickupPoint: '', destination: '', busNumber: '', capacity: '40', departureTime: '' });

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (user.role !== 'admin') router.replace('/dashboard');
  }, [router, user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const query = filter === 'all' ? '' : `?status=${filter}`;
    api.get(`/admin/users${query}`).then((response) => setUsers(response.data.users || []));
    api.get('/admin/analytics').then((response) => setAnalytics(response.data));
  }, [filter, user]);

  const counts = useMemo(() => ({
    pending: users.filter((item) => item.status === 'pending').length,
    approved: users.filter((item) => item.status === 'approved').length,
    rejected: users.filter((item) => item.status === 'rejected').length,
  }), [users]);

  async function updateUser(id: string, status: 'approved' | 'rejected') {
    const response = await api.patch(`/admin/users/${id}`, { status });
    setUsers((current) => current.map((item) => (item.id === id ? response.data.user : item)));
    toast({ variant: 'success', title: `User ${status}`, description: 'The account lifecycle was updated.' });
  }

  async function createTrip(event: React.FormEvent) {
    event.preventDefault();
    await api.post('/admin/trips', { ...tripForm, capacity: Number(tripForm.capacity) });
    setTripForm({ title: '', pickupPoint: '', destination: '', busNumber: '', capacity: '40', departureTime: '' });
    const analyticsResponse = await api.get('/admin/analytics');
    setAnalytics(analyticsResponse.data);
    toast({ variant: 'success', title: 'Trip created', description: 'Students can now book this trip.' });
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-cyan-200">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">UniRide Operations</h1>
          </div>
          <Button variant="outline" onClick={() => { clearAuth(); router.push('/login'); }}>Sign out</Button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ['Bookings', analytics?.bookingsCount ?? 0],
            ['Pending users', analytics?.pendingUsers ?? counts.pending],
            ['No-shows', analytics?.noShowStats ?? 0],
            ['Trips', analytics?.tripsCount ?? 0],
          ].map(([label, value]) => (
            <Card key={label} className="rounded-lg">
              <BarChart3 className="h-5 w-5 text-cyan-200" />
              <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
              <p className="text-sm text-slate-400">{label}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card className="rounded-lg">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-xl font-semibold text-white">Users Management</h2>
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
                  <Button key={item} size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)}>
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {users.map((adminUser) => (
                <div key={adminUser.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <h3 className="font-semibold text-white">{adminUser.name}</h3>
                      <p className="text-sm text-slate-400">{adminUser.email}</p>
                      <p className="mt-1 text-sm capitalize text-cyan-100">{adminUser.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateUser(adminUser.id, 'approved')}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => updateUser(adminUser.id, 'rejected')}><X className="mr-1 h-4 w-4" /> Reject</Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {adminUser.idCardImage && <a href={adminUser.idCardImage} target="_blank" className="text-sm text-cyan-200 hover:text-cyan-100">University ID image</a>}
                    {adminUser.paymentProofImage && <a href={adminUser.paymentProofImage} target="_blank" className="text-sm text-cyan-200 hover:text-cyan-100">Payment proof image</a>}
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-slate-400">No users match this filter.</p>}
            </div>
          </Card>

          <Card className="rounded-lg">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-cyan-200" />
              <h2 className="text-xl font-semibold text-white">Trips Management</h2>
            </div>
            <form className="mt-5 space-y-4" onSubmit={createTrip}>
              {[
                ['title', 'Trip title', 'Morning campus shuttle'],
                ['pickupPoint', 'Pickup point', 'Main gate'],
                ['destination', 'Destination', 'Engineering campus'],
                ['busNumber', 'Bus', 'BUS-12'],
                ['capacity', 'Capacity', '40'],
                ['departureTime', 'Schedule time', ''],
              ].map(([key, label, placeholder]) => (
                <FormField key={key}>
                  <FormLabel htmlFor={key}>{label}</FormLabel>
                  <Input
                    id={key}
                    type={key === 'departureTime' ? 'datetime-local' : key === 'capacity' ? 'number' : 'text'}
                    placeholder={placeholder}
                    value={(tripForm as any)[key]}
                    onChange={(event) => setTripForm((current) => ({ ...current, [key]: event.target.value }))}
                    required
                  />
                </FormField>
              ))}
              <Button type="submit" className="w-full">Create trip</Button>
            </form>
          </Card>
        </section>
      </div>
    </main>
  );
}
