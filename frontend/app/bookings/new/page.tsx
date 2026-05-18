'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

const bookingSchema = z.object({
  pickupPoint: z.string().min(3, 'Enter a pickup point'),
  destination: z.string().min(3, 'Enter a destination'),
  travelDate: z.string().min(10, 'Select a date'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function NewBookingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({ resolver: zodResolver(bookingSchema) });

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [router, user]);

  async function onSubmit(values: BookingFormValues) {
    setLoading(true);
    try {
      await api.post('/bookings', values);
      toast({ variant: 'success', title: 'Booking created', description: 'Your ride has been added to the system.' });
      router.push('/bookings');
    } catch (error) {
      console.error(error);
      toast({ variant: 'error', title: 'Booking failed', description: 'Unable to schedule the ride. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/30">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Book a ride</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Reserve your campus shuttle</h1>
            <p className="mt-2 text-slate-400">Choose your pickup and destination to join the waiting queue or confirm a seat.</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <FormField>
              <FormLabel htmlFor="pickupPoint">Pickup point</FormLabel>
              <Input id="pickupPoint" placeholder="Library entrance" {...register('pickupPoint')} />
              {errors.pickupPoint && <FormMessage>{errors.pickupPoint.message}</FormMessage>}
            </FormField>
            <FormField>
              <FormLabel htmlFor="destination">Destination</FormLabel>
              <Input id="destination" placeholder="Campus bus stop" {...register('destination')} />
              {errors.destination && <FormMessage>{errors.destination.message}</FormMessage>}
            </FormField>
            <FormField>
              <FormLabel htmlFor="travelDate">Travel date</FormLabel>
              <Input id="travelDate" type="date" {...register('travelDate')} />
              {errors.travelDate && <FormMessage>{errors.travelDate.message}</FormMessage>}
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Confirm booking'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
