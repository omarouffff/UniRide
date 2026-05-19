'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { 
  CreditCard, 
  Upload, 
  History, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Clock, 
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  
  // Loading & Data states
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Form states
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(50); // Default ticket price
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [iframeUrl, setIframeUrl] = useState<string>('');
  
  // Fetch data on mount
  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [payRes, bookRes] = await Promise.all([
          api.get('/payments/mine'),
          api.get('/bookings/mine')
        ]);
        setPayments(payRes.data.payments || []);
        
        // Filter bookings that could be eligible for payment (active bookings)
        const activeBookings = bookRes.data.bookings || [];
        setBookings(activeBookings);
        
        if (activeBookings.length > 0) {
          setSelectedBookingId(activeBookings[0]._id || activeBookings[0].id);
        }
      } catch (err) {
        console.error('Error fetching payments details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, user]);

  // Online Paymob Initializer
  const handlePaymobInitialize = async () => {
    if (!selectedBookingId) {
      toast({
        variant: 'error',
        title: 'Booking required',
        description: 'Please select a booking to pay for.'
      });
      return;
    }

    setLoading(true);
    setIframeUrl('');
    try {
      const response = await api.post('/payments/paymob/initialize', {
        bookingId: selectedBookingId,
        amount: paymentAmount
      });
      
      const { iframeUrl } = response.data;
      if (iframeUrl) {
        setIframeUrl(iframeUrl);
        toast({
          variant: 'success',
          title: 'Secure checkout ready',
          description: 'Please complete payment using the form below.'
        });
      } else {
        throw new Error('No checkout URL returned.');
      }
    } catch (error: any) {
      toast({
        variant: 'error',
        title: 'Online payment error',
        description: error?.response?.data?.message || 'Failed to initialize Paymob secure checkout.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Proof image submit (Cash/Receipt upload)
  const submitProofPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBookingId) {
      toast({
        variant: 'error',
        title: 'Booking required',
        description: 'Please select a booking to submit receipt for.'
      });
      return;
    }

    const form = new FormData(event.currentTarget);
    form.append('bookingId', selectedBookingId);
    form.append('method', 'cash');

    setLoading(true);
    try {
      const response = await api.post('/payments', form);
      setPayments((current) => [response.data.payment, ...current]);
      toast({ 
        variant: 'success', 
        title: 'Receipt uploaded', 
        description: 'Your cash receipt proof is uploaded and is waiting for admin verification.' 
      });
      event.currentTarget.reset();
      
      // Refresh payments history
      const payRes = await api.get('/payments/mine');
      setPayments(payRes.data.payments || []);
    } catch (error: any) {
      toast({ 
        variant: 'error', 
        title: 'Submission failed', 
        description: error?.response?.data?.message || 'Could not upload payment proof.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const currentBooking = bookings.find(b => (b._id || b.id) === selectedBookingId);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header bar */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20" />
            Ride Payments
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Secure online and offline checkout for UniRide tickets</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* LEFT: PAYMENT FORM PANEL */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent pointer-events-none" />
              
              <h2 className="text-xl font-bold text-white mb-6">Select Ticket & Method</h2>
              
              {/* Form details */}
              <div className="space-y-6">
                
                {/* 1. Pick Booking */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">1. Choose Booking</label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
                  >
                    {bookings.length === 0 ? (
                      <option value="">No active bookings found</option>
                    ) : (
                      bookings.map((b) => (
                        <option key={b._id || b.id} value={b._id || b.id}>
                          {b.route || `${b.pickupPoint} ➔ ${b.destination}`} ({new Date(b.travelDate).toLocaleDateString()}) - {b.status}
                        </option>
                      ))
                    )}
                  </select>

                  {/* Summary of picked booking */}
                  {currentBooking && (
                    <div className="mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">{currentBooking.pickupPoint} ➔ {currentBooking.destination}</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{new Date(currentBooking.travelDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Choose Amount */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">2. Ticket Price (EGP)</label>
                  <Input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(Math.max(1, Number(e.target.value)))}
                    className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    min="1"
                  />
                </div>

                {/* 3. Choose Payment Method Tab */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">3. Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod('card'); setIframeUrl(''); }}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                        paymentMethod === 'card' 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                          : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Instant Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod('cash'); setIframeUrl(''); }}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                        paymentMethod === 'cash' 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                          : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Cash Proof
                    </button>
                  </div>
                </div>

                {/* Tab content area */}
                <div className="pt-4 border-t border-slate-800/80">
                  {paymentMethod === 'card' ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">
                        Pay online instantly and securely via credit card processed by Paymob. 
                        Your seat will be marked as paid and confirmed instantly upon completion.
                      </p>
                      
                      {!iframeUrl && (
                        <Button 
                          onClick={handlePaymobInitialize}
                          disabled={loading || !selectedBookingId}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                          Checkout with Card
                        </Button>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={submitProofPayment} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Upload Receipt Image</label>
                        <Input 
                          type="file" 
                          name="proofImage" 
                          accept="image/png,image/jpeg,image/webp" 
                          className="bg-slate-950 border-slate-800 text-slate-300"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={loading || !selectedBookingId}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Submit Cash Proof
                      </Button>
                    </form>
                  )}
                </div>

              </div>
            </Card>

            {/* IFRAME RENDER CONTAINER */}
            {paymentMethod === 'card' && iframeUrl && (
              <Card className="bg-slate-950 border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-sm font-semibold text-slate-200">Secure Payment Terminal</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    onClick={() => setIframeUrl('')}
                  >
                    Cancel Checkout
                  </Button>
                </div>
                <div className="relative w-full h-[520px] bg-white">
                  <iframe 
                    src={iframeUrl} 
                    className="w-full h-full border-0" 
                    title="Paymob Payment Acceptance Terminal"
                  />
                </div>
              </Card>
            )}

          </div>

          {/* RIGHT: PAYMENTS HISTORY LIST */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-transparent pointer-events-none" />
              
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Payment Log
              </h2>

              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {payments.map((p) => {
                  const isCompleted = p.status === 'completed';
                  const isPending = p.status === 'pending';
                  const isFailed = p.status === 'failed';

                  return (
                    <div 
                      key={p._id || p.id} 
                      className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 flex flex-col justify-between gap-3 hover:border-slate-700/60 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">{p.amount} {p.currency || 'EGP'}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                          isCompleted 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : isPending 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {p.status}
                        </div>
                      </div>

                      {/* Detail / Booking info */}
                      {p.booking && (
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-xs text-slate-400 flex flex-col gap-1">
                          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Reference Trip</span>
                          <span>Route: {p.booking.route}</span>
                          <span>Date: {new Date(p.booking.travelDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-900/60 pt-2 mt-1">
                        <span>Method: {p.method}</span>
                        {p.proofImage && (
                          <a 
                            href={p.proofImage} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Proof
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

                {payments.length === 0 && (
                  <div className="text-center py-8 text-slate-500 flex flex-col items-center justify-center space-y-2">
                    <DollarSign className="w-8 h-8 opacity-40 text-slate-600" />
                    <p className="text-sm">No transaction records found.</p>
                  </div>
                )}
              </div>

            </Card>
          </div>

        </div>

      </div>
    </main>
  );
}
