'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  Calendar, 
  ArrowRight, 
  Info,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
  actionUrl?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [socketConnected, setSocketConnected] = useState(false);

  // Load persistent notifications from local storage on mount
  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    const saved = localStorage.getItem(`uniride_notifications_${user.id}`);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (err) {
        console.error('Error parsing notifications:', err);
      }
    }
  }, [user, router]);

  // Connect to Socket.io for real-time updates
  useEffect(() => {
    if (!user) return;

    // Resolve socket server URL from api client base path
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const socketHost = apiBase.replace('/api', '');

    const socket = io(socketHost, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      // Join user-specific socket channel
      socket.emit('subscribe', { userId: user.id });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Listen to real-time booking transitions
    socket.on('bookingUpdate', (data: any) => {
      // Build visual notification card
      const newNotification: NotificationItem = {
        id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: data.status === 'confirmed' ? 'Seat Booking Confirmed!' : 'Booking Status Shift',
        message: data.status === 'confirmed' 
          ? `Your seat request was approved! Assigned Seat: ${data.seat || 'Automatic'}. Direct check-in QR code is ready.`
          : `Your booking was updated. Current Status: ${data.status.toUpperCase()}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: data.status === 'confirmed' ? 'success' : 'info',
        actionUrl: '/my-trips'
      };

      setNotifications((current) => {
        const updated = [newNotification, ...current];
        localStorage.setItem(`uniride_notifications_${user.id}`, JSON.stringify(updated));
        return updated;
      });

      // Browser Web Audio Beeper for dynamic alerting
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (err) {
        console.warn('Audio feedback failed:', err);
      }

      toast({
        variant: 'success',
        title: newNotification.title,
        description: newNotification.message
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, toast]);

  // Mark specific notification as read
  const markAsRead = (id: string) => {
    if (!user) return;
    setNotifications((current) => {
      const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(`uniride_notifications_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    if (!user || notifications.length === 0) return;
    setNotifications((current) => {
      const updated = current.map((n) => ({ ...n, read: true }));
      localStorage.setItem(`uniride_notifications_${user.id}`, JSON.stringify(updated));
      return updated;
    });
    toast({
      variant: 'success',
      title: 'Ledger updated',
      description: 'Marked all active notifications as read.'
    });
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    if (!user || notifications.length === 0) return;
    if (!window.confirm('Delete all notification logs?')) return;
    
    setNotifications([]);
    localStorage.removeItem(`uniride_notifications_${user.id}`);
    toast({
      variant: 'success',
      title: 'Inbox cleared',
      description: 'Successfully removed all notification logs.'
    });
  };

  const filteredNotifications = notifications.filter((n) => 
    activeTab === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Bell className="w-8 h-8 text-cyan-400 bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-[10px] bg-cyan-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Real-time alerts, trip state shifts, and transaction confirmations</p>
          </div>

          <div className="flex gap-2 self-start sm:self-center">
            {notifications.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark All Read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllNotifications}
                  className="border-slate-850 hover:bg-rose-950/20 hover:border-rose-900/50 text-slate-400 hover:text-rose-300 rounded-xl flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Socket Status and Filter toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-1.5 px-4 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'all' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`py-1.5 px-4 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'unread' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
            {socketConnected ? 'Real-Time Sync Connected' : 'Sync Disconnected'}
          </div>
        </div>

        {/* Notifications list */}
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isSuccess = n.type === 'success';
            const isWarning = n.type === 'warning';

            return (
              <Card 
                key={n.id} 
                className={`bg-slate-900/40 border p-4.5 rounded-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300 ${
                  !n.read 
                    ? 'border-cyan-500/20 bg-cyan-500/[0.02]' 
                    : 'border-slate-800/80 hover:border-slate-700/60'
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon indicator */}
                  <div className="mt-0.5 shrink-0">
                    {isSuccess ? (
                      <CheckCircle className="w-5.5 h-5.5 text-emerald-400 bg-emerald-500/10 p-1 rounded-lg border border-emerald-500/20" />
                    ) : isWarning ? (
                      <AlertCircle className="w-5.5 h-5.5 text-rose-400 bg-rose-500/10 p-1 rounded-lg border border-rose-500/20" />
                    ) : (
                      <Info className="w-5.5 h-5.5 text-blue-400 bg-blue-500/10 p-1 rounded-lg border border-blue-500/20" />
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-white text-base leading-snug">{n.title}</h4>
                      <span className="text-[10px] text-slate-500 font-medium shrink-0">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{n.message}</p>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2.5 border-t border-slate-900/50 mt-1.5 text-xs">
                      {/* Left: action link */}
                      {n.actionUrl ? (
                        <button 
                          onClick={() => {
                            markAsRead(n.id);
                            router.push((n.actionUrl || '/my-trips') as any);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline"
                        >
                          View Boarding QR
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div />
                      )}

                      {/* Right: mark single read */}
                      {!n.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(n.id)}
                          className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-3 rounded-lg"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>

                  </div>
                </div>
              </Card>
            );
          })}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
              <HelpCircle className="w-12 h-12 mx-auto opacity-30 text-slate-650 mb-3" />
              <h3 className="font-semibold text-slate-400 text-lg">Your notifications box is clear</h3>
              <p className="text-sm text-slate-500 mt-1">Real-time notifications arrive automatically when booking adjustments happen.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
