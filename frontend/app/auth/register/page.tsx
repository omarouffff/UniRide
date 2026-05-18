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
import { useToast } from '@/components/ui/toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
  universityId: z.string().min(8, 'Use your university student number'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', values);
      setUser(response.data.user, response.data.token);
      toast({ variant: 'success', title: 'Registration complete', description: 'Your account was created successfully.' });
      router.push('/auth/verify-university-id');
    } catch (error) {
      console.error(error);
      toast({ variant: 'error', title: 'Registration failed', description: 'Please check your data and try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/50">
        <div className="mb-6 space-y-1 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Student registration</p>
          <h1 className="text-3xl font-semibold text-white">Create your student account</h1>
          <p className="text-sm text-slate-400">Register and upload your university ID to unlock booking privileges.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormLabel htmlFor="name">Full name</FormLabel>
            <Input id="name" placeholder="Jane Doe" {...register('name')} />
            {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="email">University email</FormLabel>
            <Input id="email" type="email" placeholder="student@uni.edu" {...register('email')} />
            {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input id="password" type="password" placeholder="Choose a secure password" {...register('password')} />
            {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="universityId">Student number</FormLabel>
            <Input id="universityId" placeholder="12345678" {...register('universityId')} />
            {errors.universityId && <FormMessage>{errors.universityId.message}</FormMessage>}
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link href="/auth/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
            Login instead
          </Link>
        </p>
      </div>
    </div>
  );
}
