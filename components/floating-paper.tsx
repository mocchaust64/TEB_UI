"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Coins, Shield, Lock, Percent, Key, FileText, Users, Zap, Eye, ArrowRightLeft } from "lucide-react"

const solanaFeatureIcons = [
  { icon: Coins, color: "text-yellow-400", name: "Token" },
  { icon: Percent, color: "text-green-400", name: "Transfer Fees" },
  { icon: Eye, color: "text-blue-400", name: "Confidential Transfer" },
  { icon: Key, color: "text-purple-400", name: "Permanent Delegate" },
  { icon: Lock, color: "text-red-400", name: "Non-Transferable" },
  { icon: Zap, color: "text-orange-400", name: "Interest Bearing" },
  { icon: Shield, color: "text-cyan-400", name: "CPI Guard" },
  { icon: FileText, color: "text-pink-400", name: "Metadata Pointer" },
  { icon: Users, color: "text-indigo-400", name: "Group Pointer" },
  { icon: ArrowRightLeft, color: "text-emerald-400", name: "Required Memo" },
]

export function FloatingSolanaFeatures({ count = 8 }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Update dimensions only on client side
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Trả về placeholder khi chưa mount
  if (!isMounted) {
    return <div className="relative w-full h-full"></div>
  }

  return (
    <div className="relative w-full h-full">
      {Array.from({ length: count }).map((_, i) => {
        const feature = solanaFeatureIcons[i % solanaFeatureIcons.length]
        const IconComponent = feature.icon

        return (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: Math.random() * dimensions.width,
              y: Math.random() * dimensions.height,
            }}
            animate={{
              x: [Math.random() * dimensions.width, Math.random() * dimensions.width, Math.random() * dimensions.width],
              y: [
                Math.random() * dimensions.height,
                Math.random() * dimensions.height,
                Math.random() * dimensions.height,
              ],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <div className="relative w-16 h-16 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-center transform hover:scale-110 transition-transform group">
              <IconComponent className={`w-8 h-8 ${feature.color}/70 group-hover:${feature.color}`} />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white/70 whitespace-nowrap bg-black/50 px-2 py-1 rounded">
                  {feature.name}
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
