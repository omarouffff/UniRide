'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, UserPlus } from 'lucide-react';
import * as z from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';

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
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

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
      await api.post('/auth/register', formData);
      toast({ variant: 'success', title: 'Registration submitted', description: 'Your account is pending admin approval.' });
      router.push('/pending-approval');
    } catch (error: any) {
      toast({ variant: 'error', title: 'Registration failed', description: error?.response?.data?.message || 'Please review your data.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-2xl rounded-lg border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-slate-950/40">
        <div className="mb-6">
          <p className="text-sm font-medium text-cyan-200">Student registration</p>
          <h1 className="mt-2 text-3xl font-semibold">Create your UniRide account</h1>
        </div>
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormLabel htmlFor="name">Full name</FormLabel>
            <Input id="name" placeholder="Jane Doe" {...register('name')} />
            {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="email">University email</FormLabel>
            <Input id="email" type="email" placeholder="student@university.edu" {...register('email')} />
            {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="phoneNumber">Phone number</FormLabel>
            <Input id="phoneNumber" type="tel" placeholder="+20 123 4567890" {...register('phoneNumber')} />
            {errors.phoneNumber && <FormMessage>{errors.phoneNumber.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input id="password" type="password" placeholder="Minimum 8 characters" {...register('password')} />
            {errors.password && <FormMessage>{errors.password.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="college">College</FormLabel>
            <Input id="college" placeholder="Engineering" {...register('college')} />
            {errors.college && <FormMessage>{errors.college.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="academicYear">Academic year</FormLabel>
            <Input id="academicYear" placeholder="Year 3" {...register('academicYear')} />
            {errors.academicYear && <FormMessage>{errors.academicYear.message}</FormMessage>}
          </FormField>
          <FormField>
            <FormLabel htmlFor="universityId">University ID</FormLabel>
            <Input id="universityId" placeholder="2026001234" {...register('universityId')} />
            {errors.universityId && <FormMessage>{errors.universityId.message}</FormMessage>}
          </FormField>
          <FormField className="sm:col-span-2">
            <FormLabel htmlFor="idCardImage" className="flex items-center gap-2"><Upload className="h-4 w-4" /> University ID image</FormLabel>
            <Input id="idCardImage" type="file" accept="image/png,image/jpeg" {...register('idCardImage')} />
            {errors.idCardImage && <FormMessage>{String(errors.idCardImage.message)}</FormMessage>}
          </FormField>
          <Button type="submit" className="gap-2 sm:col-span-2" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? 'Submitting...' : 'Register'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered? <Link href="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">Login</Link>
        </p>
      </section>
    </main>
  );
}
