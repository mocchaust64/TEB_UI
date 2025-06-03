"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Plus, Settings, Coins, TrendingUp, Shield, Zap } from "lucide-react"
import { FloatingSolanaFeatures } from "@/components/floating-paper"
import { WalletStatus } from "@/components/wallet-status"
import Link from "next/link"

export default function Hero() {
  return (
    <div className="relative min-h-[calc(100vh-76px)] flex items-center py-12 md:py-0">
      {/* Floating Solana features background */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingSolanaFeatures count={8} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8 items-center">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6">
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
              className="text-gray-400 text-base md:text-xl mb-6 md:mb-8 max-w-2xl"
            >
              Create, manage, and customize tokens with Solana's powerful extension features. From transfer fees to
              confidential transfers, all in one unified platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start gap-3 md:gap-4 w-full"
            >
              <Link href="/create" className="w-full sm:w-auto">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-6 md:px-8 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Create New Token
                </Button>
              </Link>
              <Link href="/tokens" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20 w-full sm:w-auto">
                  <Coins className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Token Portfolio
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-6 md:mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/10">
                <Coins className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 mb-1 md:mb-2" />
                <h3 className="text-white text-sm md:text-base font-semibold">10+ Extensions</h3>
                <p className="text-gray-400 text-xs md:text-sm">Full feature support</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/10">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-400 mb-1 md:mb-2" />
                <h3 className="text-white text-sm md:text-base font-semibold">Easy to Use</h3>
                <p className="text-gray-400 text-xs md:text-sm">User-friendly interface</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/10">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-400 mb-1 md:mb-2" />
                <h3 className="text-white text-sm md:text-base font-semibold">Secure</h3>
                <p className="text-gray-400 text-xs md:text-sm">Safe & reliable</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/10">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-orange-400 mb-1 md:mb-2" />
                <h3 className="text-white text-sm md:text-base font-semibold">Performance</h3>
                <p className="text-gray-400 text-xs md:text-sm">Fast & efficient</p>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1 mt-8 lg:mt-0">
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
