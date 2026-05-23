'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { refreshCsrfToken } from '@/lib/api';
import { extractApiErrorMessage, getPostLoginPath } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';
import { useRedirectAuthenticated } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
});

type Values = z.infer<typeof schema>;

const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('auth.invalidEmail')),
        password: z.string().min(8, t('auth.passwordPlaceholder')),
      }),
    [t]
  );
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  useRedirectAuthenticated();

  async function onSubmit(values: Values) {
    setLoading(true);
    try {
      await refreshCsrfToken();

      if (isDev) {
        console.log('[login] request', { email: values.email });
      }

      const user = await auth.signIn(values.email, values.password);
      if (!user) {
        throw new Error('Sign in failed');
      }

      toast({
        variant: 'success',
        title: t('auth.login'),
        description: t('auth.welcomeBack', { name: user.name }),
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
        title: status === 423 ? t('errors.accountLocked') : t('errors.loginFailed'),
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
          <p className="text-sm font-medium text-cyan-200">{t('auth.loginTitle')}</p>
          <h1 className="mt-2 text-3xl font-semibold">{t('auth.loginHeader')}</h1>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormLabel htmlFor="email">{t('auth.email')}</FormLabel>
            <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} disabled={loading} {...register('email')} />
            {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="password">{t('auth.password')}</FormLabel>
            <Input id="password" type="password" placeholder={t('auth.passwordPlaceholder')} disabled={loading} {...register('password')} />
            {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
          </FormField>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <LogIn className="h-4 w-4" />
            {loading ? t('auth.signingIn') : t('auth.login')}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          <Link href="/forgot-password" className="text-cyan-200 hover:text-cyan-100">{t('auth.forgotPassword')}</Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-400">
          {t('auth.registerPrompt')} <Link href="/register" className="font-semibold text-cyan-200 hover:text-cyan-100">{t('auth.register')}</Link>
        </p>
      </section>
    </main>
  );
}
