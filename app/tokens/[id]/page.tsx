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
  Upload
} from "lucide-react"

// Mock dữ liệu chi tiết token
const tokenDetails = {
  id: "1",
  name: "Sample Token",
  symbol: "SMPL",
  supply: "1,000,000",
  decimals: "9",
  balance: "580,000",
  value: "$29,000",
  price: "$0.05",
  change: "+5.2%",
  positive: true,
  description: "Token mẫu được tạo ra để trình diễn các tính năng của Token UI. Đây là token với các tính năng mở rộng như transfer tax và metadata.",
  created: "28/05/2023",
  transactions: [
    {
      id: "tx1",
      type: "receive",
      amount: "150,000 SMPL",
      from: "0x1234...5678",
      to: "Your wallet",
      date: "25/05/2024",
      value: "$7,500",
      status: "completed"
    },
    {
      id: "tx2",
      type: "send",
      amount: "50,000 SMPL",
      from: "Your wallet",
      to: "0x9876...5432",
      date: "23/05/2024",
      value: "$2,500",
      status: "completed"
    },
    {
      id: "tx3",
      type: "receive",
      amount: "400,000 SMPL",
      from: "0x2468...1357",
      to: "Your wallet",
      date: "20/05/2024",
      value: "$20,000",
      status: "completed"
    }
  ],
  extensions: [
    {
      name: "Transfer Fee",
      status: "active",
      details: "1.5% per transaction"
    },
    {
      name: "Metadata",
      status: "active",
      details: "URI: https://example.com/metadata/smpl.json"
    }
  ],
  links: {
    website: "https://example.com",
    twitter: "https://twitter.com/sampletoken",
    telegram: "https://t.me/sampletoken",
    discord: "https://discord.gg/sampletoken"
  }
}

export default function TokenDetailsPage() {
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<any>(null)
  
  useEffect(() => {
    // Mô phỏng việc tải dữ liệu
    const loadData = async () => {
      // Trong một ứng dụng thực tế, bạn sẽ lấy thông tin token từ API
      // dựa trên params.id
      setToken(tokenDetails)
      setMounted(true)
    }
    
    loadData()
  }, [params])
  
  // Hiển thị loading skeleton khi chưa mounted
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
                  <span className="text-white text-xl font-bold">{token.symbol.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mr-3">{token.name}</h1>
                    <span className="bg-gray-800 text-gray-300 text-sm px-2 py-0.5 rounded">
                      {token.symbol}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4 line-clamp-2">{token.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Số dư</p>
                      <p className="text-white font-medium">{token.balance} {token.symbol}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Giá trị</p>
                      <p className="text-white font-medium">{token.value}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Giá</p>
                      <div className="flex items-center">
                        <span className="text-white font-medium mr-2">{token.price}</span>
                        <span className={token.positive ? "text-green-400" : "text-red-400"}>
                          {token.change}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Tổng cung</p>
                      <p className="text-white font-medium">{token.supply} {token.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {token.links.website && (
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
                    {token.links.twitter && (
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
                    {token.links.telegram && (
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
                    {token.links.discord && (
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
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs">
                      <CalendarClock className="w-3 h-3 mr-1" />
                      Tạo: {token.created}
                    </div>
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
                    {token.transactions.length > 0 ? (
                      <div className="space-y-4">
                        {token.transactions.map((tx: any) => (
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
                                    {tx.type === 'receive' ? 'Nhận' : 'Gửi'} {tx.amount}
                                  </p>
                                  <p className="text-gray-400 text-sm">{tx.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-medium">{tx.value}</p>
                                <div className="flex items-center justify-end">
                                  <span className={`text-xs px-1.5 py-0.5 rounded flex items-center ${
                                    tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {tx.status === 'completed' ? (
                                      <>
                                        <Check className="w-3 h-3 mr-1" />
                                        Thành công
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 mr-1" />
                                        Đang xử lý
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
                  <CardContent className="flex items-center justify-center p-8 min-h-[300px]">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                      <h3 className="text-white text-lg font-medium mb-1">Đang phát triển</h3>
                      <p className="text-gray-400 max-w-md">
                        Chức năng biểu đồ giá đang được phát triển và sẽ có mặt trong bản cập nhật sắp tới
                      </p>
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
                
                <div className="pt-2 border-t border-gray-700">
                  <h4 className="text-white font-medium mb-2">Extensions</h4>
                  {token.extensions.map((ext: any, index: number) => (
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
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Quản lý Token</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                <Link href={`/tokens/${token.id}/transfer`}>
                  <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                    <Send className="w-4 h-4 mr-3" />
                    Gửi Token
                  </Button>
                </Link>
                <Link href={`/tokens/${token.id}/manage/mint`}>
                  <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                    <Banknote className="w-4 h-4 mr-3" />
                    Tạo thêm Token
                  </Button>
                </Link>
                <Link href={`/tokens/${token.id}/manage/burn`}>
                  <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                    <Flame className="w-4 h-4 mr-3" />
                    Đốt Token
                  </Button>
                </Link>
                <Link href={`/tokens/${token.id}/manage`}>
                  <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                    <Settings className="w-4 h-4 mr-3" />
                    Thiết lập Token
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800">
                  <Star className="w-4 h-4 mr-3" />
                  Thêm vào theo dõi
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </CommonLayout>
  )
} 