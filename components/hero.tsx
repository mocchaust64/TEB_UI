"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Plus, Settings, Coins, TrendingUp, Shield, Zap } from "lucide-react"
import { FloatingSolanaFeatures } from "@/components/floating-paper"
import { WalletStatus } from "@/components/wallet-status"
import Link from "next/link"

export default function Hero() {
  return (
    <div className="relative min-h-[calc(100vh-76px)] flex items-center">
      {/* Floating Solana features background */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingSolanaFeatures count={8} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                Manage
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  {" "}
                  Token Extensions
                </span>
                <br />
                On Solana
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-400 text-xl mb-8 max-w-2xl"
            >
              Create, manage, and customize tokens with Solana's powerful extension features. From transfer fees to
              confidential transfers, all in one unified platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Link href="/create">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                <Plus className="mr-2 h-5 w-5" />
                Create New Token
              </Button>
              </Link>
              <Link href="/tokens">
              <Button size="lg" variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20">
                <Coins className="mr-2 h-5 w-5" />
                Token Portfolio
              </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <Coins className="w-8 h-8 text-yellow-400 mb-2" />
                <h3 className="text-white font-semibold">10+ Extensions</h3>
                <p className="text-gray-400 text-sm">Full feature support</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                <h3 className="text-white font-semibold">Easy to Use</h3>
                <p className="text-gray-400 text-sm">User-friendly interface</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <Shield className="w-8 h-8 text-blue-400 mb-2" />
                <h3 className="text-white font-semibold">Secure</h3>
                <p className="text-gray-400 text-sm">Safe & reliable</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <Zap className="w-8 h-8 text-orange-400 mb-2" />
                <h3 className="text-white font-semibold">Performance</h3>
                <p className="text-gray-400 text-sm">Fast & efficient</p>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <WalletStatus />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
