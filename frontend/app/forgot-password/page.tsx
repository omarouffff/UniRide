'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api, { refreshCsrfToken } from '@/lib/api';
import { extractApiErrorMessage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setLoading(true);
    try {
      await refreshCsrfToken();
      await api.post('/auth/password-reset/request', values);
      setSent(true);
      toast({
        variant: 'success',
        title: 'Check your email',
        description: 'If an account exists, a reset link has been sent.',
      });
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Request failed',
        description: extractApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-7">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-400">
          {sent
            ? 'Check your inbox for a password reset link.'
            : 'Enter your email and we will send you a reset link.'}
        </p>
        {!sent && (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input id="email" type="email" placeholder="student@university.edu" disabled={loading} {...register('email')} />
              {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}
        <Link href="/login" className="mt-4 block text-center text-sm text-cyan-200 hover:text-cyan-100">
          Back to login
        </Link>
      </section>
    </main>
  );
}
