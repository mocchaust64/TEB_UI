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
  AlertCircle,
  RefreshCw,
  ExternalLink
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
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletButton } from "@/components/wallet-button"
import { PublicKey } from "@solana/web3.js"
import { toast } from "sonner"
import { TokenItemWithDetails } from "@/lib/utils/token-extensions"
import { fetchTokensFromBlockchain, mintToken } from "@/lib/services/token-service"
import Link from "next/link"

export default function MintToken() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentToken, setCurrentToken] = useState<TokenItemWithDetails | null>(null);
  const [tokens, setTokens] = useState<TokenItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  
  // Get wallet and connection
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load tokens when wallet connects
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
        // Filter tokens where user has mint authority
        // In a real app, you would need to check mint authority
        // For now, assume all tokens have mint permissions
        const mintableTokens = userTokens.map(token => ({
          ...token,
          mintAuthority: true // Temporary assumption that all have mint rights
        })) as TokenItemWithDetails[];
        
        setTokens(mintableTokens);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
      setIsError(true);
      toast.error("Could not load token list");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Function to refresh tokens
  const handleRefreshTokens = () => {
    loadTokens(true);
  };
  
  // Function to mint token
  const handleMint = async () => {
    if (!currentToken || !amount || !connection || !publicKey) {
      toast.error("Please fill in all required information");
      return;
    }
    
    // Check amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    
    setIsProcessing(true);
    setTransactionSignature(null);
    
    try {
      const signature = await mintToken(
        connection,
        wallet,
        currentToken.id,
        amount,
        currentToken.decimals,
        recipientAddress || undefined
      );
      
      setTransactionSignature(signature);
      toast.success("Token minted successfully!");
    } catch (error) {
      console.error("Error minting token:", error);
      toast.error("An error occurred while minting the token");
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center mb-4">
            <Gem className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Mint Token
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Mint additional tokens into circulation (requires Mint Authority)
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
                <Gem className="w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-white text-xl font-medium mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-6">
                  You need to connect your Solana wallet to mint tokens
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
                <h3 className="text-white text-xl font-medium mb-2">Token Minted Successfully!</h3>
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
                      setRecipientAddress("");
                      loadTokens(true);
                    }}
                  >
                    Mint More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl">Mint Details</CardTitle>
                    <CardDescription className="text-gray-400">
                      Fill in the details to mint additional tokens
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
                <Alert className="bg-blue-900/20 border-blue-700 text-blue-100">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertTitle>Important Information</AlertTitle>
                  <AlertDescription className="text-blue-200">
                    You can only mint tokens if you have the Mint Authority for that token.
                  </AlertDescription>
                </Alert>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-400">Loading token list...</p>
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                    <p className="text-white text-lg font-medium mb-2">Could not load tokens</p>
                    <p className="text-gray-400 mb-4">An error occurred while loading the token list</p>
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
                    <Gem className="w-10 h-10 text-gray-500 mb-4" />
                    <p className="text-white text-lg font-medium mb-2">No Tokens Found</p>
                    <p className="text-gray-400 mb-4">You don't have any tokens to mint</p>
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
                          <SelectValue placeholder="Select a token to mint" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {tokens.map((token) => (
                            <SelectItem 
                              key={token.id} 
                              value={token.id}
                              disabled={!token.mintAuthority}
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
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">{token.symbol.charAt(0)}</span>
                                    </div>
                                  )}
                                </div>
                                <span>{token.name} ({token.symbol})</span>
                                {!token.mintAuthority && (
                                  <span className="ml-2 text-red-400 text-xs">No mint authority</span>
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
                          <p className="text-sm text-gray-400">Current Balance</p>
                          <p className="text-white font-medium">{parseFloat(currentToken.balance).toLocaleString()} {currentToken.symbol}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-400">Mint Authority</p>
                          <p className="text-green-400 font-medium">
                            {currentToken.mintAuthority ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-white">Recipient Address</Label>
                      <Input
                        id="recipient"
                        placeholder="Solana wallet address (Pubkey) or leave empty to mint to yourself"
                        className="bg-gray-800/70 border-gray-700 text-white"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                      />
                      <p className="text-xs text-gray-400">
                        Leave empty to mint tokens to your own wallet
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-white">Amount</Label>
                      <Input
                        id="amount"
                        type="text"
                        placeholder="Enter amount of tokens to mint"
                        className="bg-gray-800/70 border-gray-700 text-white"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    
                    <Separator className="bg-gray-700" />
                    
                    {currentToken && amount && (
                      <div className="rounded-md p-3">
                        <p className="text-sm text-gray-400 mb-1">Total Supply After Minting</p>
                        <p className="text-white font-medium text-lg">
                          {amount 
                            ? (parseFloat(currentToken.balance) + parseFloat(amount || "0")).toLocaleString()
                            : parseFloat(currentToken.balance).toLocaleString()
                          } {currentToken.symbol}
                        </p>
                      </div>
                    )}
                  </>
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                    </>
                  ) : (
                    <>
                      <Gem className="mr-2 h-4 w-4" /> Mint Token
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-400 text-center">
                  The token minting transaction will be confirmed through your connected wallet.
                </p>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      </div>
    </CommonLayout>
  )
} 