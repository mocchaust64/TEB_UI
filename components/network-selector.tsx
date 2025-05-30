"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { useNetwork } from "@/lib/hooks/use-network"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

export function NetworkSelector() {
  const { 
    selectedNetwork, 
    setSelectedNetwork, 
    networkOptions, 
    currentNetworkOption 
  } = useNetwork()
  
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="text-white border-gray-700 bg-gray-800/70 hover:bg-gray-700/80"
      >
        <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
        <span className="mr-1">Network</span>
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="text-white border-gray-700 bg-gray-800/70 hover:bg-gray-700/80"
              id="network-selector"
            >
              <div 
                className={`w-2 h-2 rounded-full ${currentNetworkOption.color} mr-2`}
              ></div>
              <span className="mr-1">{currentNetworkOption.label}</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <TooltipContent>
            <p>Select Solana network</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-36 bg-gray-900 border-gray-700">
          {networkOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setSelectedNetwork(option.value)}
              className="flex justify-between text-white hover:bg-gray-800 cursor-pointer"
            >
              <div className="flex items-center">
                <div 
                  className={`w-2 h-2 rounded-full ${option.color} mr-2`}
                ></div>
                {option.label}
              </div>
              {selectedNetwork === option.value && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}