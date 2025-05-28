"use client"

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from "react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { Connection, clusterApiUrl } from "@solana/web3.js"

// Define network option type
type NetworkOption = {
  value: WalletAdapterNetwork
  label: string
  endpoint: string
  explorerUrl: string
  color: string
}

// Available networks with reliable RPC endpoints
export const NETWORK_OPTIONS: NetworkOption[] = [
  {
    value: WalletAdapterNetwork.Devnet,
    label: "Devnet",
    endpoint: clusterApiUrl(WalletAdapterNetwork.Devnet),
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
    color: "text-purple-500"
  },
  {
    value: WalletAdapterNetwork.Mainnet,
    label: "Mainnet",
    // Use Alchemy endpoint - in production, consider using environment variables for API keys
    endpoint: "https://solana-mainnet.g.alchemy.com/v2/X6IFbQzZ3VPgX8FUu-MfXH-yHj8EwXlY",
    explorerUrl: "https://explorer.solana.com",
    color: "text-green-500"
  },
]

// Define context type
type NetworkContextType = {
  selectedNetwork: WalletAdapterNetwork
  setSelectedNetwork: (network: WalletAdapterNetwork) => void
  endpoint: string
  connection: Connection | null
  networkOptions: NetworkOption[]
  currentNetworkOption: NetworkOption
  explorerUrl: string
}

// Create context with default value
const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

// Storage key
const STORAGE_KEY = "solana-network"

// Provider component
export function NetworkProvider({ children }: { children: ReactNode }) {
  // Use devnet as default
  const [selectedNetwork, setSelectedNetwork] = useState<WalletAdapterNetwork>(
    WalletAdapterNetwork.Devnet
  )
  
  // Get current network option
  const currentNetworkOption = NETWORK_OPTIONS.find(
    option => option.value === selectedNetwork
  ) || NETWORK_OPTIONS[0]
  
  // Use the endpoint from the selected network
  const endpoint = currentNetworkOption.endpoint
  
  // Create and store connection
  const [connection, setConnection] = useState<Connection | null>(null)
  
  // Handle network change
  const handleNetworkChange = (network: WalletAdapterNetwork) => {
    setSelectedNetwork(network)
    
    // Save network preference immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, network)
    }
  }
  
  // Initialize connection when endpoint changes
  useEffect(() => {
    try {
      const newConnection = new Connection(endpoint, {
        commitment: "confirmed",
        disableRetryOnRateLimit: true,
        confirmTransactionInitialTimeout: 60000
      })
      setConnection(newConnection)
    } catch (error) {
      console.error("Error creating connection:", error)
    }
  }, [endpoint])
  
  // Restore network preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Restore network selection
        const savedNetwork = localStorage.getItem(STORAGE_KEY)
        
        if (savedNetwork && 
            Object.values(WalletAdapterNetwork).includes(savedNetwork as WalletAdapterNetwork)) {
          setSelectedNetwork(savedNetwork as WalletAdapterNetwork)
        }
      } catch (error) {
        console.error("Error restoring network preferences:", error)
      }
    }
  }, [])

  return (
    <NetworkContext.Provider
      value={{
        selectedNetwork,
        setSelectedNetwork: handleNetworkChange,
        endpoint,
        connection,
        networkOptions: NETWORK_OPTIONS,
        currentNetworkOption,
        explorerUrl: currentNetworkOption.explorerUrl
      }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

// Hook to use network context
export function useNetwork() {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider")
  }
  return context
} 