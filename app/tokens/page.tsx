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
  AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// Mock data cho các token
const myTokens = [
  {
    id: "1",
    name: "Sample Token",
    symbol: "SMPL",
    balance: "1,000,000",
    image: null,
    price: "$0.05",
    value: "$50,000",
    change: "+5.2%",
    positive: true
  },
  {
    id: "2",
    name: "Test Token",
    symbol: "TEST",
    balance: "500,000",
    image: null,
    price: "$0.02",
    value: "$10,000", 
    change: "-2.1%",
    positive: false
  },
  {
    id: "3",
    name: "Demo Coin",
    symbol: "DEMO",
    balance: "750,000",
    image: null,
    price: "$0.10",
    value: "$75,000",
    change: "+12.5%",
    positive: true
  }
]

export default function TokenPortfolio() {
  // Fix hydration mismatch bằng cách đảm bảo component
  // luôn render consistent giữa server và client
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTokens, setFilteredTokens] = useState<typeof myTokens>([])
  
  // Setup mounting state
  useEffect(() => {
    setMounted(true)
    setFilteredTokens(myTokens)
  }, [])
  
  // Lọc token khi search term thay đổi
  useEffect(() => {
    if (!mounted) return
    
    if (searchTerm.trim() === '') {
      setFilteredTokens(myTokens)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredTokens(myTokens.filter(token => 
        token.name.toLowerCase().includes(term) || 
        token.symbol.toLowerCase().includes(term)
      ))
    }
  }, [searchTerm, mounted])
  
  // Hiển thị loading skeleton cho đến khi component mounted trên client
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
            Quản lý và theo dõi các token của bạn
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gray-900/50 border-gray-700 col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Tổng giá trị tài sản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">$135,000</div>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-green-400 mr-1">+7.5%</span>
                <span className="text-gray-400">trong 24h qua</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700 col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Số token</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">3</div>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                Các token bạn sở hữu
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 border-gray-700 col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Bắt đầu</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-gray-300 mb-3">Tạo token mới hoặc quản lý token hiện có</p>
                <div className="flex space-x-3">
                  <Link href="/create">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-1" />
                      Tạo Token
                    </Button>
                  </Link>
                  <Link href="/tokens/manage">
                    <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                      <Wallet className="w-4 h-4 mr-1" />
                      Quản lý Token
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-white">Danh sách Token</h2>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Tìm token..." 
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
                Tokens của tôi
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="data-[state=active]:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9Z"/>
                  <path d="M15 12h-6"/>
                </svg>
                Theo dõi
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-tokens" className="mt-0">
              {filteredTokens.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredTokens.map((token) => (
                    <Link href={`/tokens/${token.id}`} key={token.id}>
                      <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mr-3">
                                <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{token.name}</h3>
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-400 mr-2">{token.symbol}</span>
                                  <span className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded">
                                    {token.balance} {token.symbol}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-white font-medium">{token.value}</div>
                              <div className={`text-sm flex items-center justify-end ${token.positive ? 'text-green-400' : 'text-red-400'}`}>
                                {token.price}
                                <span className="ml-2">{token.change}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-12 h-12 text-gray-500 mb-3" />
                    <h3 className="text-white text-lg font-medium mb-1">Không tìm thấy token nào</h3>
                    <p className="text-gray-400 mb-4">Không tìm thấy token phù hợp với từ khóa tìm kiếm</p>
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-white hover:bg-gray-800"
                      onClick={() => setSearchTerm('')}
                    >
                      Xóa tìm kiếm
                    </Button>
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
                  <h3 className="text-white text-lg font-medium mb-1">Danh sách theo dõi trống</h3>
                  <p className="text-gray-400 mb-4">Thêm các token vào danh sách theo dõi để xem chúng ở đây</p>
                  <Link href="/tokens/discover">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      Khám phá token
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </CommonLayout>
  )
} 