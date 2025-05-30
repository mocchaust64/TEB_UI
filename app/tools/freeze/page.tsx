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
    owner: "User A",
    balance: "200,000",
    isFrozen: false
  },
  {
    id: "acc2",
    address: "4abcDEF...",
    owner: "User B",
    balance: "350,000",
    isFrozen: true
  },
  {
    id: "acc3",
    address: "5lmnGHI...",
    owner: "User C",
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
        alert("Freeze token account successfully!");
      } else {
        alert("Unfreeze token account successfully!");
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
            <ArrowLeft className="h-4 w-4" /> Back
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
            Freeze Token
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Freeze or unfreeze token accounts (with Freeze authority)
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
              <CardTitle className="text-white text-xl">Token Freeze Details</CardTitle>
              <CardDescription className="text-gray-400">
                Enter details to freeze or unfreeze token accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-cyan-900/20 border-cyan-700 text-cyan-100">
                <Info className="h-4 w-4 text-cyan-400" />
                <AlertTitle>Important Information</AlertTitle>
                <AlertDescription className="text-cyan-200">
                  You can only freeze token accounts if you have Freeze Authority for that token.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="token" className="text-white">Select Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                    <SelectValue placeholder="Select a token to freeze/unfreeze accounts" />
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
                            <span className="ml-2 text-red-400 text-xs">No freeze authority</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentToken?.freezeAuthority && (
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-white">Select Token Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                      <SelectValue placeholder="Select a token account to freeze/unfreeze" />
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
                              <span className="ml-2 text-cyan-400 text-xs">Frozen</span>
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
                      <p className="text-sm text-gray-400">Account Address</p>
                      <p className="text-white font-medium">{currentAccount.address}</p>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Owner</p>
                      <p className="text-white font-medium">{currentAccount.owner}</p>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Balance</p>
                      <p className="text-white font-medium">{currentAccount.balance} {currentToken?.symbol}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400">Current Status</p>
                      <p className={`font-medium ${currentAccount.isFrozen ? 'text-cyan-400' : 'text-green-400'}`}>
                        {currentAccount.isFrozen ? 'Frozen' : 'Active'}
                      </p>
                    </div>
                  </div>
                
                  <div className="space-y-2">
                    <Label className="text-white">Action</Label>
                    <RadioGroup value={freezeAction} onValueChange={(value: "freeze" | "unfreeze") => setFreezeAction(value)} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="freeze" 
                          id="freeze" 
                          disabled={currentAccount.isFrozen}
                          className="border-cyan-600 text-cyan-600"
                        />
                        <Label htmlFor="freeze" className={`${currentAccount.isFrozen ? 'text-gray-500' : 'text-white'}`}>
                          Freeze Account
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
                          Unfreeze Account
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : freezeAction === "freeze" ? (
                  <>
                    <LockIcon className="mr-2 h-4 w-4" /> Freeze Account
                  </>
                ) : (
                  <>
                    <UnlockIcon className="mr-2 h-4 w-4" /> Unfreeze Account
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-400 text-center">
                Transaction will be confirmed through your connected wallet.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </CommonLayout>
  )
} 