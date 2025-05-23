"use client"

import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Coins, Network } from "lucide-react"

export function WalletStatus() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    
    if (connected && publicKey) {
      setLoading(true)
      connection
        .getBalance(publicKey)
        .then((balance) => {
          setBalance(balance / LAMPORTS_PER_SOL)
        })
        .catch((error) => {
          console.error("Error fetching balance:", error)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, connection, isMounted])

  // Show loading placeholder before client-side hydration
  if (!isMounted) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-400">Initializing wallet...</p>
        </CardContent>
      </Card>
    )
  }

  if (!connected || !publicKey) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Connect your wallet to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Wallet className="w-5 h-5 mr-2" />
          Wallet Connected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Address:</span>
          <span className="text-white font-mono text-sm">
            {`${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center">
            <Coins className="w-4 h-4 mr-1" />
            Balance:
          </span>
          <span className="text-white font-semibold">
            {loading ? "Loading..." : `${balance?.toFixed(4) || "0"} SOL`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center">
            <Network className="w-4 h-4 mr-1" />
            Network:
          </span>
          <span className="text-purple-400 font-semibold">Devnet</span>
        </div>
      </CardContent>
    </Card>
  )
}
