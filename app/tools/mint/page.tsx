"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CommonLayout } from "@/components/common-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Gem,
  ArrowLeft,
  Loader2,
  Info,
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
    mintAuthority: true,
    currentSupply: "10000000"
  },
  {
    id: "2",
    name: "Test Token",
    symbol: "TEST",
    balance: "500000",
    decimals: 9,
    displayBalance: "500,000",
    mintAuthority: false,
    currentSupply: "5000000"
  },
  {
    id: "3",
    name: "Demo Coin",
    symbol: "DEMO",
    balance: "750000",
    decimals: 6,
    displayBalance: "750,000",
    mintAuthority: true,
    currentSupply: "7500000"
  }
]

export default function MintToken() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [recipientAddress, setRecipientAddress] = useState("");
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
  
  const handleMint = async () => {
    setIsProcessing(true);
    
    // Giả lập quá trình đúc token
    setTimeout(() => {
      setIsProcessing(false);
      alert("Đúc token thành công!");
      router.push("/tools");
    }, 2000);
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center mb-4">
            <Gem className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Đúc Token
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Đúc thêm token vào lượng cung lưu hành (cần quyền Mint Authority)
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
              <CardTitle className="text-white text-xl">Chi tiết đúc token</CardTitle>
              <CardDescription className="text-gray-400">
                Điền thông tin chi tiết để đúc thêm token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-900/20 border-blue-700 text-blue-100">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertTitle>Thông tin quan trọng</AlertTitle>
                <AlertDescription className="text-blue-200">
                  Bạn chỉ có thể đúc token nếu bạn có quyền Mint Authority đối với token đó.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="token" className="text-white">Chọn Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                    <SelectValue placeholder="Chọn token để đúc" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {mockTokens.map((token) => (
                      <SelectItem 
                        key={token.id} 
                        value={token.id}
                        disabled={!token.mintAuthority}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">{token.symbol.charAt(0)}</span>
                          </div>
                          <span>{token.name} ({token.symbol})</span>
                          {!token.mintAuthority && (
                            <span className="ml-2 text-red-400 text-xs">Không có quyền đúc</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentToken && (
                <div className="bg-gray-800/40 rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">Tổng cung hiện tại</p>
                    <p className="text-white font-medium">{parseInt(currentToken.currentSupply).toLocaleString()} {currentToken.symbol}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">Quyền mint</p>
                    <p className="text-green-400 font-medium">
                      {currentToken.mintAuthority ? "Có" : "Không"}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-white">Địa chỉ người nhận</Label>
                <Input
                  id="recipient"
                  placeholder="Địa chỉ ví Solana (Pubkey) hoặc để trống để đúc cho chính bạn"
                  className="bg-gray-800/70 border-gray-700 text-white"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Để trống để đúc token vào ví của bạn
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">Số lượng</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="Nhập số lượng token muốn đúc"
                  className="bg-gray-800/70 border-gray-700 text-white"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              
              <Separator className="bg-gray-700" />
              
              {currentToken && (
                <div className="rounded-md p-3">
                  <p className="text-sm text-gray-400 mb-1">Tổng cung sau khi đúc</p>
                  <p className="text-white font-medium text-lg">
                    {amount 
                      ? (parseInt(currentToken.currentSupply) + parseInt(amount || "0")).toLocaleString()
                      : parseInt(currentToken.currentSupply).toLocaleString()
                    } {currentToken.symbol}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!selectedToken || !amount || isProcessing || !currentToken?.mintAuthority}
                onClick={handleMint}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý
                  </>
                ) : (
                  <>
                    <Gem className="mr-2 h-4 w-4" /> Đúc Token
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-400 text-center">
                Giao dịch đúc token sẽ được xác nhận thông qua ví đã kết nối của bạn.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </CommonLayout>
  )
} 