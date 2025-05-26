"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CommonLayout } from "@/components/common-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Layers,
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

// Dữ liệu mẫu
const mockTokens = [
  {
    id: "1",
    name: "Sample Token",
    symbol: "SMPL",
    balance: "1000000",
    decimals: 9,
    displayBalance: "1,000,000",
    burnAuthority: true
  },
  {
    id: "2",
    name: "Test Token",
    symbol: "TEST",
    balance: "500000",
    decimals: 9,
    displayBalance: "500,000",
    burnAuthority: true
  },
  {
    id: "3",
    name: "Demo Coin",
    symbol: "DEMO",
    balance: "750000",
    decimals: 6,
    displayBalance: "750,000",
    burnAuthority: false
  }
]

export default function BurnToken() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentToken, setCurrentToken] = useState<any>(null);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (selectedToken) {
      const token = mockTokens.find(t => t.id === selectedToken);
      setCurrentToken(token);
    } else {
      setCurrentToken(null);
    }
  }, [selectedToken]);
  
  const handleBurn = async () => {
    setIsProcessing(true);
    
    // Giả lập quá trình đốt token
    setTimeout(() => {
      setIsProcessing(false);
      alert("Đốt token thành công!");
      router.push("/tools");
    }, 2000);
  };
  
  const handleMaxAmount = () => {
    if (currentToken) {
      setAmount(currentToken.balance);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black/[0.96] antialiased">
        <div className="container mx-auto py-12">
          <div className="h-screen flex items-center justify-center">
            <div className="w-full max-w-xl bg-gray-900/50 border border-gray-700 rounded-lg p-8">
              <div className="h-8 w-48 bg-gray-700/50 rounded mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-700/50 rounded"></div>
                <div className="h-10 bg-gray-700/50 rounded"></div>
                <div className="h-10 bg-gray-700/50 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CommonLayout>
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white p-0 flex items-center gap-1"
            onClick={() => router.push("/tools")}
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
        </div>
      
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Đốt Token
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Đốt (hủy) token vĩnh viễn để giảm lượng cung lưu hành
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-xl"
        >
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-xl">Chi tiết đốt token</CardTitle>
              <CardDescription className="text-gray-400">
                Điền thông tin chi tiết để đốt token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-red-900/20 border-red-700 text-red-100">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle>Cảnh báo quan trọng</AlertTitle>
                <AlertDescription className="text-red-200">
                  Token đã đốt sẽ bị hủy vĩnh viễn và không thể khôi phục. Hãy kiểm tra kỹ số lượng trước khi thực hiện.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="token" className="text-white">Chọn Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                    <SelectValue placeholder="Chọn token để đốt" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {mockTokens.map((token) => (
                      <SelectItem 
                        key={token.id} 
                        value={token.id}
                        disabled={!token.burnAuthority}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">{token.symbol.charAt(0)}</span>
                          </div>
                          <span>{token.name} ({token.symbol})</span>
                          {!token.burnAuthority && (
                            <span className="ml-2 text-red-400 text-xs">Không thể đốt</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentToken && (
                <div className="bg-gray-800/40 rounded-md p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">Số dư hiện tại</p>
                    <p className="text-white font-medium">{currentToken.displayBalance} {currentToken.symbol}</p>
                  </div>
                  <div className="text-right">
                    <Button 
                      variant="ghost" 
                      className="text-red-400 hover:text-red-300 text-sm p-1"
                      onClick={handleMaxAmount}
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">Số lượng muốn đốt</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="Nhập số lượng token muốn đốt"
                  className="bg-gray-800/70 border-gray-700 text-white"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              
              <Separator className="bg-gray-700" />
              
              {currentToken && amount && (
                <div className="bg-gray-800/40 rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">Số dư hiện tại</p>
                    <p className="text-white font-medium">{currentToken.displayBalance} {currentToken.symbol}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">Số dư sau khi đốt</p>
                    <p className="text-white font-medium">
                      {(parseInt(currentToken.balance) - parseInt(amount || "0")).toLocaleString()} {currentToken.symbol}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={!selectedToken || !amount || isProcessing || !currentToken?.burnAuthority}
                onClick={handleBurn}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý
                  </>
                ) : (
                  <>
                    <Layers className="mr-2 h-4 w-4" /> Đốt Token
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-400 text-center">
                Giao dịch đốt token sẽ được xác nhận thông qua ví đã kết nối của bạn.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </CommonLayout>
  )
} 