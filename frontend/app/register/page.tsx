'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, UserPlus } from 'lucide-react';
import * as z from 'zod';
import api from '@/lib/api';
import { signUpWithEmail } from '@/lib/supabaseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';
import { useRedirectAuthenticated } from '@/hooks/useAuth';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'),
  college: z.string().min(2, 'Enter your college'),
  academicYear: z.string().min(1, 'Select your academic year'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
  universityId: z.string().min(8, 'Use your university ID'),
  idCardImage: z.any().refine((files) => files?.length === 1, 'University ID image is required'),
});

type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  useRedirectAuthenticated();

  async function onSubmit(values: Values) {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('email', values.email);
    formData.append('phoneNumber', values.phoneNumber);
    formData.append('college', values.college);
    formData.append('academicYear', values.academicYear);
    formData.append('password', values.password);
    formData.append('universityId', values.universityId);
    formData.append('idCardImage', values.idCardImage[0]);

    setLoading(true);
    try {
      await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const supabaseResult = await signUpWithEmail({
        name: values.name,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        college: values.college,
        academicYear: values.academicYear,
        universityId: values.universityId,
      });

      if (supabaseResult.error) {
        throw supabaseResult.error;
      }

      toast({
        variant: 'success',
        title: t('auth.register'),
        description: t('errors.verificationSubmitted'),
      });
      router.push('/pending-approval');
    } catch (error: any) {
      toast({
        variant: 'error',
        title: t('errors.registrationFailed'),
        description: error?.message || error?.response?.data?.message || t('errors.tryAgainLater'),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-2xl rounded-lg border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-slate-950/40">
        <div className="mb-6">
          <p className="text-sm font-medium text-cyan-200">{t('auth.registrationTitle')}</p>
          <h1 className="mt-2 text-3xl font-semibold">{t('auth.registrationHeader')}</h1>
        </div>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormLabel htmlFor="name">{t('auth.fullName')}</FormLabel>
            <Input id="name" placeholder={t('auth.fullName')} {...register('name')} />
            {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="email">{t('auth.universityEmail')}</FormLabel>
            <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} {...register('email')} />
            {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="phoneNumber">{t('auth.phoneNumber')}</FormLabel>
            <Input id="phoneNumber" type="tel" placeholder="+20 123 4567890" {...register('phoneNumber')} />
            {errors.phoneNumber && <FormMessage>{errors.phoneNumber.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="password">{t('auth.password')}</FormLabel>
            <Input id="password" type="password" placeholder={t('auth.passwordPlaceholder')} {...register('password')} />
            {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="college">{t('auth.college')}</FormLabel>
            <Input id="college" placeholder={t('auth.college')} {...register('college')} />
            {errors.college && <FormMessage>{errors.college.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="academicYear">{t('auth.academicYear')}</FormLabel>
            <Input id="academicYear" placeholder={t('auth.academicYear')} {...register('academicYear')} />
            {errors.academicYear && <FormMessage>{errors.academicYear.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="universityId">{t('auth.universityId')}</FormLabel>
            <Input id="universityId" placeholder={t('auth.universityId')} {...register('universityId')} />
            {errors.universityId && <FormMessage>{errors.universityId.message}</FormMessage>}
          </FormField>
          <FormField className="sm:col-span-2">
            <FormLabel htmlFor="idCardImage" className="flex items-center gap-2"><Upload className="h-4 w-4" /> {t('auth.idCardImage')}</FormLabel>
            <Input id="idCardImage" type="file" accept="image/png,image/jpeg" {...register('idCardImage')} />
            {errors.idCardImage && <FormMessage>{String(errors.idCardImage.message)}</FormMessage>}
          </FormField>
          <Button type="submit" className="gap-2 sm:col-span-2" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? t('auth.submitting') : t('auth.register')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          {t('auth.alreadyRegistered')} <Link href="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">{t('auth.login')}</Link>
        </p>
      </section>
    </main>
  );
}
