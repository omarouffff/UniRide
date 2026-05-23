'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  CreditCard, 
  Coins, 
  FileSpreadsheet, 
  ArrowLeft, 
  Check, 
  X, 
  Eye, 
  Calendar,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/toast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface User {
  name: string;
  email: string;
}

interface Booking {
  route: string;
  travelDate: string;
}

interface Payment {
  id: string;
  _id?: string;
  user: User | null;
  booking: Booking | null;
  amount: number;
  currency: string;
  method: 'card' | 'cash' | 'paymob';
  status: 'pending' | 'under_review' | 'completed' | 'failed' | 'refunded';
  reference: string;
  proofImage?: string;
  createdAt: string;
}

interface Analytics {
  bookingsCount: number;
  pendingUsers: number;
  noShowStats: number;
  tripsCount: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  profit: number;
  completedPayments: number;
}

export default function AdminFinancialPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'completed' | 'failed'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'card' | 'cash'>('all');

  // Preview cash proof image state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        const [payRes, analyticRes] = await Promise.all([
          api.get('/admin/payments'),
          api.get('/admin/analytics')
        ]);
        setPayments(payRes.data.payments || []);
        setAnalytics(analyticRes.data);
      } catch (err) {
        console.error('Error fetching financial records:', err);
        toast({
          variant: 'error',
          title: 'Retrieval error',
          description: 'Failed to retrieve administrative financial details.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, router, toast]);

  // Handle cash proof verification
  const handleVerifyPayment = async (paymentId: string, status: 'completed' | 'failed') => {
    try {
      const res = await api.patch(`/admin/payments/${paymentId}/verify`, { status });

      setPayments((current) =>
        current.map((p) => {
          const pid = p.id || p._id;
          return pid === paymentId ? { ...p, status: res.data.payment.status } : p;
        })
      );

      // Refresh analytics to update profit/revenue balances
      const analyticRes = await api.get('/admin/analytics');
      setAnalytics(analyticRes.data);

      toast({
        variant: 'success',
        title: `Payment ${status === 'completed' ? 'Approved' : 'Rejected'}`,
        description: `Successfully updated the cash transaction verification.`
      });
    } catch (err: any) {
      toast({
        variant: 'error',
        title: 'Verification failed',
        description: err?.response?.data?.message || 'Could not update cash proof status.'
      });
    }
  };

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const studentName = p.user?.name.toLowerCase() || '';
      const studentEmail = p.user?.email.toLowerCase() || '';
      const refCode = p.reference?.toLowerCase() || '';
      const search = searchQuery.toLowerCase();

      const nameMatch = studentName.includes(search) || studentEmail.includes(search) || refCode.includes(search);
      const statusMatch = statusFilter === 'all' ? true : p.status === statusFilter;
      const methodMatch = methodFilter === 'all' ? true : 
                          methodFilter === 'card' ? (p.method === 'card' || p.method === 'paymob') : p.method === 'cash';

      return nameMatch && statusMatch && methodMatch;
    });
  }, [payments, searchQuery, statusFilter, methodFilter]);

  // CSV Export utility
  const exportToCSV = () => {
    try {
      const headers = ['Reference ID', 'Student Name', 'Student Email', 'Amount (EGP)', 'Method', 'Status', 'Date'];
      const rows = filteredPayments.map((p) => [
        p.reference || 'N/A',
        p.user?.name || 'N/A',
        p.user?.email || 'N/A',
        p.amount || 0,
        p.method,
        p.status,
        new Date(p.createdAt).toLocaleDateString()
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `UniRide_Financials_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        variant: 'success',
        title: 'Export successful',
        description: 'CSV financial record has been downloaded.'
      });
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Export failed',
        description: 'Failed to generate financial CSV file.'
      });
    }
  };

  // Financial Chart details (Grouped by date)
  const chartData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    // Reverse payments to show oldest to newest left-to-right
    [...payments].reverse().forEach((p) => {
      if (p.status !== 'completed') return;
      const dateStr = new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      groups[dateStr] = (groups[dateStr] || 0) + p.amount;
    });

    return Object.keys(groups).map((key) => ({
      date: key,
      Revenue: groups[key]
    })).slice(-10); // Last 10 active days
  }, [payments]);

  // Cash vs Card breakdown
  const pieData = useMemo(() => {
    let cardSum = 0;
    let cashSum = 0;

    payments.forEach((p) => {
      if (p.status !== 'completed') return;
      if (p.method === 'cash') cashSum += p.amount;
      else cardSum += p.amount;
    });

    return [
      { name: 'Credit Card', value: cardSum, color: '#3b82f6' },
      { name: 'Cash Upload', value: cashSum, color: '#10b981' }
    ];
  }, [payments]);

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
                <DollarSign className="w-8 h-8 text-emerald-400 bg-emerald-500/10 p-1 rounded-lg border border-emerald-500/20" />
                Financial Intelligence
              </h1>
              <p className="text-slate-400 text-sm mt-1">Audit ledgers, transaction timelines, and cash proof validations</p>
            </div>
          </div>

          <Button 
            onClick={exportToCSV}
            disabled={filteredPayments.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/20 self-start sm:self-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV Ledger
          </Button>
        </div>

        {/* Dynamic Financial Overview Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              label: 'Total Revenue Balance', 
              value: `${analytics?.monthlyRevenue ?? 0} EGP`, 
              desc: 'Net earnings collected',
              icon: <DollarSign className="w-5 h-5 text-emerald-400" />
            },
            { 
              label: 'Completed Bookings', 
              value: analytics?.completedPayments ?? 0, 
              desc: 'Paid ride tickets',
              icon: <CheckCircle className="w-5 h-5 text-blue-400" />
            },
            { 
              label: 'Pending Proof Audits', 
              value: payments.filter(p => p.status === 'pending' && p.method === 'cash').length, 
              desc: 'Requires admin attention',
              icon: <Clock className="w-5 h-5 text-amber-400" />
            },
            { 
              label: 'Net Operation Balance', 
              value: `${analytics?.profit ?? 0} EGP`, 
              desc: 'Gross revenue minus expenses',
              icon: <TrendingUp className="w-5 h-5 text-indigo-400" />
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

        {/* Visual Analytics Chart Block */}
        {isMounted && (
          <section className="grid gap-6 lg:grid-cols-12">
            {/* Revenue Trend Over Time */}
            <Card className="bg-slate-900/40 border-slate-800/80 p-6 rounded-2xl backdrop-blur-md lg:col-span-8 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Revenue Velocity
                </h2>
                <p className="text-xs text-slate-500 mb-6">Completeness trend across active scheduling intervals</p>
              </div>
              <div className="h-64 w-full">
                {chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No transaction velocity records.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Split Distribution card */}
            <Card className="bg-slate-900/40 border-slate-800/80 p-6 rounded-2xl backdrop-blur-md lg:col-span-4 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  Method Distribution
                </h2>
                <p className="text-xs text-slate-500 mb-4">Splits across active completed accounts</p>
              </div>
              
              <div className="h-44 flex items-center justify-center relative">
                {pieData.reduce((acc, current) => acc + current.value, 0) === 0 ? (
                  <div className="text-slate-500 text-sm">No active distributions.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
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
                {/* Total balance text inside center hole */}
                <div className="absolute text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Total Net</span>
                  <span className="text-lg font-black text-white">
                    {pieData.reduce((acc, curr) => acc + curr.value, 0)} EGP
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="space-y-2 mt-4">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-200">{item.value} EGP</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Ledger table card filters */}
        <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white">Transaction Logs</h2>
            
            {/* Filter controls toolbar */}
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <Input 
                  placeholder="Search passenger name, email, or transaction reference..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
                />
              </div>

              {/* Filters list */}
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Audit</option>
                  <option value="under_review">Under Review</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed / Denied</option>
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="all">All Methods</option>
                  <option value="card">Card Terminal</option>
                  <option value="cash">Cash Proof</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions lists table */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-900/30 border border-slate-800 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="pb-3 pl-2">Passenger</th>
                    <th className="pb-3">Reference ID</th>
                    <th className="pb-3">Trip / Details</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filteredPayments.map((p) => {
                    const paymentId = p.id || p._id || '';
                    const studentName = p.user?.name || 'Unknown User';
                    const studentEmail = p.user?.email || 'N/A';
                    const isPending = p.status === 'pending' || p.status === 'under_review';
                    const isCompleted = p.status === 'completed';
                    const isFailed = p.status === 'failed';

                    return (
                      <tr key={paymentId} className="hover:bg-slate-900/10 transition-colors">
                        {/* Passenger */}
                        <td className="py-4 pl-2 font-medium">
                          <div className="font-bold text-slate-200">{studentName}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{studentEmail}</div>
                        </td>

                        {/* Reference */}
                        <td className="py-4 text-slate-400 font-mono text-[11px]">{p.reference || 'N/A'}</td>

                        {/* Booking detail */}
                        <td className="py-4 text-slate-300">
                          {p.booking ? (
                            <div>
                              <div className="font-semibold">{p.booking.route}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {new Date(p.booking.travelDate).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-medium">No attached booking</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        {/* Amount */}
                        <td className="py-4 font-extrabold text-white">{p.amount} {p.currency || 'EGP'}</td>

                        {/* Method */}
                        <td className="py-4 capitalize">
                          <span className="flex items-center gap-1">
                            {p.method === 'cash' ? <Coins className="w-3.5 h-3.5 text-emerald-400" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                            {p.method}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : isPending 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isCompleted ? <CheckCircle className="w-3 h-3" /> : isPending ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {p.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 text-right pr-2">
                          <div className="flex justify-end gap-1.5">
                            {/* If cash proof image is present */}
                            {p.proofImage && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white px-2 rounded-lg"
                                onClick={() => setPreviewImage(p.proofImage || null)}
                                title="View Receipt Proof Image"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Verify Action buttons (Approve/Reject) */}
                            {p.method === 'cash' && isPending && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleVerifyPayment(paymentId, 'completed')}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 rounded-lg"
                                  title="Approve Cash Transaction"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleVerifyPayment(paymentId, 'failed')}
                                  className="px-2.5 rounded-lg"
                                  title="Reject Cash Transaction"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No transactions match active filter configurations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* RENDER MODAL PREVIEW FOR RECEIPTS */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Cash Proof Receipt
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="relative aspect-video max-h-[380px] rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewImage} 
                alt="Uploaded Payment Cash Proof Receipt"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            
            <Button 
              variant="outline"
              className="border-slate-800 hover:bg-slate-800 rounded-xl"
              onClick={() => setPreviewImage(null)}
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
