"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CommonLayout } from "@/components/common-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Info,
  LockIcon,
  UnlockIcon
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
    freezeAuthority: true
  },
  {
    id: "2",
    name: "Test Token",
    symbol: "TEST",
    balance: "500000",
    decimals: 9,
    displayBalance: "500,000",
    freezeAuthority: false
  },
  {
    id: "3",
    name: "Demo Coin",
    symbol: "DEMO",
    balance: "750000",
    decimals: 6,
    displayBalance: "750,000",
    freezeAuthority: true
  }
]

// Dữ liệu mẫu các tài khoản token
const mockAccounts = [
  {
    id: "acc1",
    address: "3xyzABC...",
    owner: "Người dùng A",
    balance: "200,000",
    isFrozen: false
  },
  {
    id: "acc2",
    address: "4abcDEF...",
    owner: "Người dùng B",
    balance: "350,000",
    isFrozen: true
  },
  {
    id: "acc3",
    address: "5lmnGHI...",
    owner: "Người dùng C",
    balance: "120,000",
    isFrozen: false
  }
]

export default function FreezeToken() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
  const [freezeAction, setFreezeAction] = useState<"freeze" | "unfreeze">("freeze");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentToken, setCurrentToken] = useState<any>(null);
  const [currentAccount, setCurrentAccount] = useState<any>(null);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (selectedToken) {
      const token = mockTokens.find(t => t.id === selectedToken);
      setCurrentToken(token);
      setSelectedAccount(undefined);
      setCurrentAccount(null);
    } else {
      setCurrentToken(null);
      setSelectedAccount(undefined);
      setCurrentAccount(null);
    }
  }, [selectedToken]);
  
  useEffect(() => {
    if (selectedAccount) {
      const account = mockAccounts.find(a => a.id === selectedAccount);
      setCurrentAccount(account);
      if (account?.isFrozen) {
        setFreezeAction("unfreeze");
      } else {
        setFreezeAction("freeze");
      }
    } else {
      setCurrentAccount(null);
    }
  }, [selectedAccount]);
  
  const handleFreeze = async () => {
    setIsProcessing(true);
    
    // Giả lập quá trình đóng băng/mở đóng băng token
    setTimeout(() => {
      setIsProcessing(false);
      if (freezeAction === "freeze") {
        alert("Đóng băng tài khoản token thành công!");
      } else {
        alert("Mở đóng băng tài khoản token thành công!");
      }
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Đóng Băng Token
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Đóng băng hoặc mở đóng băng tài khoản token (với quyền Freeze)
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
              <CardTitle className="text-white text-xl">Chi tiết đóng băng token</CardTitle>
              <CardDescription className="text-gray-400">
                Điền thông tin chi tiết để đóng băng hoặc mở đóng băng tài khoản token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-cyan-900/20 border-cyan-700 text-cyan-100">
                <Info className="h-4 w-4 text-cyan-400" />
                <AlertTitle>Thông tin quan trọng</AlertTitle>
                <AlertDescription className="text-cyan-200">
                  Bạn chỉ có thể đóng băng tài khoản token nếu bạn có quyền Freeze Authority đối với token đó.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="token" className="text-white">Chọn Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                    <SelectValue placeholder="Chọn token để đóng băng/mở đóng băng tài khoản" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {mockTokens.map((token) => (
                      <SelectItem 
                        key={token.id} 
                        value={token.id}
                        disabled={!token.freezeAuthority}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">{token.symbol.charAt(0)}</span>
                          </div>
                          <span>{token.name} ({token.symbol})</span>
                          {!token.freezeAuthority && (
                            <span className="ml-2 text-red-400 text-xs">Không có quyền đóng băng</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentToken?.freezeAuthority && (
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-white">Chọn tài khoản token</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                      <SelectValue placeholder="Chọn tài khoản token để đóng băng/mở đóng băng" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {mockAccounts.map((account) => (
                        <SelectItem 
                          key={account.id} 
                          value={account.id}
                        >
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                              {account.isFrozen ? (
                                <LockIcon className="h-3 w-3 text-cyan-400" />
                              ) : (
                                <UnlockIcon className="h-3 w-3 text-gray-300" />
                              )}
                            </div>
                            <span>{account.address} ({account.owner})</span>
                            <span className="ml-2 text-gray-400">- {account.balance}</span>
                            {account.isFrozen && (
                              <span className="ml-2 text-cyan-400 text-xs">Đã đóng băng</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {currentAccount && (
                <>
                  <div className="bg-gray-800/40 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Địa chỉ tài khoản</p>
                      <p className="text-white font-medium">{currentAccount.address}</p>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Chủ sở hữu</p>
                      <p className="text-white font-medium">{currentAccount.owner}</p>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Số dư</p>
                      <p className="text-white font-medium">{currentAccount.balance} {currentToken?.symbol}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400">Trạng thái hiện tại</p>
                      <p className={`font-medium ${currentAccount.isFrozen ? 'text-cyan-400' : 'text-green-400'}`}>
                        {currentAccount.isFrozen ? 'Đã đóng băng' : 'Đang hoạt động'}
                      </p>
                    </div>
                  </div>
                
                  <div className="space-y-2">
                    <Label className="text-white">Hành động</Label>
                    <RadioGroup value={freezeAction} onValueChange={(value: "freeze" | "unfreeze") => setFreezeAction(value)} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="freeze" 
                          id="freeze" 
                          disabled={currentAccount.isFrozen}
                          className="border-cyan-600 text-cyan-600"
                        />
                        <Label htmlFor="freeze" className={`${currentAccount.isFrozen ? 'text-gray-500' : 'text-white'}`}>
                          Đóng băng tài khoản
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="unfreeze" 
                          id="unfreeze"
                          disabled={!currentAccount.isFrozen}
                          className="border-green-600 text-green-600"
                        />
                        <Label htmlFor="unfreeze" className={`${!currentAccount.isFrozen ? 'text-gray-500' : 'text-white'}`}>
                          Mở đóng băng
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
              
              <Separator className="bg-gray-700" />
              
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className={`w-full text-white ${freezeAction === "freeze" ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={!selectedToken || !selectedAccount || isProcessing || !currentToken?.freezeAuthority}
                onClick={handleFreeze}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý
                  </>
                ) : freezeAction === "freeze" ? (
                  <>
                    <LockIcon className="mr-2 h-4 w-4" /> Đóng băng tài khoản
                  </>
                ) : (
                  <>
                    <UnlockIcon className="mr-2 h-4 w-4" /> Mở đóng băng tài khoản
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-400 text-center">
                Giao dịch sẽ được xác nhận thông qua ví đã kết nối của bạn.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </CommonLayout>
  )
} 