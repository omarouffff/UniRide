'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import * as z from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
});

type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      setUser(response.data.user);
      toast({ variant: 'success', title: 'Login successful', description: 'Welcome back to UniRide.' });
      router.push('/dashboard');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Check your credentials.';
      const status = error?.response?.status;
      const dataStatus = error?.response?.data?.status;

      let title = 'Login Failed';
      if (status === 423) {
        title = 'Account Locked';
      } else if (status === 403) {
        if (dataStatus === 'pending') {
          title = 'Verification Pending';
        } else if (dataStatus === 'rejected') {
          title = 'Account Rejected';
        } else if (dataStatus === 'banned') {
          title = 'Account Suspended';
        } else {
          title = 'Verification Required';
        }
      }

      toast({ variant: 'error', title, description: message });
      if (dataStatus === 'pending') {
        router.push('/pending-approval');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-slate-950/40">
        <div className="mb-6">
          <p className="text-sm font-medium text-cyan-200">UniRide login</p>
          <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input id="email" type="email" placeholder="student@university.edu" {...register('email')} />
            {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input id="password" type="password" placeholder="Enter your password" {...register('password')} />
            {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
          </FormField>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <LogIn className="h-4 w-4" />
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          New student? <Link href="/register" className="font-semibold text-cyan-200 hover:text-cyan-100">Register</Link>
        </p>
      </section>
    </main>
  );
}
