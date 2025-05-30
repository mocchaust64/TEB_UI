"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CommonLayout } from "@/components/common-layout"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Coins, 
  Plus, 
  Wallet, 
  Search,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { getUserTokens, TokenItem } from "@/lib/services/tokenList"
import { toast } from "sonner"
import { WalletButton } from "@/components/wallet-button"
import { Badge } from "@/components/ui/badge"
import { getUserTransactions, TransactionItem } from "@/lib/services/transaction-service"

// Đặt key cho localStorage và thời gian cache (5 phút)
const TOKENS_STORAGE_KEY = 'tokenui-cached-tokens'
const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 phút tính bằng mili-giây

// Interface cho dữ liệu được cache
interface CachedTokenData {
  tokens: TokenItem[]
  publicKey: string
  timestamp: number
  totalValue: string
}

// Interface cho giao dịch
interface Transaction {
  id: string;
  type: 'receive' | 'send' | 'swap' | 'mint' | 'burn';
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
  const [searchTerm, setSearchTerm] = useState("")
  const [tokens, setTokens] = useState<TokenItem[]>([])
  const [filteredTokens, setFilteredTokens] = useState<TokenItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [totalValue, setTotalValue] = useState("0")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const [tokensPerPage] = useState(5)
  const [paginatedTokens, setPaginatedTokens] = useState<TokenItem[]>([])
  const [totalPages, setTotalPages] = useState(1)
  
  // Get wallet and connection
  const wallet = useWallet()
  const { publicKey, connected } = wallet
  const { connection } = useConnection()
  
  // Setup mounting state
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Hàm lưu dữ liệu token vào localStorage
  const saveTokensToCache = (tokenData: TokenItem[], totalValue: string) => {
    if (!publicKey) return

    const cacheData: CachedTokenData = {
      tokens: tokenData,
      publicKey: publicKey.toString(),
      timestamp: Date.now(),
      totalValue
    }

    try {
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error saving tokens to cache:", error)
    }
  }

  // Hàm đọc dữ liệu token từ localStorage
  const getTokensFromCache = (): CachedTokenData | null => {
    if (!publicKey) return null

    try {
      const cachedData = localStorage.getItem(TOKENS_STORAGE_KEY)
      if (!cachedData) return null

      const parsedData: CachedTokenData = JSON.parse(cachedData)
      
      // Kiểm tra xem dữ liệu có thuộc về ví hiện tại không
      if (parsedData.publicKey !== publicKey.toString()) return null
      
      // Kiểm tra xem dữ liệu có hết hạn không
      if (Date.now() - parsedData.timestamp > CACHE_EXPIRY_TIME) return null
      
      return parsedData
    } catch (error) {
      console.error("Error reading tokens from cache:", error)
      return null
    }
  }

  // Hàm fetch token từ blockchain
  const fetchTokensFromBlockchain = async (forceRefresh = false) => {
    if (!publicKey || !connection) return
    
    try {
      setIsLoading(true)
      setIsError(false)
      if (forceRefresh) setIsRefreshing(true)
      
      // Fetch tokens from blockchain
      const userTokens = await getUserTokens(connection, wallet)
      
      // Sort tokens by balance (largest first)
      userTokens.sort((a, b) => {
        const balanceA = parseFloat(a.balance) || 0
        const balanceB = parseFloat(b.balance) || 0
        return balanceB - balanceA
      })
      
      setTokens(userTokens)
      setFilteredTokens(userTokens)
      
      // Calculate total value (if price data is available)
      const total = userTokens.reduce((acc, token) => {
        if (token.price) {
          const price = parseFloat(token.price.replace('$', '')) || 0
          const balance = parseFloat(token.balance) || 0
          return acc + (price * balance)
        }
        return acc
      }, 0)
      
      const formattedTotal = total.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 2
      })
      
      setTotalValue(formattedTotal)
      setLastUpdated(new Date())
      
      // Cache the fetched data
      saveTokensToCache(userTokens, formattedTotal)
      
