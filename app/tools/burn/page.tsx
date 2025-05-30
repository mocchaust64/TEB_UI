"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CommonLayout } from "@/components/common-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Flame,
  ArrowLeft,
  Loader2,
  Info,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Search
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletButton } from "@/components/wallet-button"
import { PublicKey } from "@solana/web3.js"
import { toast } from "sonner"
import { TokenItemWithDetails } from "@/lib/utils/token-extensions"
import { fetchTokensFromBlockchain, burnToken } from "@/lib/services/token-service"
import { formatTokenBalance } from "@/lib/utils/format-utils"
import { useTokenSearch } from "@/hooks/use-token-search"
import Link from "next/link"

export default function BurnToken() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentToken, setCurrentToken] = useState<TokenItemWithDetails | null>(null);
  const [tokens, setTokens] = useState<TokenItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [tokenSearchTerm, setTokenSearchTerm] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Get wallet and connection
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  
  // Token search hook
  const { filteredTokens, setSearchTerm } = useTokenSearch({
    tokens,
    initialSearchTerm: tokenSearchTerm
  });
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load tokens when wallet is connected
  useEffect(() => {
    if (isMounted && connected && publicKey && connection) {
      loadTokens(false);
    }
  }, [isMounted, connected, publicKey, connection]);
  
  // Update current token when selection changes
  useEffect(() => {
    if (selectedToken && tokens.length > 0) {
      const token = tokens.find(t => t.id === selectedToken);
      setCurrentToken(token || null);
    } else {
      setCurrentToken(null);
    }
  }, [selectedToken, tokens]);
  
  // Function to load tokens from blockchain
  const loadTokens = async (forceRefresh = false) => {
    if (!publicKey || !connection || !wallet) return;
    
    if (!forceRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setIsError(false);
    
    try {
      const userTokens = await fetchTokensFromBlockchain(connection, wallet, {
        forceRefresh: true,
        onError: () => setIsError(true)
      });
      
      if (userTokens) {
        // Only get tokens with balance > 0
        const tokensWithBalance = userTokens.filter(token => parseFloat(token.balance) > 0);
        setTokens(tokensWithBalance);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
      setIsError(true);
      toast.error("Unable to load token list");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Function to refresh tokens
  const handleRefreshTokens = () => {
    loadTokens(true);
  };
  
  // Function to handle token search
  const handleTokenSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenSearchTerm(e.target.value);
    setSearchTerm(e.target.value);
  };
  
  // Open confirmation dialog
  const openConfirmDialog = () => {
    if (!currentToken || !amount) {
      toast.error("Please fill in all required information");
      return;
    }
    
    // Check amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    
    // Check if balance is sufficient
    const balance = parseFloat(currentToken.balance);
    if (numAmount > balance) {
      toast.error(`Insufficient balance. You only have ${balance} ${currentToken.symbol}`);
      return;
    }
    
    setShowConfirmDialog(true);
  };
  
  // Function to burn token
  const handleBurn = async () => {
    if (!currentToken || !amount || !connection || !publicKey) {
      toast.error("Please fill in all required information");
      return;
    }
    
    setShowConfirmDialog(false);
    setIsProcessing(true);
    setTransactionSignature(null);
    
    try {
      toast.loading("Processing token burn transaction...");
      
      const signature = await burnToken(
        connection,
        wallet,
        currentToken.id,
        amount,
        currentToken.decimals
      );
      
      toast.dismiss();
      toast.success("Token burned successfully!");
      setTransactionSignature(signature);
      
      // Refresh token list after successful burn
    setTimeout(() => {
        loadTokens(true);
      }, 2000);
    } catch (error) {
      console.error("Error burning token:", error);
      toast.dismiss();
      toast.error("An error occurred while burning token");
    } finally {
      setIsProcessing(false);
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
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center mb-4">
            <Flame className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Burn Token
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Reduce the circulating supply by burning tokens from your wallet
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-xl"
        >
          {!connected ? (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <Flame className="w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-white text-xl font-medium mb-2">Connect your wallet</h3>
                <p className="text-gray-400 mb-6">
                  You need to connect a Solana wallet to burn tokens
                </p>
                <WalletButton />
              </CardContent>
            </Card>
          ) : transactionSignature ? (
            <Card className="bg-gray-900/50 border-gray-700 mb-6">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="32" 
                    height="32" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-green-500"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3 className="text-white text-xl font-medium mb-2">Token burned successfully!</h3>
                <p className="text-gray-400 mb-4">
                  Transaction has been confirmed on the blockchain
                </p>
                <div className="bg-gray-800/50 rounded-md p-3 w-full mb-4">
                  <p className="text-sm text-gray-400 mb-1">Signature</p>
                  <p className="text-xs text-gray-300 break-all">{transactionSignature}</p>
                </div>
                <div className="flex gap-2">
                  <Link 
                    href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                      View on Explorer
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => {
                      setTransactionSignature(null);
                      setAmount("");
                      loadTokens(true);
                    }}
                  >
                    Burn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl">Burn Details</CardTitle>
              <CardDescription className="text-gray-400">
                      Enter details to burn your tokens
              </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-white"
                    onClick={handleRefreshTokens}
                    disabled={isLoading || isRefreshing}
                  >
                    <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-red-900/20 border-red-700 text-red-100">
                <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertTitle>Important Note</AlertTitle>
                <AlertDescription className="text-red-200">
                    Burning tokens is irreversible. Burned tokens will be permanently removed from circulation.
                </AlertDescription>
              </Alert>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                    <p className="text-gray-400">Loading token list...</p>
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                    <p className="text-white text-lg font-medium mb-2">Unable to load tokens</p>
                    <p className="text-gray-400 mb-4">An error occurred while loading token list</p>
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-white"
                      onClick={() => loadTokens(true)}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Flame className="w-10 h-10 text-gray-500 mb-4" />
                    <p className="text-white text-lg font-medium mb-2">No tokens found</p>
                    <p className="text-gray-400 mb-4">You don't have any tokens to burn</p>
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-white"
                      onClick={() => router.push("/create")}
                    >
                      Create New Token
                    </Button>
                  </div>
                ) : (
                  <>
              <div className="space-y-2">
                      <Label htmlFor="token" className="text-white">Select Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                          <SelectValue placeholder="Choose a token to burn" />
                  </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 max-h-80">
                          <div className="flex items-center px-2 pb-1 sticky top-0 bg-gray-800 z-10">
                            <Search className="w-4 h-4 text-gray-400 absolute left-4" />
                            <Input 
                              placeholder="Search tokens..." 
                              className="pl-8 bg-gray-700/50 border-gray-600 text-white text-sm"
                              value={tokenSearchTerm}
                              onChange={handleTokenSearch}
                            />
                          </div>
                          
                          {filteredTokens.length > 0 ? (
                            filteredTokens.map((token) => (
                      <SelectItem 
                        key={token.id} 
                        value={token.id}
                      >
                        <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center mr-2">
                                    {token.image ? (
                                      <img 
                                        src={token.image} 
                                        alt={token.name} 
                                        className="w-full h-full object-cover" 
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{token.symbol.charAt(0)}</span>
                                      </div>
                                    )}
                          </div>
                          <span>{token.name} ({token.symbol})</span>
                                  <span className="ml-2 text-gray-400 text-xs">
                                    Balance: {formatTokenBalance(token.balance, token.decimals)}
                                  </span>
                        </div>
                      </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-gray-400 text-sm">
                              No tokens found
                            </div>
                          )}
                  </SelectContent>
                </Select>
              </div>
              
              {currentToken && (
                      <div className="bg-gray-800/40 rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-400">Current Balance</p>
                          <p className="text-white font-medium">{formatTokenBalance(currentToken.balance, currentToken.decimals)} {currentToken.symbol}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                      <Label htmlFor="amount" className="text-white">Amount</Label>
                      <div className="flex gap-2">
                <Input
                  id="amount"
                  type="text"
                          placeholder="Enter amount to burn"
                          className="bg-gray-800/70 border-gray-700 text-white flex-1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                        {currentToken && (
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="text-sm"
                            onClick={() => setAmount(currentToken.balance)}
                          >
                            MAX
                          </Button>
                        )}
                      </div>
              </div>
              
              <Separator className="bg-gray-700" />
              
              {currentToken && amount && (
                      <div className="rounded-md p-3">
                        <p className="text-sm text-gray-400 mb-1">Balance after burning</p>
                        <p className="text-white font-medium text-lg">
                          {amount 
                            ? formatTokenBalance(Math.max(0, parseFloat(currentToken.balance) - parseFloat(amount)), currentToken.decimals)
                            : formatTokenBalance(currentToken.balance, currentToken.decimals)
                          } {currentToken.symbol}
                    </p>
                  </div>
                    )}
                  </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={!selectedToken || !amount || isProcessing || !currentToken}
                  onClick={openConfirmDialog}
              >
                {isProcessing ? (
                  <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                      <Flame className="mr-2 h-4 w-4" /> Burn Token
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-400 text-center">
                  The burn transaction will be confirmed through your connected wallet.
              </p>
            </CardFooter>
          </Card>
          )}
        </motion.div>
      </div>

      {/* Dialog to confirm token burn */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              Confirm Token Burn
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Burning tokens is irreversible. Please confirm the details below.
            </DialogDescription>
          </DialogHeader>
          
          {currentToken && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                  {currentToken.image ? (
                    <img 
                      src={currentToken.image} 
                      alt={currentToken.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center">
                      <span className="text-white font-bold">{currentToken.symbol.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{currentToken.name}</p>
                  <p className="text-sm text-gray-400">{currentToken.symbol}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 mb-1">Burn Amount</p>
                  <p className="text-white font-medium text-lg">{formatTokenBalance(amount, currentToken.decimals)}</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 mb-1">Balance After Burning</p>
                  <p className="text-white font-medium text-lg">{formatTokenBalance(Math.max(0, parseFloat(currentToken.balance) - parseFloat(amount)), currentToken.decimals)}</p>
                </div>
              </div>
              
              <Alert className="bg-red-900/20 border-red-700">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  Burned tokens will be permanently removed from circulation and cannot be recovered.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter className="gap-3 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="border-gray-700 text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBurn}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Burn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CommonLayout>
  )
} 