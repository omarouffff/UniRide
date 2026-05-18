"use client"

import React from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: "up" | "down"
  }
  icon: React.ReactNode
  delay?: number
}

export function StatCard({
  title,
  value,
  change,
  icon,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md hover:border-white/20 transition-all duration-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change && (
            <div className="flex items-center space-x-1 mt-2">
              {change.type === "up" ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-xs font-medium ${
                  change.type === "up"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {change.value > 0 ? "+" : ""}{change.value}%
              </span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-white/10">{icon}</div>
      </div>
    </motion.div>
  )
}

export function LoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md"
    >
      <div className="space-y-3">
        <div className="h-4 bg-white/10 rounded animate-pulse w-24"></div>
        <div className="h-8 bg-white/10 rounded animate-pulse w-32"></div>
      </div>
    </motion.div>
  )
}
