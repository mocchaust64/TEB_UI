"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CommonLayout } from "@/components/common-layout"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Coins, 
  Plus, 
  Wallet, 
  Search,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { TokenItem } from "@/lib/services/tokenList"
import { toast } from "sonner"
import { WalletButton } from "@/components/wallet-button"
import { getTokensFromCache } from "@/lib/utils/token-cache"
import { fetchTokensFromBlockchain, fetchRecentTransactions } from "@/lib/services/token-service"
import { TokenItem as TokenItemComponent } from "@/components/token/token-item"
import { TransactionItem as TransactionItemComponent } from "@/components/transaction/transaction-item"
import { PaginationControls } from "@/components/pagination/pagination-controls"
import { useTokenSearch } from "@/hooks/use-token-search"
import { usePagination } from "@/hooks/use-pagination"
import { TransactionType } from "@/components/transaction/transaction-icons"

// Transaction interface
interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  symbol: string;
  address: string;
  timestamp: Date;
  status: 'confirmed' | 'processing' | 'failed';
  tokenIcon?: string;
}

export default function TokenPortfolio() {
  // Fix hydration mismatch by ensuring component
  // always renders consistently between server and client
  const [mounted, setMounted] = useState(false)
  const [tokens, setTokens] = useState<TokenItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [totalValue, setTotalValue] = useState("0")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [displayedTransactions, setDisplayedTransactions] = useState(5) // Number of transactions to display
  
  // Pagination
  const [tokensPerPage] = useState(5)
  
  // Get wallet and connection
  const wallet = useWallet()
  const { publicKey, connected } = wallet
  const { connection } = useConnection()
  
  // Use extracted hooks
  const { searchTerm, setSearchTerm, filteredTokens } = useTokenSearch({ tokens });
  const { 
    currentPage, 
    setCurrentPage, 
    paginatedItems: paginatedTokens, 
    totalPages,
    goToPreviousPage,
    goToNextPage,
    pageNumbers
  } = usePagination<TokenItem>({
    items: filteredTokens,
    itemsPerPage: tokensPerPage
  });
  
  // Setup mounting state
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Fetch tokens when wallet connects
  useEffect(() => {
    if (!mounted || !connected || !publicKey || !connection) return
    
    const loadTokens = async () => {
      // Try to get data from cache first
      const cachedData = getTokensFromCache(publicKey.toString())
      
      if (cachedData) {
        // Use cached data
        setTokens(cachedData.tokens)
        setTotalValue(cachedData.totalValue)
        setLastUpdated(new Date(cachedData.timestamp))
        
        // Optional: Fetch fresh data in the background
        fetchTokensFromBlockchain(connection, wallet, {
          onStart: () => {
            // Do nothing, we're using cached data initially
          }
        })
      } else {
        // No valid cache, fetch from blockchain
        await fetchTokensFromBlockchain(connection, wallet, {
          onStart: () => {
            setIsLoading(true)
            setIsError(false)
          },
          onSuccess: (userTokens, formattedTotal) => {
            setTokens(userTokens)
            setTotalValue(formattedTotal)
            setLastUpdated(new Date())
          },
          onError: () => {
            setIsError(true)
          },
          onFinish: () => {
            setIsLoading(false)
          }
        })
      }
    }
    
    loadTokens()
    
    fetchRecentTransactions(connection, wallet, {
      onStart: () => {
        setIsLoadingTransactions(true)
      },
      onSuccess: (transactionData) => {
        // Convert from TransactionItem to Transaction
        const transactions: Transaction[] = transactionData.map(tx => ({
          id: tx.id,
          type: tx.type as TransactionType,
          amount: tx.amount,
          symbol: tx.symbol,
          address: tx.address,
          timestamp: tx.timestamp,
          status: tx.status === 'confirmed' ? 'confirmed' : 
                 tx.status === 'processing' ? 'processing' : 'failed',
          tokenIcon: tx.tokenIcon
        }))
        
        setRecentTransactions(transactions)
      },
      onFinish: () => {
        setIsLoadingTransactions(false)
      }
    })
  }, [mounted, connected, publicKey, connection, wallet])
  
  // Handler to manually refresh token data
  const handleRefresh = () => {
    if (!connection || !wallet) return;
    
    fetchTokensFromBlockchain(connection, wallet, {
      forceRefresh: true,
      onStart: () => {
        setIsRefreshing(true)
      },
      onSuccess: (userTokens, formattedTotal) => {
        setTokens(userTokens)
        setTotalValue(formattedTotal)
        setLastUpdated(new Date())
      },
      onError: () => {
        toast.error("Failed to refresh token data")
      },
      onFinish: () => {
        setIsRefreshing(false)
      }
    })
    
    fetchRecentTransactions(connection, wallet, {
      onStart: () => {
        setIsLoadingTransactions(true)
      },
      onSuccess: (transactionData) => {
        const transactions: Transaction[] = transactionData.map(tx => ({
          id: tx.id,
          type: tx.type as TransactionType,
          amount: tx.amount,
          symbol: tx.symbol,
          address: tx.address,
          timestamp: tx.timestamp,
          status: tx.status === 'confirmed' ? 'confirmed' : 
                 tx.status === 'processing' ? 'processing' : 'failed',
          tokenIcon: tx.tokenIcon
        }))
        
        setRecentTransactions(transactions)
      },
      onFinish: () => {
        setIsLoadingTransactions(false)
      }
    })
  }
  
  // Function to expand or collapse transactions
  const toggleTransactionsDisplay = () => {
    if (displayedTransactions === 5) {
      setDisplayedTransactions(recentTransactions.length); // Show all
    } else {
      setDisplayedTransactions(5); // Collapse to 5
    }
  };
  
  // Show loading skeleton until component mounted on client
  if (!mounted) {
    return <PageLoadingSkeleton />
  }

  return (
    <CommonLayout>
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Token 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}Portfolio
            </span>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Manage and track your tokens
          </p>
        </motion.div>

        {!connected ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Wallet className="w-16 h-16 text-gray-500 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6 text-center max-w-md">
              Connect your Solana wallet to view and manage your tokens
            </p>
            <WalletButton />
          </div>
        ) : (
          <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gray-900/50 border-gray-700 col-span-1">
            <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {isLoading && !isRefreshing ? (
                      <div className="flex items-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin text-gray-400" />
                        <span className="text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      totalValue || "$0.00"
                    )}
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-400">
                    Based on available price data
                    {lastUpdated && (
                      <span className="ml-1">
                        · Updated {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700 col-span-1">
            <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Number of Tokens</CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {isLoading && !isRefreshing ? (
                      <div className="flex items-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin text-gray-400" />
                        <span className="text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      tokens.length
                    )}
                  </div>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                    Tokens in your wallet
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 border-gray-700 col-span-2">
            <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div>
                    <p className="text-gray-300 mb-3">Create new tokens or manage existing ones</p>
                <div className="flex space-x-3">
                  <Link href="/create">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-1" />
                          Create Token
                    </Button>
                  </Link>
                  <Link href="/tokens/manage">
                    <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                      <Wallet className="w-4 h-4 mr-1" />
                          Manage Tokens
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="hidden md:block">
                <Coins className="w-16 h-16 text-purple-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Token list */}
                <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex items-center">
                      <h2 className="text-2xl font-bold text-white">Token List</h2>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleRefresh} 
                        disabled={isRefreshing || isLoading}
                        className="ml-2"
                      >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                        placeholder="Search tokens..." 
                className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="my-tokens" className="w-full">
            <TabsList className="bg-gray-800/50 border-b border-gray-700 w-full justify-start mb-6">
              <TabsTrigger value="my-tokens" className="data-[state=active]:bg-gray-700">
                <Wallet className="w-4 h-4 mr-2" />
                        My Tokens
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="data-[state=active]:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9Z"/>
                  <path d="M15 12h-6"/>
                </svg>
                        Watchlist
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-tokens" className="mt-0">
                      {(isLoading && !tokens.length) ? (
                        <div className="flex flex-col items-center justify-center py-20">
                          <Loader2 className="w-12 h-12 text-purple-500 mb-4 animate-spin" />
                          <p className="text-gray-400">Loading your tokens...</p>
                        </div>
                      ) : isError ? (
                        <Card className="bg-gray-900/50 border-gray-700">
                          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                            <h3 className="text-white text-lg font-medium mb-1">Failed to load tokens</h3>
                            <p className="text-gray-400 mb-4">There was an error loading your token data</p>
                            <Button 
                              variant="outline" 
                              className="border-gray-600 text-white hover:bg-gray-800"
                              onClick={handleRefresh}
                            >
                              Retry
                            </Button>
                          </CardContent>
                        </Card>
                      ) : filteredTokens.length > 0 ? (
                        <div>
                <div className="grid grid-cols-1 gap-4">
                            {paginatedTokens.map((token) => (
                              <TokenItemComponent key={token.id} token={token} />
                  ))}
                          </div>
                          
                          {/* Pagination controls */}
                          <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredTokens.length}
                            itemsPerPage={tokensPerPage}
                            itemName="tokens"
                          />
                </div>
              ) : (
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-12 h-12 text-gray-500 mb-3" />
                            <h3 className="text-white text-lg font-medium mb-1">No tokens found</h3>
                            <p className="text-gray-400 mb-4">{searchTerm ? "No tokens match your search term" : "You don't have any tokens in your wallet yet"}</p>
                            {searchTerm ? (
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-white hover:bg-gray-800"
                      onClick={() => setSearchTerm('')}
                    >
                                Clear search
                              </Button>
                            ) : (
                              <Link href="/create">
                                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                  <Plus className="w-4 h-4 mr-1" />
                                  Create Token
                    </Button>
                              </Link>
                            )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="watchlist" className="mt-0">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-3">
                    <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9Z"/>
                    <path d="M9 12h6"/>
                    <path d="M12 9v6"/>
                  </svg>
                          <h3 className="text-white text-lg font-medium mb-1">Watchlist is empty</h3>
                          <p className="text-gray-400 mb-4">Add tokens to your watchlist to see them here</p>
                  <Link href="/tokens/discover">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                              Discover tokens
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
                </div>
                
                {/* Right column - Recent activity */}
                <div className="lg:col-span-1">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (connection && wallet) {
                          fetchRecentTransactions(connection, wallet, {
                            onStart: () => setIsLoadingTransactions(true),
                            onFinish: () => setIsLoadingTransactions(false)
                          });
                        }
                      }}
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  
                  <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {isLoadingTransactions && recentTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10">
                          <Loader2 className="w-8 h-8 text-purple-500 mb-3 animate-spin" />
                          <p className="text-gray-400 text-sm">Loading transactions...</p>
                        </div>
                      ) : recentTransactions.length > 0 ? (
                        <div className="divide-y divide-gray-800">
                          {recentTransactions.slice(0, displayedTransactions).map((tx) => (
                            <TransactionItemComponent
                              key={tx.id}
                              id={tx.id}
                              type={tx.type}
                              amount={tx.amount}
                              symbol={tx.symbol}
                              address={tx.address}
                              timestamp={tx.timestamp}
                              status={tx.status}
                              tokenIcon={tx.tokenIcon}
                            />
                          ))}
                          
                          <div className="p-4 text-center">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-purple-400"
                              onClick={recentTransactions.length > 5 ? toggleTransactionsDisplay : undefined}
                            >
                              {recentTransactions.length <= 5 ? "View all transactions" : 
                               displayedTransactions === 5 ? `Show all (${recentTransactions.length})` : "Show less"}
                              {displayedTransactions === 5 && <ExternalLink className="w-3 h-3 ml-1" />}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <Clock className="w-12 h-12 text-gray-500 mb-3 opacity-50" />
                          <h3 className="text-white text-lg font-medium mb-1">No transactions yet</h3>
                          <p className="text-gray-400 mb-4 max-w-xs mx-auto">
                            Your recent transactions will appear here
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
        </motion.div>
          </>
        )}
      </div>
    </CommonLayout>
  )
} 