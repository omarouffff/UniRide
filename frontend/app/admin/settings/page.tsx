'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Sparkles,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

interface PlatformSettings {
  ticketPrice: number;
  penaltyLimit: number;
  cancelDeadlineHours: number;
  autoPromoteSeat: boolean;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<PlatformSettings>({
    ticketPrice: 50,
    penaltyLimit: 3,
    cancelDeadlineHours: 2,
    autoPromoteSeat: true
  });

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await api.get('/admin/settings');
        if (response.data.settings) {
          setSettings(response.data.settings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        toast({
          variant: 'error',
          title: 'Config fetch failed',
          description: 'Failed to retrieve active platform parameters.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.put('/admin/settings', settings);
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
      toast({
        variant: 'success',
        title: 'Settings updated',
        description: 'Global system parameters updated successfully.'
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      toast({
        variant: 'error',
        title: 'Update failed',
        description: 'Could not synchronize setting modifications.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAutoPromote = () => {
    setSettings((current) => ({
      ...current,
      autoPromoteSeat: !current.autoPromoteSeat
    }));
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mx-auto max-w-3xl space-y-6">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push('/admin')}
              className="border-slate-800 bg-slate-900 text-slate-400 hover:text-white rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Settings className="w-8 h-8 text-cyan-400 bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20" />
                Platform Settings
              </h1>
              <p className="text-slate-400 text-sm mt-1">Configure transport pricing, safety thresholds, and waitlist routines</p>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="p-8 border border-slate-800 bg-slate-900/20 animate-pulse space-y-6 rounded-2xl">
            <div className="h-6 w-1/4 bg-slate-800 rounded" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-800 rounded w-full" />
              ))}
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Price & Penalty configurations */}
            <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ShieldCheck className="w-24 h-24 text-cyan-400" />
              </div>

              <h2 className="text-xl font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/60">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Global Controls
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                
                {/* 1. Ticket Fare */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Standard Ticket Fare (EGP)
                  </label>
                  <Input 
                    type="number"
                    value={settings.ticketPrice}
                    onChange={(e) => setSettings({ ...settings, ticketPrice: Math.max(1, Number(e.target.value)) })}
                    className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl"
                    min="1"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">Default fare applied to new passenger reservations</span>
                </div>

                {/* 2. Cancellation Deadline */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Cancellation Grace Window (Hours)
                  </label>
                  <Input 
                    type="number"
                    value={settings.cancelDeadlineHours}
                    onChange={(e) => setSettings({ ...settings, cancelDeadlineHours: Math.max(1, Number(e.target.value)) })}
                    className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl"
                    min="1"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">Hours prior to departure where bookings become locked</span>
                </div>

                {/* 3. No-Show Penalty Caps */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    No-Show Penalty Threshold
                  </label>
                  <Input 
                    type="number"
                    value={settings.penaltyLimit}
                    onChange={(e) => setSettings({ ...settings, penaltyLimit: Math.max(1, Number(e.target.value)) })}
                    className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl"
                    min="1"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">Max passenger no-shows before accounts get auto-suspended</span>
                </div>

                {/* 4. Automatic promotions */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Auto Promote Waitlist Seats
                  </label>
                  
                  <div className="flex items-center justify-between h-[42px] px-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-medium">Waitlist Seat Promotion</span>
                    <button
                      type="button"
                      onClick={handleToggleAutoPromote}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {settings.autoPromoteSeat ? (
                        <ToggleRight className="w-7 h-7 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-600" />
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Promotes waitlisted students automatically when seats vacate</span>
                </div>

              </div>

            </Card>

            {/* Platform rules details card */}
            <Card className="bg-slate-900/20 border-slate-800 p-5 rounded-2xl flex gap-3.5 text-xs text-slate-400">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-white">System Policy Enforcement</h4>
                <p>
                  Any alterations saved here reflect in real-time across student checkouts, 
                  driver boarding manifests, and automated background jobs running in the cloud.
                </p>
              </div>
            </Card>

            {/* Save Buttons bar */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin')}
                className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl px-5"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl px-6 shadow-md shadow-cyan-950/20 flex items-center gap-1.5"
                disabled={submitting}
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>

          </form>
        )}

      </div>
    </main>
  );
}
