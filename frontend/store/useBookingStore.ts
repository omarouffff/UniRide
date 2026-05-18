'use client';

import { create } from 'zustand';

interface BookingSummary {
  id: string;
  route: string;
  travelDate: string;
  status: 'confirmed' | 'waiting' | 'cancelled';
  seat?: string | null;
}

interface BookingState {
  bookings: BookingSummary[];
  setBookings: (b: BookingSummary[]) => void;
  addBooking: (b: BookingSummary) => void;
  updateBooking: (id: string, patch: Partial<BookingSummary>) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  setBookings: (b) => set({ bookings: b }),
  addBooking: (b) => set((s) => ({ bookings: [b, ...s.bookings] })),
  updateBooking: (id, patch) => set((s) => ({ bookings: s.bookings.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
}));

export default useBookingStore;
