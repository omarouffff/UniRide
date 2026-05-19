'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  QrCode, 
  XCircle, 
  Compass, 
  ArrowRight,
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface Booking {
  _id: string;
  id?: string;
  route: string;
  pickupPoint: string;
  destination: string;
  travelDate: string;
  status: 'confirmed' | 'waiting' | 'cancelled';
  seat?: string;
  waitingPosition?: number;
  qrPayload?: string;
}

export default function MyTripsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // QR modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    const loadBookings = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/bookings');
        setBookings(data.bookings || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [router, user]);

  const cancelTrip = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setBookings((current) => 
        current.map((item) => ((item._id || item.id) === id ? { ...item, status: 'cancelled' } : item))
      );
      toast({ 
        variant: 'success', 
        title: 'Trip Cancelled', 
        description: 'Your booking has been cancelled and seat released.' 
      });
    } catch (error: any) {
      toast({ 
        variant: 'error', 
        title: 'Cancellation failed', 
        description: error?.response?.data?.message || 'Cannot cancel inside the 1-hour departure lock.' 
      });
    }
  };

  if (!user) return null;

  const now = new Date();
  
  const upcomingTrips = bookings.filter(b => new Date(b.travelDate) >= now && b.status !== 'cancelled');
  const pastTrips = bookings.filter(b => new Date(b.travelDate) < now || b.status === 'cancelled');

  const shownBookings = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-8 h-8 text-blue-400 bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20" />
              My Travel Timeline
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Review, track, and board your scheduled trips</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/booking')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 rounded-xl shadow-lg shadow-blue-900/20"
            >
              Book New Ride
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/payment')}
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white"
            >
              Pay Tickets
            </Button>
          </div>
        </div>

        {/* Tab switch bar */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 max-w-sm">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'upcoming' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upcoming Rides ({upcomingTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'past' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            History & Cancelled ({pastTrips.length})
          </button>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-slate-900/40 border border-slate-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {shownBookings.map((b) => {
              const bookingId = b._id || b.id!;
              const isConfirmed = b.status === 'confirmed';
              const isWaiting = b.status === 'waiting';
              const isCancelled = b.status === 'cancelled';

              return (
                <Card 
                  key={bookingId} 
                  className={`bg-slate-900/40 border p-5 rounded-2xl backdrop-blur-md relative overflow-hidden transition-all hover:scale-[1.005] hover:border-slate-700/60 ${
                    isConfirmed 
                      ? 'border-slate-800/80' 
                      : isWaiting 
                      ? 'border-amber-500/20 bg-amber-500/5' 
                      : 'border-slate-900 opacity-60'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent pointer-events-none" />

                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-5">
                    
                    {/* Ride Details info */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] tracking-widest font-extrabold text-blue-400 uppercase">
                          {isConfirmed ? 'Confirmed Seat' : isWaiting ? 'Waitlisted' : 'Cancelled'}
                        </span>
                        <h3 className={`text-xl font-bold text-white mt-1 ${isCancelled ? 'line-through opacity-60' : ''}`}>
                          {b.route || `${b.pickupPoint} ➔ ${b.destination}`}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(b.travelDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(b.travelDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isConfirmed && b.seat && (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Seat {b.seat}
                          </span>
                        )}
                        {isWaiting && b.waitingPosition && (
                          <span className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                            Waitlist Pos: #{b.waitingPosition}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex gap-2 items-center self-end md:self-center">
                      {isConfirmed && b.qrPayload && (
                        <Button
                          onClick={() => {
                            setSelectedBooking(b);
                            setQrModalOpen(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-2 text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
                        >
                          <QrCode className="w-4 h-4" />
                          Show QR Pass
                        </Button>
                      )}
                      
                      {!isCancelled && (
                        <Button
                          variant="outline"
                          onClick={() => cancelTrip(bookingId)}
                          className="border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl px-4"
                        >
                          Cancel Ride
                        </Button>
                      )}
                    </div>

                  </div>
                </Card>
              );
            })}

            {shownBookings.length === 0 && (
              <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                <Compass className="w-12 h-12 mx-auto opacity-30 text-slate-600 mb-3 animate-spin duration-1000" />
                <h3 className="font-semibold text-slate-400 text-lg">No trips found</h3>
                <p className="text-sm text-slate-500 mt-1">There are no rides listed in this tab.</p>
                <Button 
                  onClick={() => router.push('/booking')}
                  className="mt-4 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl"
                >
                  Create Bookings
                </Button>
              </div>
            )}
          </div>
        )}

        {/* QR CODE BOARDING PASS MODAL */}
        {qrModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-sm bg-slate-950 border border-slate-800 p-6 rounded-2xl relative shadow-2xl text-center space-y-6">
              
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Boarding Ticket Pass</h3>
                <p className="text-xs text-slate-400">{selectedBooking.route}</p>
              </div>

              {/* QR Image wrapper */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 w-60 h-60 mx-auto flex items-center justify-center">
                {selectedBooking.qrPayload ? (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(selectedBooking.qrPayload)}`}
                    alt="Boarding QR Code" 
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                )}
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 text-left text-xs text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Passenger Name</span>
                  <span className="font-semibold text-white">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seat Code</span>
                  <span className="font-semibold text-emerald-400">Seat {selectedBooking.seat || 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ride Date</span>
                  <span>{new Date(selectedBooking.travelDate).toLocaleDateString()}</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setQrModalOpen(false);
                  setSelectedBooking(null);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold py-2.5 rounded-xl"
              >
                Close Ticket
              </Button>

            </Card>
          </div>
        )}

      </div>
    </main>
  );
}
