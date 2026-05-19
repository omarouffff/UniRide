'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { 
  Users, 
  Search, 
  CheckCircle, 
  MapPin, 
  BookOpen, 
  RefreshCw, 
  AlertCircle,
  Clock,
  Bus
} from 'lucide-react';

interface Passenger {
  id: string;
  route: string;
  pickupPoint: string;
  destination: string;
  travelDate: string;
  seat: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    universityId: string;
  } | null;
  boarded?: boolean;
}

export default function PassengerListPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('');

  const loadManifest = async () => {
    setLoading(true);
    try {
      const response = await api.get('/driver/bookings');
      // Enforce default non-boarded state locally
      const mapped = (response.data.bookings || []).map((b: any) => ({
        ...b,
        boarded: false
      }));
      setBookings(mapped);
    } catch (err) {
      console.error('Error fetching manifest:', err);
      toast({
        variant: 'error',
        title: 'Manifest error',
        description: 'Failed to retrieve passenger boarding manifest.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManifest();
  }, []);

  const handleManualCheckIn = async (bookingId: string, passengerName: string) => {
    try {
      await api.post('/driver/manual-board', { bookingId });
      
      // Update passenger status locally in state
      setBookings((current) =>
        current.map((b) => (b.id === bookingId ? { ...b, boarded: true } : b))
      );

      // Trigger vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100]);
      }

      toast({
        variant: 'success',
        title: 'Check-in confirmed',
        description: `${passengerName} has been checked in manually!`
      });
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Check-in failed',
        description: err?.response?.data?.message || 'Could not verify booking check-in.'
      });
    }
  };

  // Filter passengers based on search and route
  const filteredBookings = bookings.filter((b) => {
    const nameMatch = b.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const idMatch = b.user?.universityId.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const routeMatch = filterRoute ? b.route === filterRoute : true;
    return (nameMatch || idMatch) && routeMatch;
  });

  // Get unique routes from bookings for filters
  const uniqueRoutes = Array.from(new Set(bookings.map((b) => b.route)));

  const remainingCount = bookings.filter((b) => !b.boarded).length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Upper Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-8 h-8 text-blue-400 bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20" />
              Passenger Manifest
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Boarding manifest and active seat roster sheet</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadManifest}
            disabled={loading}
            className="border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 self-start sm:self-center rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Manifest
          </Button>
        </div>

        {/* Dashboard metrics header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/40 border-slate-800/80 p-4 rounded-xl backdrop-blur-md">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining Passengers</div>
            <div className="text-2xl font-black text-white mt-1">{loading ? '...' : remainingCount}</div>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800/80 p-4 rounded-xl backdrop-blur-md">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Booked</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{loading ? '...' : bookings.length}</div>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800/80 p-4 rounded-xl backdrop-blur-md">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Boarded Checked In</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {loading ? '...' : bookings.filter(b => b.boarded).length}
            </div>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800/80 p-4 rounded-xl backdrop-blur-md">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unique Routes</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{loading ? '...' : uniqueRoutes.length}</div>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
          {/* Search inputs */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
            <Input
              placeholder="Search passenger name or university ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:border-transparent rounded-lg"
            />
          </div>

          {/* Route dropdowns */}
          <div className="w-full md:w-60">
            <select
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
              className="w-full h-[42px] bg-slate-950 border border-slate-800 rounded-lg px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/45 transition-colors"
            >
              <option value="">All Routes ({uniqueRoutes.length})</option>
              {uniqueRoutes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PASSENGER CARD ROSTER GRID */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-slate-900/30 border border-slate-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const studentName = b.user?.name || 'Unknown Passenger';
              const isCheckedIn = b.boarded;

              return (
                <Card 
                  key={b.id} 
                  className={`bg-slate-900/40 border p-4.5 rounded-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300 ${
                    isCheckedIn 
                      ? 'border-emerald-500/20 bg-emerald-500/5' 
                      : 'border-slate-800/80 hover:border-slate-700/60'
                  }`}
                >
                  {/* Subtle check in background glows */}
                  {isCheckedIn && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    
                    {/* User profile info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">{studentName}</span>
                        {b.seat && (
                          <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">
                            Seat {b.seat}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium text-slate-300">
                          ID: {b.user?.universityId || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {b.route}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(b.travelDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="self-end sm:self-center">
                      {isCheckedIn ? (
                        <div className="text-emerald-400 font-semibold text-sm flex items-center gap-1 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                          <CheckCircle className="h-4 w-4" />
                          Boarded Successfully
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleManualCheckIn(b.id, studentName)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-5 py-2 text-sm shadow-md transition-all hover:scale-[1.01]"
                        >
                          Manual Board Check
                        </Button>
                      )}
                    </div>

                  </div>
                </Card>
              );
            })}

            {filteredBookings.length === 0 && (
              <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                <BookOpen className="w-12 h-12 mx-auto opacity-30 text-slate-600 mb-3" />
                <h3 className="font-semibold text-slate-400 text-lg">No passengers matched search</h3>
                <p className="text-sm text-slate-500 mt-1">Try modifying your query terms or route filter settings.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
