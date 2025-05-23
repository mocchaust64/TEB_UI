"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Wallet, Copy, ExternalLink, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet()
  const [copied, setCopied] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  
  if (!isMounted) {
    return (
      <Button variant="outline" className="w-32 text-white border-purple-500 hover:bg-purple-500/20">
        <div className="w-4 h-4 mr-2"></div>
        Wallet
      </Button>
    )
  }

  if (!connected || !publicKey) {
    return (
      <div className="wallet-adapter-button-trigger">
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-white !border-none !rounded-md !px-4 !py-2 !text-sm !font-medium !transition-colors" />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20">
          <Wallet className="mr-2 h-4 w-4" />
          {truncateAddress(publicKey.toString())}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700">
        <DropdownMenuItem onClick={copyAddress} className="text-white hover:bg-gray-800 cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, "_blank")
          }
          className="text-white hover:bg-gray-800 cursor-pointer"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem onClick={disconnect} className="text-red-400 hover:bg-gray-800 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
