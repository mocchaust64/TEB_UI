"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Percent, Eye, Key, Lock, Zap, Shield, FileText, Users, ArrowRightLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

const tokenExtensions = [
  {
    icon: Percent,
    name: "Transfer Fees",
    description: "Automatically collect fees for each token transfer transaction",
    status: "available",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
  },
  {
    icon: Eye,
    name: "Confidential Transfer",
    description: "Secure transaction information with zero-knowledge proofs",
    status: "available",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    icon: Key,
    name: "Permanent Delegate",
    description: "Assign a permanent delegate for the token",
    status: "available",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
  {
    icon: Lock,
    name: "Non-Transferable",
    description: "Create tokens that cannot be transferred",
    status: "available",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
  },
  {
    icon: Zap,
    name: "Interest Bearing",
    description: "Tokens that automatically generate interest over time",
    status: "available",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
  },
  {
    icon: Shield,
    name: "CPI Guard",
    description: "Protection against CPI attacks",
    status: "available",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
  },
  {
    icon: FileText,
    name: "Metadata Pointer",
    description: "Link metadata directly to the token",
    status: "available",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
  },
  {
    icon: Users,
    name: "Group Pointer",
    description: "Group related tokens together",
    status: "available",
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
  },
  {
    icon: ArrowRightLeft,
    name: "Required Memo",
    description: "Require memo for all transactions",
    status: "available",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
]

export function TokenExtensionFeatures() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) {
    return <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Token Extension Features</h2>
          <div className="h-6"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-900/50 border-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    </section>
  }

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Token Extension
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}
              Features
            </span>
          </h2>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Explore and utilize Solana's powerful extension features to create unique and highly functional tokens.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokenExtensions.map((extension, index) => {
            const IconComponent = extension.icon
            return (
              <motion.div
                key={extension.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${extension.bgColor}`}>
                        <IconComponent className={`w-6 h-6 ${extension.color}`} />
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    </div>
                    <CardTitle className="text-white group-hover:text-purple-400 transition-colors">
                      {extension.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-400">{extension.description}</p>
                    <Button
                      variant="ghost"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-0"
                    >
                      Learn more →
                    </Button>
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
