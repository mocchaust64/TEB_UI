"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown } from "lucide-react"
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
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  
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
      <Button variant="outline" className="w-full md:w-32 text-white border-purple-500 hover:bg-purple-500/20">
        <div className="w-4 h-4 mr-2"></div>
        Wallet
      </Button>
    )
  }

  if (!connected || !publicKey) {
    return (
      <div className="wallet-adapter-button-trigger w-full">
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-white !border-none !rounded-md !px-4 !py-2 !text-sm !font-medium !transition-colors !w-full" />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="text-white border-purple-500 hover:bg-purple-500/20 w-full md:w-auto flex items-center justify-between"
        >
          <div className="flex items-center truncate">
            <Wallet className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{truncateAddress(publicKey.toString())}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
        <div className="px-2 py-1.5 text-sm font-medium text-gray-400">
          Solana Wallet
        </div>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem onClick={copyAddress} className="text-white hover:bg-gray-800 cursor-pointer flex items-center">
          <Copy className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{copied ? "Copied!" : "Copy Address"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, "_blank")
          }
          className="text-white hover:bg-gray-800 cursor-pointer flex items-center"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          <span className="flex-1">View on Explorer</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem onClick={disconnect} className="text-red-400 hover:bg-gray-800 cursor-pointer flex items-center">
          <LogOut className="mr-2 h-4 w-4" />
          <span className="flex-1">Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
