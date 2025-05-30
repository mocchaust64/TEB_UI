"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import Link from "next/link"
import { CommonLayout } from "@/components/common-layout"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import {
  Coins,
  ArrowRight,
  ChevronRight,
  Clock,
  ExternalLink,
  Send,
  Banknote,
  Flame,
  BarChart3,
  Settings,
  Star,
  CalendarClock,
  Check,
  X,
  Download,
  Upload,
  QrCode,
  Share2,
  Copy,
  AlertCircle,
  AlertTriangle
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { getTokenDetails, TokenDetails } from "@/lib/services/tokenList"
import { PublicKey } from "@solana/web3.js"

// Mock dữ liệu biểu đồ giá
const priceData = [
  { name: '01/05', price: 0.045, volume: 12000 },
  { name: '05/05', price: 0.042, volume: 15000 },
  { name: '10/05', price: 0.047, volume: 18000 },
  { name: '15/05', price: 0.051, volume: 22000 },
  { name: '20/05', price: 0.049, volume: 19000 },
  { name: '25/05', price: 0.048, volume: 16000 },
  { name: '30/05', price: 0.050, volume: 21000 },
]

export default function TokenDetailsPage() {
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<TokenDetails | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { connection } = useConnection()
  const wallet = useWallet()
  
  useEffect(() => {
    // Chỉ tải dữ liệu nếu ví đã kết nối
    const loadData = async () => {
      if (!wallet.connected || !wallet.publicKey) {
        setError("Vui lòng kết nối ví để xem chi tiết token")
        setIsLoading(false)
        return
      }
      
      if (!params.id) {
        setError("Không tìm thấy token ID")
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        const tokenId = Array.isArray(params.id) ? params.id[0] : params.id
        
        // Lấy thông tin token từ blockchain
        const tokenDetails = await getTokenDetails(connection, wallet, tokenId)
        setToken(tokenDetails)
        
        // Trong trường hợp thực tế, bạn sẽ lấy trạng thái theo dõi từ API hoặc cơ sở dữ liệu
        setIsFollowing(false)
        
        setError(null)
      } catch (err) {
        console.error("Lỗi khi lấy thông tin token:", err)
        setError("Không thể tải thông tin token. Vui lòng thử lại sau.")
      } finally {
        setIsLoading(false)
        setMounted(true)
      }
    }
    
    loadData()
  }, [params, connection, wallet, wallet.connected, wallet.publicKey])

  const toggleFollowToken = () => {
    // Trong trường hợp thực tế, bạn sẽ gọi API để cập nhật trạng thái theo dõi
    setIsFollowing(!isFollowing)
    toast.success(isFollowing ? `Đã bỏ theo dõi ${token?.symbol}` : `Đã thêm ${token?.symbol} vào danh sách theo dõi`)
  }

  const copyWalletAddress = () => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey.toString())
      toast.success('Đã sao chép địa chỉ ví vào clipboard')
    }
  }
  
  // Hiển thị loading skeleton khi chưa mounted hoặc đang tải
  if (!mounted || isLoading) {
    return <PageLoadingSkeleton />
  }
  
  // Hiển thị thông báo lỗi
  if (error) {
    return (
      <CommonLayout>
        <div className="container mx-auto px-6 py-12">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Đã xảy ra lỗi</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button 
              variant="outline" 
              className="border-red-500 hover:bg-red-500/20 text-white"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>
          </div>
        </div>
      </CommonLayout>
    )
  }
  
  // Nếu không tìm thấy token
  if (!token) {
    return (
      <CommonLayout>
        <div className="container mx-auto px-6 py-12">
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Không tìm thấy token</h2>
            <p className="text-gray-300 mb-4">Token không tồn tại hoặc bạn không có quyền truy cập</p>
            <Link href="/tokens">
              <Button 
                variant="outline" 
                className="border-yellow-500 hover:bg-yellow-500/20 text-white"
              >
                Quay lại danh sách token
              </Button>
            </Link>
          </div>
        </div>
      </CommonLayout>
    )
  }
  
  return (
    <CommonLayout>
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-start justify-between mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <Link href="/tokens" className="text-gray-400 hover:text-white mr-2">Tokens</Link>
              <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
              <span className="text-white">{token.name}</span>
            </div>
            
            <div className="flex space-x-3">
              <Link href={`/tokens/${token.id}/transfer`}>
                <Button variant="outline" className="border-gray-700 hover:bg-gray-800 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Chuyển
                </Button>
              </Link>
              <Link href={`/tokens/${token.id}/manage`}>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Quản lý
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2"
          >
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mr-4">
                  {token.image ? (
                    <img src={token.image} alt={token.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <span className="text-white text-xl font-bold">{token.symbol.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mr-3">{token.name}</h1>
                    <span className="bg-gray-800 text-gray-300 text-sm px-2 py-0.5 rounded">
                      {token.symbol}
                    </span>
                    {isFollowing && (
                      <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        <Star className="w-3 h-3 mr-1" fill="currentColor" />
                        Đang theo dõi
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 mb-4 line-clamp-2">{token.description || `Token ${token.symbol} trên Solana blockchain.`}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Số dư</p>
                      <p className="text-white font-medium">{token.balance} {token.symbol}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Giá trị</p>
                      <p className="text-white font-medium">{token.value || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Giá</p>
                      <div className="flex items-center">
                        <span className="text-white font-medium mr-2">{token.price || 'N/A'}</span>
                        {token.change && (
                          <span className={token.positive ? "text-green-400" : "text-red-400"}>
                            {token.change}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Tổng cung</p>
                      <p className="text-white font-medium">{token.supply} {token.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {token.links?.website && (
                      <a 
                        href={token.links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.5 8.5-3-2.5a1 1 0 0 0-1.5 1V12a1 1 0 0 0 1.5 1l3-2.5a1 1 0 0 0 0-2Z"/>
                        </svg>
                        Website
                      </a>
                    )}
                    {token.links?.twitter && (
                      <a 
                        href={token.links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-blue-400 text-xs transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                        </svg>
                        Twitter
                      </a>
                    )}
                    {token.links?.telegram && (
                      <a 
                        href={token.links.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-blue-500 text-xs transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="m22 8-5 5-5-5 5-5-5 5-5-5 5 5-5 5 5-5"/>
                          <path d="M2 12h10"/>
                          <path d="M17 22v-8.3a4 4 0 0 0-4-4h-1.7"/>
                        </svg>
                        Telegram
                      </a>
                    )}
                    {token.links?.discord && (
                      <a 
                        href={token.links.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-indigo-400 text-xs transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M18 20a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3"/>
                          <path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                          <path d="M18 9a5 5 0 0 0-6-5 5 5 0 0 0-6 5v1a2 2 0 1 0 0 4"/>
                        </svg>
                        Discord
                      </a>
                    )}
                    {token.created && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs">
                        <CalendarClock className="w-3 h-3 mr-1" />
                        Tạo: {token.created}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="transactions" className="w-full">
              <TabsList className="bg-gray-800/50 border-b border-gray-700 w-full justify-start mb-6">
                <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Lịch sử giao dịch
                </TabsTrigger>
                <TabsTrigger value="chart" className="data-[state=active]:bg-gray-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Biểu đồ
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="transactions" className="mt-0">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg">Lịch sử giao dịch</CardTitle>
                    <CardDescription>Các giao dịch gần đây với token {token.symbol}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {token.transactions && token.transactions.length > 0 ? (
                      <div className="space-y-4">
                        {token.transactions.map((tx) => (
                          <div key={tx.id} className="bg-gray-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                {tx.type === 'receive' ? (
                                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                                    <Download className="w-4 h-4 text-green-400" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                                    <Upload className="w-4 h-4 text-blue-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-white font-medium">
                                    {tx.type === 'receive' ? 'Nhận' : 'Gửi'} {tx.amount} {token.symbol}
                                  </p>
                                  <p className="text-gray-400 text-sm">{tx.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-medium">{tx.value || '-'}</p>
                                <div className="flex items-center justify-end">
                                  <span className={`text-xs px-1.5 py-0.5 rounded flex items-center ${
                                    tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                                    tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {tx.status === 'completed' ? (
                                      <>
                                        <Check className="w-3 h-3 mr-1" />
                                        Thành công
                                      </>
                                    ) : tx.status === 'pending' ? (
                                      <>
                                        <Clock className="w-3 h-3 mr-1" />
                                        Đang xử lý
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-3 h-3 mr-1" />
                                        Thất bại
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-sm">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-400">Từ: </span>
                                  <span className="text-gray-300">{tx.from}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Đến: </span>
                                  <span className="text-gray-300">{tx.to}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Clock className="w-12 h-12 text-gray-500 mb-3" />
                        <h3 className="text-white text-lg font-medium mb-1">Chưa có giao dịch nào</h3>
                        <p className="text-gray-400">Token này chưa có giao dịch nào được ghi nhận</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="chart" className="mt-0">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg">Biểu đồ giá {token.symbol}</CardTitle>
                    <CardDescription>Biến động giá trong 30 ngày qua</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-white text-lg font-medium">{token.price || '$0.00'}</p>
                          <div className="flex items-center">
                            <span className={token.positive ? "text-green-400" : "text-red-400"}>
                              {token.change || '+0.00%'}
                            </span>
                            <span className="text-gray-400 text-sm ml-2">30 ngày qua</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="text-xs h-7 border-gray-700 hover:bg-gray-800 text-gray-300">1D</Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 border-gray-700 bg-gray-700 hover:bg-gray-800 text-white">7D</Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 border-gray-700 hover:bg-gray-800 text-gray-300">1M</Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 border-gray-700 hover:bg-gray-800 text-gray-300">3M</Button>
                        </div>
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={priceData}
                            margin={{
                              top: 5,
                              right: 0,
                              left: 0,
                              bottom: 5,
                            }}
                          >
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#888" 
                              fontSize={12}
                              tickLine={false}
                              axisLine={{ stroke: '#444' }}
                            />
                            <YAxis 
                              stroke="#888" 
                              fontSize={12}
                              tickLine={false}
                              axisLine={{ stroke: '#444' }}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '6px',
                                color: '#f3f4f6' 
                              }}
                              itemStyle={{ color: '#8884d8' }}
                              formatter={(value) => [`$${value}`, 'Giá']}
                              labelFormatter={(value) => `Ngày: ${value}`}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="price" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              fill="url(#colorPrice)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-gray-900/50 p-3 rounded-lg">
                          <p className="text-gray-400 text-xs mb-1">Giá cao nhất</p>
                          <p className="text-white font-medium">$0.052</p>
                        </div>
                        <div className="bg-gray-900/50 p-3 rounded-lg">
                          <p className="text-gray-400 text-xs mb-1">Giá thấp nhất</p>
                          <p className="text-white font-medium">$0.042</p>
                        </div>
                        <div className="bg-gray-900/50 p-3 rounded-lg">
                          <p className="text-gray-400 text-xs mb-1">Khối lượng 24h</p>
                          <p className="text-white font-medium">42,250 {token.symbol}</p>
                        </div>
                        <div className="bg-gray-900/50 p-3 rounded-lg">
                          <p className="text-gray-400 text-xs mb-1">Vốn hóa</p>
                          <p className="text-white font-medium">$50,000</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-1"
          >
            <Card className="bg-gray-900/50 border-gray-700 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center">
                  <Coins className="w-5 h-5 mr-2" />
                  Thông tin Token
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tên:</span>
                    <span className="text-white">{token.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Symbol:</span>
                    <span className="text-white">{token.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Decimals:</span>
                    <span className="text-white">{token.decimals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tổng cung:</span>
                    <span className="text-white">{token.supply}</span>
                  </div>
                </div>
                
                {token.extensions && token.extensions.length > 0 && (
                  <div className="pt-2 border-t border-gray-700">
                    <h4 className="text-white font-medium mb-2">Extensions</h4>
                    {token.extensions.map((ext, index) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-3 mb-2 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{ext.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            ext.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-600/50 text-gray-400'
                          }`}>
                            {ext.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">{ext.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Nhận Token</CardTitle>
                <CardDescription>Chia sẻ địa chỉ ví để nhận token</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  {showQrCode ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-3 rounded-lg mb-3">
                        <svg
                          className="w-40 h-40"
                          viewBox="0 0 200 200"
                          style={{ width: '100%', height: 'auto' }}
                        >
                          <rect width="200" height="200" fill="#FFFFFF" />
                          <path d="M40,40 L40,70 L70,70 L70,40 L40,40 Z M50,50 L60,50 L60,60 L50,60 L50,50 Z" fill="#000000" />
                          <path d="M80,40 L80,70 L110,70 L110,40 L80,40 Z M90,50 L100,50 L100,60 L90,60 L90,50 Z" fill="#000000" />
                          <path d="M120,40 L120,70 L150,70 L150,40 L120,40 Z M130,50 L140,50 L140,60 L130,60 L130,50 Z" fill="#000000" />
                          <path d="M40,80 L40,110 L70,110 L70,80 L40,80 Z M50,90 L60,90 L60,100 L50,100 L50,90 Z" fill="#000000" />
                          <path d="M80,80 L80,110 L110,110 L110,80 L80,80 Z M90,90 L100,90 L100,100 L90,100 L90,90 Z" fill="#000000" />
                          <path d="M120,80 L120,110 L150,110 L150,80 L120,80 Z M130,90 L140,90 L140,100 L130,100 L130,90 Z" fill="#000000" />
                          <path d="M40,120 L40,150 L70,150 L70,120 L40,120 Z M50,130 L60,130 L60,140 L50,140 L50,130 Z" fill="#000000" />
                          <path d="M80,120 L80,150 L110,150 L110,120 L80,120 Z M90,130 L100,130 L100,140 L90,140 L90,130 Z" fill="#000000" />
                          <path d="M120,120 L120,150 L150,150 L150,120 L120,120 Z M130,130 L140,130 L140,140 L130,140 L130,130 Z" fill="#000000" />
                        </svg>
                      </div>
                      <p className="text-gray-300 mb-2">Quét mã QR để chuyển token vào ví của bạn</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs border-gray-700 hover:bg-gray-800 text-white"
                        onClick={() => setShowQrCode(false)}
                      >
                        Ẩn mã QR
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-300 mb-3">Địa chỉ ví của bạn:</p>
                      <div className="bg-gray-900 p-2 rounded-lg flex items-center justify-between mb-4">
                        <code className="text-purple-400 text-sm">
                          {wallet.publicKey ? 
                            `${wallet.publicKey.toString().slice(0, 8)}...${wallet.publicKey.toString().slice(-8)}` : 
                            'Chưa kết nối ví'}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={copyWalletAddress}
                          disabled={!wallet.publicKey}
                        >
                          <Copy className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 text-xs border-gray-700 bg-gray-800 hover:bg-gray-700 text-white"
                          onClick={() => setShowQrCode(true)}
                          disabled={!wallet.publicKey}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Hiện mã QR
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 text-xs border-gray-700 bg-gray-800 hover:bg-gray-700 text-white"
                          disabled={!wallet.publicKey}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Chia sẻ
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Quản lý Token</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                <Link href={`/tools/transfer?token=${token.id}`}>
                  <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                    <Send className="w-4 h-4 mr-3" />
                    Gửi Token
                  </Button>
                </Link>
                <Link href={`/tools/mint?token=${token.id}`}>
                  <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                    <Banknote className="w-4 h-4 mr-3" />
                    Tạo thêm Token
                  </Button>
                </Link>
                <Link href={`/tools/burn?token=${token.id}`}>
                  <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                    <Flame className="w-4 h-4 mr-3" />
                    Đốt Token
                  </Button>
                </Link>
                <Link href={`/tools/freeze?token=${token.id}`}>
                  <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                    <Settings className="w-4 h-4 mr-3" />
                    Quản lý Token
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800"
                  onClick={toggleFollowToken}
                >
                  <Star className={`w-4 h-4 mr-3 ${isFollowing ? "fill-yellow-400" : ""}`} />
                  {isFollowing ? "Bỏ theo dõi" : "Thêm vào theo dõi"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </CommonLayout>
  )
} 