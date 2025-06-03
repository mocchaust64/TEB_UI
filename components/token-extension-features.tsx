"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Percent, Eye, Key, Lock, Zap, Shield, FileText, Users, ArrowRightLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import Link from "next/link"

const tokenExtensions = [
  {
    icon: Percent,
    name: "Transfer Fees",
    description: "Automatically collect fees for each token transfer transaction",
    status: "available",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#transfer-fee",
  },
  {
    icon: Eye,
    name: "Confidential Transfer",
    description: "Secure transaction information with zero-knowledge proofs",
    status: "available",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#confidential-transfer",
  },
  {
    icon: Key,
    name: "Permanent Delegate",
    description: "Assign a permanent delegate for the token",
    status: "available",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#permanent-delegate",
  },
  {
    icon: Lock,
    name: "Non-Transferable",
    description: "Create tokens that cannot be transferred",
    status: "available",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#non-transferable-tokens",
  },
  {
    icon: Zap,
    name: "Interest Bearing",
    description: "Tokens that automatically generate interest over time",
    status: "available",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#interest-bearing-tokens",
  },
  {
    icon: Shield,
    name: "Default Account State",
    description: "Set default state for all accounts of this token",
    status: "available",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#default-account-state",
  },
  {
    icon: FileText,
    name: "Metadata Pointer",
    description: "Link metadata directly to the token",
    status: "available",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#metadata-pointer",
  },
  {
    icon: FileText,
    name: "Metadata",
    description: "Embed metadata directly into the token",
    status: "available",
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#metadata",
  },
  {
    icon: Key,
    name: "Mint Close Authority",
    description: "Authority allowed to close this mint",
    status: "available",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    docsUrl: "https://spl.solana.com/token-2022/extensions#mint-close-authority",
  },
]

export function TokenExtensionFeatures() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) {
    return <section className="py-12 md:py-20 px-4 sm:px-6">
      <div className="container mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">Token Extension Features</h2>
          <div className="h-6"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-900/50 border-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    </section>
  }

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
            Token Extension
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}
              Features
            </span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">
            Explore and utilize Solana's powerful extension features to create unique and highly functional tokens.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tokenExtensions.map((extension, index) => {
            const IconComponent = extension.icon
            return (
              <motion.div
                key={extension.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 md:p-3 rounded-lg ${extension.bgColor}`}>
                        <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${extension.color}`} />
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    </div>
                    <CardTitle className="text-white group-hover:text-purple-400 transition-colors text-lg md:text-xl">
                      {extension.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <p className="text-gray-400 text-sm md:text-base">{extension.description}</p>
                    <Link href={extension.docsUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-0 text-sm md:text-base"
                      >
                        Learn more →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
