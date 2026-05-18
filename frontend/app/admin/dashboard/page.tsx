'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'driver';
  universityIdStatus: 'pending' | 'verified' | 'rejected';
  universityIdVerifiedAt?: string | null;
  universityIdReviewNotes?: string | null;
  noShowCount?: number;
  waitingListPosition?: number | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [router, user]);

  useEffect(() => {
    if (!token) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
    const url = `${baseUrl}/api/admin/users${filter !== 'all' ? `?status=${filter}` : ''}`;

    async function loadUsers() {
      try {
        setLoading(true);
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Unable to load users');
        }

        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Could not load admin users');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [filter, token]);

  const statusCounts = useMemo(() => {
    return {
      pending: users.filter((item) => item.universityIdStatus === 'pending').length,
      verified: users.filter((item) => item.universityIdStatus === 'verified').length,
      rejected: users.filter((item) => item.universityIdStatus === 'rejected').length,
    };
  }, [users]);

  const updateUser = async (id: string, status: 'verified' | 'rejected') => {
    if (!token) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
    const reviewNotes = status === 'rejected' ? window.prompt('Enter a rejection note', 'Invalid or unverifiable university ID') : undefined;

    try {
      const response = await fetch(`${baseUrl}/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reviewNotes }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to update user');
      }

      const { user: updatedUser } = await response.json();
      setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to update the user');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Admin dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Welcome, {user.name}</h1>
            <p className="mt-2 text-slate-400">Review pending university verifications and manage student roles.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => { clearAuth(); router.push('/auth/login'); }}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Pending reviews</p>
            <p className="mt-4 text-3xl font-semibold text-white">{statusCounts.pending}</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Verified students</p>
            <p className="mt-4 text-3xl font-semibold text-white">{statusCounts.verified}</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Rejected profiles</p>
            <p className="mt-4 text-3xl font-semibold text-white">{statusCounts.rejected}</p>
          </Card>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Verify university IDs</h2>
            <p className="text-slate-400">Approve or reject students after checking their ID submission.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((option) => (
              <Button key={option} variant={filter === option ? 'default' : 'outline'} size="sm" onClick={() => setFilter(option)}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <Card>
            <p className="text-slate-400">Loading users…</p>
          </Card>
        ) : error ? (
          <Card className="border border-rose-500">
            <p className="text-rose-300">{error}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.length === 0 ? (
              <Card>
                <p className="text-slate-400">No users match the selected filter yet.</p>
              </Card>
            ) : (
              users.map((adminUser) => (
                <Card key={adminUser.id} className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{adminUser.role.toUpperCase()}</p>
                      <h3 className="text-xl font-semibold text-white">{adminUser.name}</h3>
                      <p className="text-sm text-slate-400">{adminUser.email}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100">
                      {adminUser.universityIdStatus}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-slate-400">No-show count</p>
                      <p className="mt-2 text-white">{adminUser.noShowCount ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Waiting position</p>
                      <p className="mt-2 text-white">{adminUser.waitingListPosition ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Review note</p>
                      <p className="mt-2 text-white">{adminUser.universityIdReviewNotes || 'None'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" onClick={() => updateUser(adminUser.id, 'verified')}>
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateUser(adminUser.id, 'rejected')}>
                      Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
