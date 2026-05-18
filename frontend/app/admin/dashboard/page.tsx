'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Header } from '@/components/Header'
import { StatCard, LoadingCard } from '@/components/StatCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Activity,
  BarChart3,
  Clock,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Mock data
const revenueData = [
  { month: 'Jan', revenue: 4000, bookings: 240 },
  { month: 'Feb', revenue: 3000, bookings: 221 },
  { month: 'Mar', revenue: 2000, bookings: 229 },
  { month: 'Apr', revenue: 2780, bookings: 200 },
  { month: 'May', revenue: 1890, bookings: 229 },
]

const occupancyData = [
  { route: 'Downtown-Campus', occupancy: 85 },
  { route: 'Campus-Airport', occupancy: 72 },
  { route: 'City Center-Campus', occupancy: 68 },
  { route: 'Campus-Station', occupancy: 92 },
]

const userStatusData = [
  { name: 'Approved', value: 450 },
  { name: 'Pending', value: 120 },
  { name: 'Rejected', value: 25 },
]

const COLORS = ['#06b6d4', '#8b5cf6', '#ef4444']

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 595,
    totalBookings: 2847,
    totalRevenue: 156800,
    activeTrips: 23,
  })

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      router.replace('/login')
      return
    }

    // Simulate data loading
    setTimeout(() => setLoading(false), 1200)
  }, [isAuthenticated, user, router])

  if (!user || user.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Welcome Section */}
            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-4xl font-bold text-white">
                Admin Dashboard 🎛️
              </h1>
              <p className="text-slate-400">
                System overview and management controls
              </p>
            </motion.div>

            {/* Stats Grid */}
            {loading ? (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
              >
                {[1, 2, 3, 4].map((i) => (
                  <LoadingCard key={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
              >
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<Users className="w-6 h-6 text-cyan-400" />}
                  change={{ value: 12, type: 'up' }}
                />
                <StatCard
                  title="Total Bookings"
                  value={stats.totalBookings}
                  icon={<Activity className="w-6 h-6 text-blue-400" />}
                  change={{ value: 8, type: 'up' }}
                />
                <StatCard
                  title="Revenue (EGP)"
                  value={`${(stats.totalRevenue / 1000).toFixed(1)}K`}
                  icon={<DollarSign className="w-6 h-6 text-green-400" />}
                  change={{ value: 23, type: 'up' }}
                />
                <StatCard
                  title="Active Trips"
                  value={stats.activeTrips}
                  icon={<Clock className="w-6 h-6 text-purple-400" />}
                />
              </motion.div>
            )}

            {/* Main Tabs */}
            <motion.div variants={itemVariants}>
              <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="trips">Trips</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart */}
                    <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Revenue Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #475569',
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#06b6d4"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* User Status Distribution */}
                    <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        User Status
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={userStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {userStatusData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #475569',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Occupancy by Route */}
                    <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] lg:col-span-2">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Route Occupancy Rates
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={occupancyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="route"
                            stroke="#94a3b8"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #475569',
                            }}
                          />
                          <Bar
                            dataKey="occupancy"
                            fill="#8b5cf6"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4 mt-6">
                  <div className="flex gap-3">
                    <Button size="sm">Filter</Button>
                    <Button size="sm" variant="outline">
                      Export
                    </Button>
                  </div>
                  <div className="overflow-x-auto p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Name
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Role
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map((i) => (
                          <tr
                            key={i}
                            className="border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-4 text-white">User Name</td>
                            <td className="py-3 px-4 text-slate-300">
                              user{i}@email.com
                            </td>
                            <td className="py-3 px-4 text-slate-300">Student</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded-full text-xs bg-green-400/20 text-green-300">
                                Approved
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button className="text-cyan-400 hover:text-cyan-300 text-sm">
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Trips Tab */}
                <TabsContent value="trips" className="space-y-4 mt-6">
                  <Button size="sm">+ Create Trip</Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg border border-white/10 bg-white/5 hover:border-white/20 transition-all"
                      >
                        <h4 className="font-semibold text-white">
                          Trip {i}: Downtown - Campus
                        </h4>
                        <p className="text-sm text-slate-400 mt-1">
                          Bus #{i} • 45 seats • Driver: John
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-green-300">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-4 mt-6">
                  <div className="overflow-x-auto p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            User
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Amount
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Method
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map((i) => (
                          <tr
                            key={i}
                            className="border-b border-white/10 hover:bg-white/5"
                          >
                            <td className="py-3 px-4 text-white">2026-05-{i}</td>
                            <td className="py-3 px-4 text-slate-300">
                              Student {i}
                            </td>
                            <td className="py-3 px-4 font-semibold text-green-400">
                              {50 * i} EGP
                            </td>
                            <td className="py-3 px-4 text-slate-300">Card</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded-full text-xs bg-green-400/20 text-green-300">
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 mt-6">
                  <div className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] space-y-4">
                    <h3 className="font-semibold text-white">System Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-white">Enable payments</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-white">Enable notifications</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-white">Enable real-time updates</span>
                      </label>
                    </div>
                    <Button size="sm" className="mt-4">
                      Save Settings
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
