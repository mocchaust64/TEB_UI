"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Users, ArrowUpDown, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

export function TokenStats() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) {
    return <section className="py-16 px-6 bg-black/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Token Extension Statistics</h2>
          <div className="h-6"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-900/50 border-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    </section>
  }

  return (
    <section className="py-16 px-6 bg-black/30">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Token Extension Statistics</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Track usage statistics for token extensions on Solana
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Coins className="w-10 h-10 text-purple-500" />}
            title="Total Tokens"
            value="1,245,789"
            change="+12.5%"
            isPositive={true}
          />
          <StatCard
            icon={<Users className="w-10 h-10 text-blue-500" />}
            title="Active Users"
            value="458,932"
            change="+8.3%"
            isPositive={true}
          />
          <StatCard
            icon={<ArrowUpDown className="w-10 h-10 text-green-500" />}
            title="Transactions"
            value="25,789,654"
            change="+15.2%"
            isPositive={true}
          />
          <StatCard
            icon={<TrendingUp className="w-10 h-10 text-orange-500" />}
            title="Growth Rate"
            value="32.7%"
            change="+5.4%"
            isPositive={true}
          />
        </div>
      </div>
    </section>
  )
}

function StatCard({
  icon,
  title,
  value,
  change,
  isPositive,
}: {
  icon: React.ReactNode
  title: string
  value: string
  change: string
  isPositive: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            {icon}
            <span className={`text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>{change}</span>
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-white text-lg mb-1">{title}</CardTitle>
          <p className="text-3xl font-bold text-white">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
