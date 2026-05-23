'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

interface VerifyFormValues {
  universityIdImage: FileList;
}

export default function VerifyUniversityIdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<VerifyFormValues>();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [router, user]);

  async function onSubmit(values: VerifyFormValues) {
    if (!values.universityIdImage || values.universityIdImage.length === 0) {
      toast({ variant: 'error', title: 'Image missing', description: 'Please upload your university ID image.' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('universityIdImage', values.universityIdImage[0]);

    try {
      await api.post('/auth/verify-university-id', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSubmitted(true);
      toast({ variant: 'success', title: 'Verification submitted', description: 'Your student ID is now under review.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'error', title: 'Upload failed', description: 'Could not submit the ID image. Try again later.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/50">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">University ID verification</p>
          <h1 className="text-3xl font-semibold text-white">Upload your university ID</h1>
          <p className="text-sm text-slate-400">
            Submit a clear photo of your student card to verify your account and unlock booking privileges.
          </p>
          {user ? (
            <p className="text-sm text-slate-500">Signed in as <span className="font-semibold text-white">{user.email}</span>.</p>
          ) : null}
        </div>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <FormField>
            <FormLabel htmlFor="universityIdImage">Student card image</FormLabel>
            <Input
              id="universityIdImage"
              type="file"
              accept="image/png, image/jpeg"
              {...register('universityIdImage', { required: true })}
            />
            {errors.universityIdImage && <FormMessage>Student ID image is required.</FormMessage>}
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Uploading...' : 'Submit for verification'}
          </Button>
        </form>
        {submitted ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-800/80 p-4 text-slate-200">
            <p className="font-medium text-white">Verification request submitted.</p>
            <p className="text-sm text-slate-400">You will receive confirmation once the admin approves your university ID.</p>
          </div>
        ) : null}
        <p className="mt-6 text-center text-sm text-slate-400">
          Already completed verification?{' '}
          <Link href="/dashboard" className="font-semibold text-indigo-300 hover:text-indigo-200">
            Go to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
