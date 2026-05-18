'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/store/useAuthStore';
import { ToastProvider, useToast } from '@/components/ui/toast';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const { toast } = useToast();

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
      setUser(response.data.user, response.data.token);
      router.push('/dashboard');
      toast({ variant: 'success', title: 'Login successful', description: 'Welcome back to UNI Transportation.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'error', title: 'Login failed', description: 'Please check your credentials and try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <ToastProvider>
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/50">
          <div className="mb-6 space-y-1 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Student sign in</p>
            <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
            <p className="text-sm text-slate-400">Use your university email and password to access your dashboard.</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <FormField>
              <FormLabel htmlFor="email">Email address</FormLabel>
              <Input id="email" type="email" placeholder="student@uni.edu" {...register('email')} />
              {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
            </FormField>
            <FormField>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input id="password" type="password" placeholder="Enter your password" {...register('password')} />
              {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            New to UNI Transportation?{' '}
            <Link href="/auth/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
              Create an account
            </Link>
          </p>
        </div>
      </ToastProvider>
    </div>
  );
}
