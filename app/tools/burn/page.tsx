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
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white p-0 flex items-center gap-1"
            onClick={() => router.push("/tools")}
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-6 sm:mb-10"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center mb-4">
            <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 text-center">
            Burn Token
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-xl text-center">
            Destroy tokens to reduce the circulating supply permanently
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
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mb-4" />
                <h3 className="text-white text-lg sm:text-xl font-medium mb-2">Wallet Connection Required</h3>
                <p className="text-gray-400 mb-6">
                  Please connect your wallet to burn tokens.
                </p>
                <WalletButton />
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 animate-spin mb-4" />
                <h3 className="text-white text-lg sm:text-xl mb-2">Loading Your Tokens</h3>
                <p className="text-gray-400">Please wait while we fetch your token information...</p>
              </CardContent>
            </Card>
          ) : isError ? (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mb-4" />
                <h3 className="text-white text-lg sm:text-xl mb-2">Error Loading Tokens</h3>
                <p className="text-gray-400 mb-4">
                  There was a problem loading your tokens. Please try again.
                </p>
                <Button onClick={handleRefreshTokens} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refreshing
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : tokens.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <Info className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 mb-4" />
                <h3 className="text-white text-lg sm:text-xl mb-2">No Tokens Found</h3>
                <p className="text-gray-400 mb-4">
                  You don&apos;t have any token with non-zero balance in your wallet.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button onClick={handleRefreshTokens} variant="outline" disabled={isRefreshing}>
                    {isRefreshing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refreshing
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                      </>
                    )}
                  </Button>
                  <Link href="/tools">
                    <Button variant="default">
                      Explore Other Tools
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : transactionSignature ? (
            <Card className="bg-gray-900/50 border-gray-700 mb-6">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
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
                <h3 className="text-white text-xl font-medium mb-2">Tokens Burned Successfully!</h3>
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
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                    <CardTitle className="text-white text-lg sm:text-xl">Burn Details</CardTitle>
                    <CardDescription className="text-gray-400 text-xs sm:text-sm">
                      Select a token and amount to burn permanently
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-white"
                    onClick={handleRefreshTokens}
                    disabled={isLoading || isRefreshing}
                  >
                    <RefreshCw className={`h-4 h-4 sm:h-5 sm:w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-amber-900/20 border-amber-900/50 text-amber-200">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle className="text-xs sm:text-sm font-medium">Warning: Irreversible Action</AlertTitle>
                  <AlertDescription className="text-[10px] sm:text-xs text-amber-200">
                    Burning tokens permanently removes them from circulation. This action cannot be undone.
                  </AlertDescription>
                </Alert>

                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search tokens by name or symbol..."
                    className="ps-10 bg-gray-800 border-gray-700"
                    value={tokenSearchTerm}
                    onChange={handleTokenSearch}
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="token" className="text-white text-sm sm:text-base">Select Token</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger id="token" className="bg-gray-800 border-gray-700 text-xs sm:text-sm">
                      <SelectValue placeholder="Select a token to burn" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-xs sm:text-sm max-h-[300px]">
                      {filteredTokens.map((token) => (
                        <SelectItem key={token.id} value={token.id}>
                          <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 rounded-full overflow-hidden flex-shrink-0">
                              {token.image ? (
                                <img 
                                  src={token.image}
                                  alt={token.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                                  <span className="text-white text-[8px]">{token.symbol.charAt(0)}</span>
                                </div>
                              )}
                            </div>
                            <span>
                              {token.name} ({token.symbol}) - Balance: {formatTokenBalance(token.balance, token.decimals)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentToken && (
                  <div className="bg-gray-800/40 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Current Balance</p>
                      <p className="text-white font-medium">{formatTokenBalance(currentToken.balance, currentToken.decimals)} {currentToken.symbol}</p>
                    </div>
                    <Separator className="bg-gray-700 my-2" />
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm sm:text-base">Burn Amount</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Amount to burn"
                          className="bg-gray-800 border-gray-700 text-xs sm:text-sm"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={() => setAmount(currentToken.balance)}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {currentToken && amount && (
                  <div className="rounded-md p-3">
                    <p className="text-sm text-gray-400 mb-1">Total Balance After Burning</p>
                    <p className="text-white font-medium text-base sm:text-lg">
                      {amount 
                        ? (parseFloat(currentToken.balance) - parseFloat(amount || "0")).toLocaleString()
                        : parseFloat(currentToken.balance).toLocaleString()
                      } {currentToken.symbol}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:gap-4">
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 sm:py-3"
                  disabled={!currentToken || !amount || isProcessing}
                  onClick={openConfirmDialog}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> Processing
                    </>
                  ) : (
                    <>
                      <Flame className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Burn Token
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

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 text-gray-200 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl text-white">Confirm Token Burn</DialogTitle>
              <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                You are about to permanently burn tokens. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {currentToken && (
              <div className="space-y-3 py-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Token:</span>
                  <span className="font-medium">{currentToken.name} ({currentToken.symbol})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount to Burn:</span>
                  <span className="font-medium">{amount} {currentToken.symbol}</span>
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex justify-between text-red-400">
                  <span>Tokens will be permanently removed</span>
                  <Flame className="w-4 h-4" />
                </div>
              </div>
            )}
            
            <DialogFooter className="sm:justify-between mt-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBurn} 
                className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Confirm Burn
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CommonLayout>
  )
}  