      return userTokens
    } catch (error) {
      console.error("Error fetching tokens:", error)
      setIsError(true)
      toast.error("Failed to fetch token data")
      return null
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  // Hàm lấy dữ liệu giao dịch gần đây từ blockchain
  const fetchRecentTransactions = async () => {
    if (!publicKey || !connection) return
    
    try {
      setIsLoadingTransactions(true)
      
      // Gọi service để lấy dữ liệu giao dịch thật từ blockchain
      const transactionData = await getUserTransactions(connection, wallet, 10)
      
      // Chuyển đổi từ TransactionItem sang Transaction
      const transactions: Transaction[] = transactionData.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        symbol: tx.symbol,
        address: tx.address,
        timestamp: tx.timestamp,
        status: tx.status === 'confirmed' ? 'confirmed' : 
                tx.status === 'processing' ? 'processing' : 'failed',
        tokenIcon: tx.tokenIcon
      }))
      
      setRecentTransactions(transactions)
      
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Failed to load recent transactions")
    } finally {
      setIsLoadingTransactions(false)
    }
  };
  
  // Fetch tokens when wallet connects
  useEffect(() => {
    if (!mounted || !connected || !publicKey || !connection) return
    
    const loadTokens = async () => {
      // Try to get data from cache first
      const cachedData = getTokensFromCache()
      
      if (cachedData) {
        // Use cached data
        setTokens(cachedData.tokens)
        setFilteredTokens(cachedData.tokens)
        setTotalValue(cachedData.totalValue)
        setLastUpdated(new Date(cachedData.timestamp))
        
        // Optional: Fetch fresh data in the background
        fetchTokensFromBlockchain(false)
      } else {
        // No valid cache, fetch from blockchain
        await fetchTokensFromBlockchain(false)
      }
    }
    
    loadTokens()
    fetchRecentTransactions()
  }, [mounted, connected, publicKey, connection, wallet])
  
  // Filter tokens when search term changes
  useEffect(() => {
    if (!mounted) return
    
    if (searchTerm.trim() === '') {
      setFilteredTokens(tokens)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredTokens(tokens.filter(token => 
        token.name.toLowerCase().includes(term) || 
        token.symbol.toLowerCase().includes(term)
      ))
    }
  }, [searchTerm, tokens, mounted])
  
  // Tính toán phân trang khi tokens hoặc trang hiện tại thay đổi
  useEffect(() => {
    if (!mounted) return
    
    // Tính toán số trang
    const total = Math.ceil(filteredTokens.length / tokensPerPage)
    setTotalPages(total || 1) // Tối thiểu là 1 trang
    
    // Điều chỉnh trang hiện tại nếu vượt quá số trang
    if (currentPage > total && total > 0) {
      setCurrentPage(1)
    }
    
    // Lấy token cho trang hiện tại
    const startIndex = (currentPage - 1) * tokensPerPage
    const endIndex = startIndex + tokensPerPage
    setPaginatedTokens(filteredTokens.slice(startIndex, endIndex))
    
  }, [filteredTokens, currentPage, tokensPerPage, mounted])
  
  // Di chuyển đến trang trước
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }
  
  // Di chuyển đến trang tiếp theo
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }
  
  // Hiển thị các trang xung quanh trang hiện tại
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Tối đa số trang hiển thị
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = startPage + maxPagesToShow - 1
    
    if (endPage > totalPages) {
      endPage = totalPages
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    
    return pageNumbers
  }
  
  // Handler to manually refresh token data
  const handleRefresh = () => {
    fetchTokensFromBlockchain(true)
    fetchRecentTransactions()
  }
  
  // Show loading skeleton until component mounted on client
  if (!mounted) {
    return <PageLoadingSkeleton />
  }

  // Hàm hiển thị icon cho loại giao dịch
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'swap':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M17 3v10" />
            <path d="m21 7-4-4-4 4" />
            <path d="M7 21v-10" />
            <path d="m3 17 4 4 4-4" />
          </svg>
        );
      case 'mint':
        return <Plus className="w-4 h-4 text-purple-500" />;
      case 'burn':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
            <path d="M12 2v8" />
            <path d="m4.93 10.93 1.41 1.41" />
            <path d="M2 18h2" />
            <path d="M20 18h2" />
            <path d="m19.07 10.93-1.41 1.41" />
            <path d="M22 22H2" />
            <path d="m16 6-4 4-4-4" />
            <path d="M16 18a4 4 0 0 0-8 0" />
          </svg>
        );
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Hàm định dạng địa chỉ rút gọn
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  // Hàm định dạng thời gian giao dịch
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return timestamp.toLocaleDateString();
  };

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
                {/* Cột bên trái - Danh sách token */}
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
                    <Link href={`/tokens/${token.id}`} key={token.id}>
                      <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center mr-3">
                                          {token.image ? (
                                            <img 
                                              src={token.image}
                                              alt={token.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                                <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
                                            </div>
                                          )}
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{token.name}</h3>
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-400 mr-2">{token.symbol}</span>
                                  <span className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded">
                                              {parseFloat(token.balance).toLocaleString()} {token.symbol}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                                        {token.value && (
                              <div className="text-white font-medium">{token.value}</div>
                                        )}
                                        {token.price && (
                              <div className={`text-sm flex items-center justify-end ${token.positive ? 'text-green-400' : 'text-red-400'}`}>
                                {token.price}
                                            {token.change && <span className="ml-2">{token.change}</span>}
                              </div>
                                        )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                          </div>
                          
                          {/* Điều khiển phân trang */}
                          <div className="flex items-center justify-between mt-6 text-sm">
                            <div className="text-gray-400">
                              Showing {Math.min(filteredTokens.length, (currentPage - 1) * tokensPerPage + 1)}-{Math.min(filteredTokens.length, currentPage * tokensPerPage)} of {filteredTokens.length} tokens
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="w-8 h-8 p-0 border-gray-700"
                                onClick={goToPreviousPage} 
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              
                              {getPageNumbers().map(pageNumber => (
                                <Button 
                                  key={pageNumber}
                                  variant={pageNumber === currentPage ? "default" : "outline"} 
                                  size="icon" 
                                  className={`w-8 h-8 p-0 ${pageNumber === currentPage ? 'bg-purple-600 border-purple-600' : 'border-gray-700'}`}
                                  onClick={() => setCurrentPage(pageNumber)}
                                >
                                  {pageNumber}
                                </Button>
                              ))}
                              
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="w-8 h-8 p-0 border-gray-700"
                                onClick={goToNextPage} 
                                disabled={currentPage === totalPages}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
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
                
                {/* Cột bên phải - Giao dịch gần đây */}
                <div className="lg:col-span-1">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
                    <Button variant="ghost" size="sm" onClick={() => fetchRecentTransactions()}>
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
                          {recentTransactions.map((tx) => (
                            <div key={tx.id} className="p-4 hover:bg-gray-800/30">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 mr-3">
                                    {getTransactionIcon(tx.type)}
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <span className="text-white font-medium mr-2 capitalize">
                                        {tx.type}
                                      </span>
                                      <Badge variant="outline" className="text-xs px-1.5 border-gray-700 text-gray-400">
                                        {tx.status}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-0.5">
                                      {formatAddress(tx.address)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-medium ${tx.type === 'receive' || tx.type === 'mint' ? 'text-green-400' : tx.type === 'send' || tx.type === 'burn' ? 'text-red-400' : 'text-blue-400'}`}>
                                    {tx.type === 'receive' || tx.type === 'mint' ? '+' : tx.type === 'send' || tx.type === 'burn' ? '-' : ''}{tx.amount} {tx.symbol}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {formatTimestamp(tx.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="p-4 text-center">
                            <Button variant="link" size="sm" className="text-purple-400">
                              View all transactions
                              <ExternalLink className="w-3 h-3 ml-1" />
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