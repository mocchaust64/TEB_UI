"use client"

import type React from "react"

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { useMemo, useEffect } from "react"
import { NetworkProvider, useNetwork } from "@/lib/hooks/use-network"

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css"

// Wrapper component that includes both providers
export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <WalletProviderWithNetwork>
        {children}
      </WalletProviderWithNetwork>
    </NetworkProvider>
  )
}

// Inner component that uses NetworkContext
function WalletProviderWithNetwork({ children }: { children: React.ReactNode }) {
  const { endpoint, selectedNetwork } = useNetwork()

  // Initialize wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(), 
      new SolflareWalletAdapter(), 
    ], 
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
