'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Bus, Clock, Users, CheckCircle, Star } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function LandingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) {
      router.replace("/dashboard")
    }
  }, [user, router])

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">UR</span>
            </div>
            <span className="font-bold text-lg">UniRide</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm hover:text-cyan-400 transition-colors">
              Login
            </Link>
            <Link 
              href="/register" 
              className={buttonVariants({ size: "sm" })}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                <Bus className="h-4 w-4" />
                <span>Modern university transportation</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                University rides made{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  simple
                </span>
              </h1>

              <p className="text-xl text-slate-400 max-w-2xl">
                Student verification, real-time seat booking, driver management, and admin approvals — all in one beautiful platform that feels like the future of campus mobility.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  href="/register"
                  className={buttonVariants({ size: "lg" })}
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Learn More
                </a>
              </div>
            </motion.div>

            {/* Feature Preview */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8"
            >
              {[
                { icon: Users, label: "Student Verification" },
                { icon: Clock, label: "Real-time Bookings" },
                { icon: CheckCircle, label: "Instant Approvals" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                  <feature.icon className="w-8 h-8 text-cyan-400 mb-2" />
                  <p className="text-sm font-medium">{feature.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Everything you need</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                A complete solution for university transportation management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "For Students",
                  description: "Book trips, verify identity with university ID, receive real-time notifications, and manage your bookings",
                  features: ["ID Verification", "Easy Booking", "Live Tracking", "Wallet System"]
                },
                {
                  title: "For Drivers",
                  description: "Manage passengers, scan QR codes for boarding, track earnings, and communicate with the admin team",
                  features: ["QR Scanning", "Passenger List", "Earnings Tracking", "Real-time Updates"]
                },
                {
                  title: "For Admins",
                  description: "Full control over users, trips, buses, payments, and detailed analytics of the entire system",
                  features: ["User Management", "Trip Scheduling", "Analytics", "Report Generation"]
                },
                {
                  title: "Premium Features",
                  description: "Advanced analytics, payment integration, real-time monitoring, and multi-university support",
                  features: ["Live Dashboard", "Multiple Integrations", "Advanced Reports", "API Access"]
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
                >
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-400 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((f, j) => (
                      <li key={j} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { label: "Verified access", value: "Admin-approved" },
              { label: "Seat status", value: "Live" },
              { label: "Boarding", value: "QR-secured" },
              { label: "Storage", value: "Cloud-based" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-4xl font-bold text-cyan-400">{stat.value}</p>
                <p className="text-slate-400 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold">Ready to get started?</h2>
            <p className="text-lg text-slate-400">
              Join thousands of students already using UniRide for seamless campus transportation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link 
                href="/register"
                className={buttonVariants({ size: "lg" })}
              >
                Sign Up Now
              </Link>
              <Link 
                href="/login"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Already have an account?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UR</span>
                </div>
                <span className="font-bold">UniRide</span>
              </div>
              <p className="text-sm text-slate-400">Modern university transportation for the future</p>
            </div>
            {[
              { title: "Product", items: ["Features", "Security", "Pricing"] },
              { title: "Company", items: ["About", "Blog", "Contact"] },
              { title: "Legal", items: ["Privacy", "Terms", "Cookies"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.items.map((item, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-slate-400">
            <p>© 2026 UniRide. All rights reserved. Built with ❤️ for campus mobility.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
