'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Bus, 
  Users, 
  Calendar, 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  FileText,
  Percent,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'driver';
  createdAt: string;
  status: string;
}

interface Booking {
  _id: string;
  user: { name: string; email: string; universityId: string } | null;
  trip: { title: string; busNumber: string; pickupPoint: string; destination: string } | null;
  route: string;
  status: 'confirmed' | 'waiting' | 'cancelled';
  travelDate: string;
  boardedAt?: string;
  noShow?: boolean;
}

interface Trip {
  _id: string;
  title: string;
  pickupPoint: string;
  destination: string;
  busNumber: string;
  capacity: number;
  confirmedCount?: number;
  departureTime: string;
  driver?: { name: string };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [bookRes, userRes, tripRes] = await Promise.all([
          api.get('/admin/bookings'),
          api.get('/admin/users'),
          api.get('/admin/trips')
        ]);
        setBookings(bookRes.data.bookings || []);
        setUsersList(userRes.data.users || []);
        setTrips(tripRes.data.trips || []);
      } catch (err) {
        console.error('Error fetching reports data:', err);
        toast({
          variant: 'error',
          title: 'Reports load failure',
          description: 'Failed to retrieve operation manifests and analytics data.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, router, toast]);

  // Metric aggregates
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const boardedCount = bookings.filter(b => b.boardedAt).length;
    const noShowCount = bookings.filter(b => b.noShow).length;
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;

    // Boarding rate calculation
    const boardingRate = confirmedCount > 0 
      ? Math.round((boardedCount / confirmedCount) * 100) 
      : 0;

    return {
      totalBookings,
      boardedCount,
      noShowCount,
      confirmedCount,
      boardingRate
    };
  }, [bookings]);

  // Busy routes chart aggregation (Number of bookings per route)
  const routeStats = useMemo(() => {
    const counts: { [key: string]: { confirmed: number; waiting: number } } = {};
    
    bookings.forEach((b) => {
      const routeName = b.route || `${b.trip?.pickupPoint || 'Main'} ➔ ${b.trip?.destination || 'Campus'}`;
      if (!counts[routeName]) {
        counts[routeName] = { confirmed: 0, waiting: 0 };
      }
      if (b.status === 'confirmed') counts[routeName].confirmed += 1;
      if (b.status === 'waiting') counts[routeName].waiting += 1;
    });

    return Object.keys(counts).map((route) => ({
      Route: route.length > 22 ? route.substring(0, 20) + '...' : route,
      Confirmed: counts[route].confirmed,
      Waiting: counts[route].waiting
    })).sort((a, b) => (b.Confirmed + b.Waiting) - (a.Confirmed + a.Waiting)).slice(0, 5);
  }, [bookings]);

  // Peak travel hours aggregation (group by travel time hours)
  const peakHoursStats = useMemo(() => {
    const hourlyCounts = Array(24).fill(0);
    
    bookings.forEach((b) => {
      if (!b.travelDate) return;
      const hour = new Date(b.travelDate).getHours();
      if (hour >= 0 && hour < 24) {
        hourlyCounts[hour] += 1;
      }
    });

    return hourlyCounts.map((count, hr) => ({
      hour: `${hr.toString().padStart(2, '0')}:00`,
      Bookings: count
    })).filter(h => h.Bookings > 0); // Only return active hours
  }, [bookings]);

  // Registration velocities aggregation (number of users signed up per day)
  const registrationVelocity = useMemo(() => {
    const dayGroups: { [key: string]: number } = {};
    
    // Sort oldest to newest
    [...usersList].reverse().forEach((u) => {
      const day = new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      dayGroups[day] = (dayGroups[day] || 0) + 1;
    });

    // Compute cumulative sum
    let cumulative = 0;
    return Object.keys(dayGroups).map((day) => {
      cumulative += dayGroups[day];
      return {
        Date: day,
        'Daily Registrations': dayGroups[day],
        'Total Users': cumulative
      };
    }).slice(-7); // Last 7 days
  }, [usersList]);

  // Boarding status breakdown pie chart
  const boardingDistribution = useMemo(() => {
    const boarded = bookings.filter(b => b.boardedAt).length;
    const remainingConfirmed = bookings.filter(b => b.status === 'confirmed' && !b.boardedAt).length;
    const waiting = bookings.filter(b => b.status === 'waiting').length;

    return [
      { name: 'Checked In', value: boarded, color: '#10b981' },
      { name: 'Pending Board', value: remainingConfirmed, color: '#3b82f6' },
      { name: 'Waiting List', value: waiting, color: '#a855f7' }
    ];
  }, [bookings]);

  // CSV Export utility
  const exportOperationalReport = () => {
    try {
      const headers = ['Route', 'Passenger Name', 'Passenger Email', 'University ID', 'Boarding Status', 'Check-In Timestamp', 'Travel Date'];
      const rows = bookings.map((b) => [
        b.route || 'N/A',
        b.user?.name || 'N/A',
        b.user?.email || 'N/A',
        b.user?.universityId || 'N/A',
        b.boardedAt ? 'Boarded' : b.status,
        b.boardedAt ? new Date(b.boardedAt).toLocaleString() : 'N/A',
        new Date(b.travelDate).toLocaleString()
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `UniRide_Operational_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        variant: 'success',
        title: 'Export successful',
        description: 'CSV operational report has been downloaded.'
      });
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Export failed',
        description: 'Failed to generate operational report.'
      });
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
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
                <BarChart3 className="w-8 h-8 text-blue-400 bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20" />
                Operational Reports
              </h1>
              <p className="text-slate-400 text-sm mt-1">Passenger efficiency logs, boarding statistics, and fleet occupancy analytics</p>
            </div>
          </div>

          <Button 
            onClick={exportOperationalReport}
            disabled={bookings.length === 0}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-950/20 self-start sm:self-center"
          >
            <FileText className="w-4 h-4" />
            Export Operational Log
          </Button>
        </div>

        {/* Operational Grid Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              label: 'Total Rides Booked', 
              value: stats.totalBookings, 
              desc: 'Overall schedule bookings',
              icon: <Calendar className="w-5 h-5 text-blue-400" />
            },
            { 
              label: 'Riders Checked In', 
              value: stats.boardedCount, 
              desc: 'Camera scanned passengers',
              icon: <CheckCircle className="w-5 h-5 text-emerald-400" />
            },
            { 
              label: 'Scanned Boarding Rate', 
              value: `${stats.boardingRate}%`, 
              desc: 'Boarded vs Confirmed seats',
              icon: <Percent className="w-5 h-5 text-indigo-400" />
            },
            { 
              label: 'Fleet Size in Service', 
              value: trips.length, 
              desc: 'Active trip schedules today',
              icon: <Bus className="w-5 h-5 text-purple-400" />
            }
          ].map((item, idx) => (
            <Card key={idx} className="bg-slate-900/40 border-slate-800/80 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                {item.icon}
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
                <span className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">{item.icon}</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{loading ? '...' : item.value}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
              </div>
            </Card>
          ))}
        </section>

        {/* Recharts Analytics Blocks */}
        {isMounted && (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
            
            {/* Route load factor: busy routes */}
            <Card className="bg-slate-900/40 border-slate-800/80 p-6 rounded-2xl backdrop-blur-md lg:col-span-8 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-blue-400" />
                  Route Load Density
                </h2>
                <p className="text-xs text-slate-500 mb-6">Five busiest university transport vectors</p>
              </div>
              <div className="h-64 w-full">
                {routeStats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No load density records.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={routeStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="Route" stroke="#475569" fontSize={10} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      <Bar dataKey="Confirmed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Waiting" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Boarding status distribution */}
            <Card className="bg-slate-900/40 border-slate-800/80 p-6 rounded-2xl backdrop-blur-md lg:col-span-4 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Boarding State Splits
                </h2>
                <p className="text-xs text-slate-500 mb-4">Boarding progress of registered manifest slots</p>
              </div>
              
              <div className="h-44 flex items-center justify-center relative">
                {boardingDistribution.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
                  <div className="text-slate-500 text-sm">No passenger boarding records.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={boardingDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {boardingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="absolute text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Total Rides</span>
                  <span className="text-lg font-black text-white">
                    {boardingDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="space-y-2 mt-4">
                {boardingDistribution.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-200">{item.value} bookings</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Peak operational hours line chart */}
            <Card className="bg-slate-900/40 border-slate-800/80 p-6 rounded-2xl backdrop-blur-md lg:col-span-6 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Peak Booking Hours
                </h2>
                <p className="text-xs text-slate-500 mb-6">Booking creation density categorized by hour</p>
              </div>
              <div className="h-60 w-full">
                {peakHoursStats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No hourly peak stats.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={peakHoursStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="hour" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                      />
                      <Line type="monotone" dataKey="Bookings" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* User Registration velocity */}
            <Card className="bg-slate-900/40 border-slate-800/80 p-6 rounded-2xl backdrop-blur-md lg:col-span-6 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-400" />
                  Registration Velocity
                </h2>
                <p className="text-xs text-slate-500 mb-6">UniRide system subscriber signup velocities</p>
              </div>
              <div className="h-60 w-full">
                {registrationVelocity.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No signup velocity records.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationVelocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="Date" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                      />
                      <Area type="monotone" dataKey="Total Users" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

          </section>
        )}

        {/* Trips Seat Manifest list */}
        <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bus className="w-5.5 h-5.5 text-blue-400" />
              Occupancy Manifest
            </h2>
            <p className="text-xs text-slate-500 mt-1">Bus capacity configurations and load factor indices</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-slate-900/30 border border-slate-800 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="pb-3 pl-2">Trip Title</th>
                    <th className="pb-3">Bus Details</th>
                    <th className="pb-3">Route Vector</th>
                    <th className="pb-3">Booked Occupancy</th>
                    <th className="pb-3">Fill Index</th>
                    <th className="pb-3 text-right pr-2">Schedule Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {trips.map((t) => {
                    const booked = t.confirmedCount ?? 0;
                    const pct = t.capacity > 0 ? Math.round((booked / t.capacity) * 100) : 0;
                    
                    return (
                      <tr key={t._id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="py-4 pl-2 font-bold text-slate-200">{t.title}</td>
                        <td className="py-4 text-slate-400 font-mono">
                          <div>{t.busNumber}</div>
                          {t.driver && <div className="text-[10px] text-slate-500 mt-0.5">Driver: {t.driver.name}</div>}
                        </td>
                        <td className="py-4 text-slate-300">{t.pickupPoint} ➔ {t.destination}</td>
                        <td className="py-4 font-semibold text-slate-300">
                          {booked} / {t.capacity} seats
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  pct > 85 ? 'bg-rose-500' : pct > 50 ? 'bg-blue-500' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-300 text-[11px] shrink-0">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-4 text-right pr-2 text-slate-400 font-medium">
                          {new Date(t.departureTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}

                  {trips.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No active fleet schedules configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
