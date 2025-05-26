"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CommonLayout } from "@/components/common-layout"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Coins,
  ChevronRight,
  Send,
  Info,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Copy,
  Clock,
  RotateCcw
} from "lucide-react"

// Mock dữ liệu token
const tokenDetails = {
  id: "1",
  name: "Sample Token",
  symbol: "SMPL",
  balance: "580,000",
  decimals: 9
}

export default function TokenTransferPage() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<any>(null)
  
  const [recipientAddress, setRecipientAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [selectedPercentage, setSelectedPercentage] = useState(0)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferSuccess, setTransferSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  
  // Tính toán số token tối đa có thể chuyển
  const maxAmount = 580000
  const calculatedAmount = (maxAmount * selectedPercentage / 100).toFixed(2)
  
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
  
  useEffect(() => {
    if (!mounted) return
    
    if (selectedPercentage > 0) {
      setAmount(calculatedAmount)
    }
  }, [selectedPercentage, calculatedAmount, mounted])
  
  const handleTransfer = () => {
    // Reset error
    setErrorMsg("")
    
    // Validate inputs
    if (!recipientAddress.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ người nhận")
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg("Vui lòng nhập số lượng token hợp lệ")
      return
    }
    
    if (parseFloat(amount) > maxAmount) {
      setErrorMsg("Số lượng token vượt quá số dư của bạn")
      return
    }
    
    // Simulate transfer
    setIsTransferring(true)
    
    // Mô phỏng gửi token (sẽ được thay bằng API thực tế)
    setTimeout(() => {
      setIsTransferring(false)
      setTransferSuccess(true)
    }, 2000)
  }
  
  const resetForm = () => {
    setRecipientAddress("")
    setAmount("")
    setMemo("")
    setSelectedPercentage(0)
    setTransferSuccess(false)
  }
  
  const handleAmountChange = (value: string) => {
    setAmount(value)
    
    // Calculate percentage based on amount
    const amountNum = parseFloat(value) || 0
    const percentage = Math.min((amountNum / maxAmount) * 100, 100)
    setSelectedPercentage(percentage)
  }
  
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
          <div className="flex items-center mb-8">
            <Link href="/tokens" className="text-gray-400 hover:text-white">Tokens</Link>
            <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
            <Link href={`/tokens/${token.id}`} className="text-gray-400 hover:text-white">{token.name}</Link>
            <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
            <span className="text-white">Chuyển Token</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
            <Send className="w-7 h-7 mr-3 text-purple-400" />
            Chuyển Token {token.symbol}
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2"
          >
            {transferSuccess ? (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-white text-2xl font-bold mb-2">Chuyển token thành công!</h2>
                    <p className="text-gray-400 mb-6">
                      Đã chuyển {amount} {token.symbol} đến địa chỉ người nhận thành công.
                    </p>
                    
                    <div className="w-full max-w-md bg-gray-800/50 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Người nhận:</span>
                        <span className="text-white font-medium">{recipientAddress}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Số lượng:</span>
                        <span className="text-white font-medium">{amount} {token.symbol}</span>
                      </div>
                      {memo && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Ghi chú:</span>
                          <span className="text-white font-medium">{memo}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-4">
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => router.push(`/tokens/${token.id}`)}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Trở về Token
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-700 hover:bg-gray-800 text-white"
                        onClick={resetForm}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Tạo giao dịch mới
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Thông tin chuyển token</CardTitle>
                  <CardDescription>Nhập thông tin để chuyển token của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {errorMsg && (
                    <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                      <AlertCircle className="w-4 h-4" />
                      <AlertTitle>Lỗi</AlertTitle>
                      <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="recipient" className="text-white">Địa chỉ người nhận</label>
                      <Button 
                        variant="ghost" 
                        className="h-6 p-0 text-xs text-purple-400 hover:text-purple-300"
                        onClick={() => {/* Paste from clipboard */}}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Dán
                      </Button>
                    </div>
                    <Input
                      id="recipient"
                      placeholder="Nhập địa chỉ ví người nhận"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="amount" className="text-white">Số lượng</label>
                      <span className="text-gray-400 text-sm">
                        Số dư: {token.balance} {token.symbol}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        className="bg-gray-800 border-gray-700 text-white pr-16"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-400">{token.symbol}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                      <Slider
                        value={[selectedPercentage]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => setSelectedPercentage(value[0])}
                      />
                    </div>
                    
                    <div className="flex justify-between gap-2 pt-1">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button 
                          key={percent} 
                          variant="outline" 
                          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 flex-1 h-8 text-xs"
                          onClick={() => setSelectedPercentage(percent)}
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="memo" className="text-white">Ghi chú (tùy chọn)</label>
                    <Input
                      id="memo"
                      placeholder="Nhập ghi chú cho giao dịch này"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-center">
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg w-full md:w-auto"
                      onClick={handleTransfer}
                      disabled={isTransferring}
                    >
                      {isTransferring ? (
                        <>
                          <Clock className="w-5 h-5 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Gửi Token
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-1"
          >
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Thông tin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  Khi chuyển token, vui lòng đảm bảo:
                </p>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 shrink-0 mt-1" />
                    <span>Địa chỉ người nhận chính xác</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 shrink-0 mt-1" />
                    <span>Số lượng token nằm trong số dư hiện có của bạn</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 shrink-0 mt-1" />
                    <span>Bạn có đủ SOL để trả phí giao dịch</span>
                  </li>
                </ul>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex">
                    <Info className="w-4 h-4 text-blue-400 mr-2 shrink-0 mt-1" />
                    <p className="text-blue-300 text-sm">
                      Token này có tính năng <strong>Transfer Fee</strong> với mức phí 1.5% cho mỗi giao dịch.
                    </p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-700">
                  <h4 className="text-white font-medium mb-2">Chi tiết phí</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phí giao dịch:</span>
                      <span className="text-white">~0.000005 SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phí chuyển token (1.5%):</span>
                      <span className="text-white">{amount ? (parseFloat(amount) * 0.015).toFixed(2) : '0.00'} {token.symbol}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1">
                      <span className="text-gray-300">Số token thực nhận:</span>
                      <span className="text-white">{amount ? (parseFloat(amount) * 0.985).toFixed(2) : '0.00'} {token.symbol}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </CommonLayout>
  )
} 