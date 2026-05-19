'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import * as z from 'zod';
import api, { refreshCsrfToken } from '@/lib/api';
import { extractApiErrorMessage, getPostLoginPath, saveAuthTokens } from '@/lib/auth';
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

const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setLoading(true);
    try {
      await refreshCsrfToken();

      if (isDev) {
        console.log('[login] request', { email: values.email });
      }

      const response = await api.post('/auth/login', values);

      if (isDev) {
        console.log('[login] response', {
          user: response.data.user,
          hasAccessToken: Boolean(response.data.accessToken),
          hasRefreshToken: Boolean(response.data.refreshToken),
        });
      }

      const user = response.data.user;
      saveAuthTokens(response.data.accessToken, response.data.refreshToken);
      setUser(user);

      toast({
        variant: 'success',
        title: 'Login successful',
        description: `Welcome back, ${user.name}.`,
      });

      router.push(getPostLoginPath(user) as '/dashboard');
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error);
      const status = (error as { response?: { status?: number; data?: { status?: string } } })?.response?.status;
      const dataStatus = (error as { response?: { data?: { status?: string } } })?.response?.data?.status;

      if (isDev) {
        console.error('[login] error', { status, dataStatus, message, error });
      }

      toast({
        variant: 'error',
        title: status === 423 ? 'Account locked' : 'Login failed',
        description: message,
      });

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
            <Input id="email" type="email" placeholder="student@university.edu" disabled={loading} {...register('email')} />
            {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input id="password" type="password" placeholder="Enter your password" disabled={loading} {...register('password')} />
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
