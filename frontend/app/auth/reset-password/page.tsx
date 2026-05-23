'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from '@/lib/supabaseEnv';
import { updatePassword } from '@/lib/supabaseAuth';
import { extractApiErrorMessage } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Values = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const { url, key } = getSupabasePublicConfig();
    if (!url || !key) {
      setSessionError('Supabase is not configured.');
      return;
    }
    const supabase = createBrowserClient(url, key);

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setSessionError(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function onSubmit(values: Values) {
    if (!ready) {
      toast({
        variant: 'error',
        title: t('auth.invalidResetLink'),
        description: t('auth.resetLinkMissing'),
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(values.password);
      if (error) throw error;
      setSuccess(true);
      toast({ variant: 'success', title: t('auth.passwordUpdated'), description: t('auth.passwordUpdatedDescription') });
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      toast({
        variant: 'error',
        title: t('auth.resetFailed'),
        description: extractApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-7 text-center">
          <h1 className="text-xl font-semibold">{t('auth.invalidResetLink')}</h1>
          <p className="mt-2 text-sm text-slate-400">{sessionError}</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-cyan-200 hover:text-cyan-100">
            {t('auth.requestReset')}
          </Link>
        </section>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="w-full max-w-md rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-7 text-center">
          <h1 className="text-xl font-semibold text-emerald-200">{t('auth.passwordUpdated')}</h1>
          <p className="mt-2 text-sm text-slate-300">{t('auth.redirectingToLogin')}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-7 shadow-2xl">
        <h1 className="text-2xl font-semibold">{t('auth.setNewPassword')}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {ready ? t('auth.chooseStrongPassword') : 'Open the reset link from your email to continue.'}
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormLabel htmlFor="password">{t('auth.newPassword')}</FormLabel>
            <Input id="password" type="password" disabled={loading || !ready} {...register('password')} />
            {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="confirmPassword">{t('auth.confirmPassword')}</FormLabel>
            <Input id="confirmPassword" type="password" disabled={loading || !ready} {...register('confirmPassword')} />
            {errors.confirmPassword && <FormMessage>{errors.confirmPassword.message}</FormMessage>}
          </FormField>
          <Button type="submit" className="w-full" disabled={loading || !ready}>
            {loading ? t('auth.updating') : t('auth.updatePassword')}
          </Button>
        </form>
        <Link href="/login" className="mt-4 block text-center text-sm text-cyan-200 hover:text-cyan-100">
          {t('auth.backToLogin')}
        </Link>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
