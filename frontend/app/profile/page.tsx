'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [router, user]);

  if (!user) return null;

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const response = await api.patch('/auth/profile', form);
      setUser(response.data.user);
      toast({ variant: 'success', title: 'Profile updated', description: 'Your profile data was saved.' });
    } catch (error: any) {
      toast({ variant: 'error', title: 'Update failed', description: error?.response?.data?.message || 'Try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="rounded-lg">
          <div className="grid gap-6 md:grid-cols-[0.8fr_1fr]">
            <div>
              <p className="text-sm font-medium text-cyan-200">Student profile</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{user.name}</h1>
              <p className="mt-2 text-slate-400">{user.email}</p>
              <div className="mt-6 space-y-2 text-sm text-slate-300">
                <p>University ID: <span className="text-white">{user.universityId}</span></p>
                <p>College: <span className="text-white">{user.college || 'N/A'}</span></p>
                <p>Academic year: <span className="text-white">{user.academicYear || 'N/A'}</span></p>
                <p>Phone: <span className="text-white">{user.phoneNumber || 'N/A'}</span></p>
                <p>Status: <span className="text-white">{user.status}</span></p>
              </div>
              {user.profileImage && <img src={user.profileImage} alt="Profile" className="mt-6 h-28 w-28 rounded-full border border-white/10 object-cover" />}
            </div>

            <form className="space-y-4" onSubmit={updateProfile}>
              <FormField>
                <FormLabel htmlFor="name">Name</FormLabel>
                <Input id="name" name="name" defaultValue={user.name} />
              </FormField>
              <FormField>
                <FormLabel htmlFor="phoneNumber">Phone number</FormLabel>
                <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phoneNumber || ''} />
              </FormField>
              <FormField>
                <FormLabel htmlFor="college">College</FormLabel>
                <Input id="college" name="college" defaultValue={user.college || ''} />
              </FormField>
              <FormField>
                <FormLabel htmlFor="academicYear">Academic year</FormLabel>
                <Input id="academicYear" name="academicYear" defaultValue={user.academicYear || ''} />
              </FormField>
              <FormField>
                <FormLabel htmlFor="profileImage">Profile image</FormLabel>
                <Input id="profileImage" name="profileImage" type="file" accept="image/png,image/jpeg,image/webp" />
              </FormField>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save profile'}</Button>
            </form>
          </div>
        </Card>

        <Card className="rounded-lg">
          <p className="text-sm font-medium text-cyan-200">University ID proof</p>
          {user.universityIdImage ? (
            <img src={user.universityIdImage} alt="University ID" className="mt-4 max-h-[420px] w-full rounded-lg border border-slate-700 object-contain" />
          ) : (
            <p className="mt-4 text-slate-400">No university ID image uploaded yet.</p>
          )}
        </Card>
      </div>
    </main>
  );
}
