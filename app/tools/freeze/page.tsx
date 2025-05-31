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
  UnlockIcon,
  RefreshCw,
  Search,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  DialogClose
} from "@/components/ui/dialog"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useTokenSearch } from "@/hooks/use-token-search"
import { useTokenFreeze } from "@/lib/hooks/use-token-freeze"
import { useTokenAccounts } from "@/lib/hooks/use-token-accounts"
import { fetchTokensFromBlockchain, TokenCreationResult } from "@/lib/services/token-service"
import { TokenItem } from "@/lib/services/tokenList"
import { TokenAccountInfo } from "@/lib/types/token-types"
import { toast } from "sonner"
import { useDefaultAccountState } from "@/lib/hooks/use-default-account-state"
import { PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"

export default function FreezeToken() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [tokenAccountAddress, setTokenAccountAddress] = useState<string>("");
  const [isValidWalletAddress, setIsValidWalletAddress] = useState(false);
  const [freezeAction, setFreezeAction] = useState<"freeze" | "unfreeze">("freeze");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentToken, setCurrentToken] = useState<TokenItem | null>(null);
  const [currentAccount, setCurrentAccount] = useState<TokenAccountInfo | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isRefreshingTokens, setIsRefreshingTokens] = useState(false);
  const [tokenSearchTerm, setTokenSearchTerm] = useState("");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  
  // Get wallet and connection
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  
  // Token search hook
  const { filteredTokens, setSearchTerm } = useTokenSearch({
    tokens,
    initialSearchTerm: tokenSearchTerm
  });
  
  // Token freeze hook
  const { 
    isProcessing: isFreezeProcessing, 
    error: freezeError,
    transactionSignature: freezeTransactionSignature,
    freezeAccount,
    thawAccount,
    resetState
  } = useTokenFreeze();
  
  // Token accounts hook - vẫn giữ lại để sử dụng phương thức hasFreezeAuthority
  const {
    hasFreezeAuthority
  } = useTokenAccounts();
  
  // Default account state hook
  const { 
    defaultState,
    isLoading,
    isProcessing: defaultStateProcessing,
    error: defaultStateError,
    transactionSignature: defaultStateTransactionSignature,
    hasDefaultAccountStateExtension,
    canUpdateState,
    fetchDefaultState,
    updateState
  } = useDefaultAccountState();
  
  // Hàm tính Associated Token Address từ địa chỉ ví và mint address
  const calculateTokenAccount = async (walletAddr: string, mintAddr: string) => {
    try {
      if (!walletAddr || !mintAddr) {
        setTokenAccountAddress("");
        return;
      }
      
      // Kiểm tra địa chỉ ví hợp lệ
      const walletPubkey = new PublicKey(walletAddr);
      
      // Kiểm tra mint address hợp lệ
      const mintPubkey = new PublicKey(mintAddr);
      
      // Tính Associated Token Address
      const tokenAccAddress = getAssociatedTokenAddressSync(
        mintPubkey,
        walletPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      setTokenAccountAddress(tokenAccAddress.toString());
      setIsValidWalletAddress(true);
    } catch (error) {
      console.error("Invalid address:", error);
      setTokenAccountAddress("");
      setIsValidWalletAddress(false);
    }
  };
  
  // Hàm lấy thông tin tài khoản token
  const fetchTokenAccountInfo = async () => {
    if (!connection || !tokenAccountAddress || !selectedToken) return;
    
    setIsLoadingAccount(true);
    
    try {
      // Kiểm tra tài khoản tồn tại không
      const accountInfo = await connection.getAccountInfo(new PublicKey(tokenAccountAddress));
      
      if (!accountInfo) {
        toast.error("Token account not found", {
          description: "This account may not exist or has not been created yet"
        });
        setCurrentAccount(null);
        setIsLoadingAccount(false);
        return;
      }
      
      // Lấy thông tin token từ danh sách tokens
      const token = tokens.find(t => t.id === selectedToken);
      if (!token) {
        setCurrentAccount(null);
        setIsLoadingAccount(false);
        return;
      }
      
      // Sử dụng getAccount từ spl-token để lấy thông tin chi tiết
      const { getAccount } = await import("@solana/spl-token");
      
      const tokenAccountInfo = await getAccount(
        connection,
        new PublicKey(tokenAccountAddress),
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );
      
      // Tính toán balance hiển thị
      const decimals = token.decimals;
      const balance = Number(tokenAccountInfo.amount) / Math.pow(10, decimals);
      const displayBalance = balance.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      });
      
      // Tạo đối tượng TokenAccountInfo
      const accountData: TokenAccountInfo = {
        address: tokenAccountAddress,
        owner: tokenAccountInfo.owner.toString(),
        mint: tokenAccountInfo.mint.toString(),
        balance: tokenAccountInfo.amount.toString(),
        decimals: decimals,
        isFrozen: tokenAccountInfo.isFrozen,
        programId: TOKEN_2022_PROGRAM_ID.toString(),
        displayBalance
      };
      
      setCurrentAccount(accountData);
      
      // Thiết lập hành động mặc định dựa trên trạng thái tài khoản
      setFreezeAction(tokenAccountInfo.isFrozen ? "unfreeze" : "freeze");
      
    } catch (error: any) {
      console.error("Error fetching token account:", error);
      toast.error("Error fetching token account", {
        description: error.message
      });
      setCurrentAccount(null);
    } finally {
      setIsLoadingAccount(false);
    }
  };
  
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
      
      // Reset wallet and token account input
      setWalletAddress("");
      setTokenAccountAddress("");
      setCurrentAccount(null);
      
      // Nếu token thay đổi thì kiểm tra DefaultAccountState
      if (token) {
        fetchDefaultState(token.id);
      }
    } else {
      setCurrentToken(null);
      setWalletAddress("");
      setTokenAccountAddress("");
      setCurrentAccount(null);
    }
  }, [selectedToken, tokens, fetchDefaultState]);
  
  // Calculate token account address when wallet address or token changes
  useEffect(() => {
    if (walletAddress && selectedToken) {
      calculateTokenAccount(walletAddress, selectedToken);
    }
  }, [walletAddress, selectedToken]);
  
  // Update freeze transaction signature
  useEffect(() => {
    if (freezeTransactionSignature) {
      setTransactionSignature(freezeTransactionSignature);
      setShowTransactionDialog(true);
    }
  }, [freezeTransactionSignature]);
  
  // Function to load tokens from blockchain
  const loadTokens = async (forceRefresh = false) => {
    if (!publicKey || !connection || !wallet) return;
    
    if (forceRefresh) {
      setIsRefreshingTokens(true);
    } else {
      setIsLoadingTokens(true);
    }
    
    try {
      const tokenList = await fetchTokensFromBlockchain(connection, wallet, {
        forceRefresh,
        onStart: () => {},
        onSuccess: () => {},
        onError: (error) => {
          toast.error("Failed to load tokens", {
            description: error.message
          });
        },
        onFinish: () => {}
      });
      
      if (tokenList) {
        // Filter only tokens with freeze authority (metadata would have this info)
        // For simplicity, we'll just use all tokens with TOKEN_2022_PROGRAM_ID for now
        // In a real implementation, you'd check the mint for freeze authority
        setTokens(tokenList);
      }
    } catch (error: any) {
      console.error("Error loading tokens:", error);
      toast.error("Failed to load tokens", {
        description: error.message
      });
    } finally {
      setIsLoadingTokens(false);
      setIsRefreshingTokens(false);
    }
  };
  
  // Handler for freeze/unfreeze action
  const handleFreezeAction = async () => {
    if (!currentToken || !tokenAccountAddress) return;
    
    setIsProcessing(true);
    resetState();
    
    try {
      if (freezeAction === "freeze") {
        await freezeAccount(tokenAccountAddress, currentToken.id);
      } else {
        await thawAccount(tokenAccountAddress, currentToken.id);
      }
      
      // Refresh account info after action
      await fetchTokenAccountInfo();
    } catch (error: any) {
      console.error(`Error ${freezeAction === "freeze" ? "freezing" : "thawing"} account:`, error);
      toast.error(`Failed to ${freezeAction} account`, {
        description: error.message
      });
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="token" className="text-white">Select Token</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-2 text-gray-400 hover:text-white"
                    onClick={() => loadTokens(true)}
                    disabled={isRefreshingTokens || !connected}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshingTokens ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search tokens..."
                    className="bg-gray-800/70 border-gray-700 text-white pl-10"
                    value={tokenSearchTerm}
                    onChange={(e) => {
                      setTokenSearchTerm(e.target.value);
                      setSearchTerm(e.target.value);
                    }}
                  />
                </div>
                
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                    <SelectValue placeholder="Select a token to freeze/unfreeze accounts" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                    {isLoadingTokens ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                        <span className="ml-2 text-gray-400">Loading tokens...</span>
                      </div>
                    ) : filteredTokens.length === 0 ? (
                      <div className="py-2 px-2 text-gray-400 text-center">
                        No tokens found
                      </div>
                    ) : (
                      filteredTokens.map((token) => (
                        <SelectItem 
                          key={token.id} 
                          value={token.id}
                        >
                          <div className="flex items-center">
                            {token.image ? (
                              <img 
                                src={token.image} 
                                alt={token.symbol} 
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center mr-2">
                                <span className="text-white text-xs font-bold">{token.symbol.charAt(0)}</span>
                              </div>
                            )}
                            <span>{token.name} ({token.symbol})</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {currentToken && (
                <div className="space-y-2">
                  <Label htmlFor="walletAddress" className="text-white">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    placeholder="Enter wallet address to freeze/unfreeze its token account"
                    className="bg-gray-800/70 border-gray-700 text-white"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                  
                  {tokenAccountAddress && (
                    <>
                      <div className="text-sm flex justify-between">
                        <span className="text-gray-400">Associated Token Account:</span>
                        <span className={isValidWalletAddress ? "text-green-400" : "text-red-400"}>
                          {tokenAccountAddress.substring(0, 4)}...{tokenAccountAddress.substring(tokenAccountAddress.length - 4)}
                        </span>
                      </div>
                      
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={!tokenAccountAddress || isLoadingAccount}
                        onClick={fetchTokenAccountInfo}
                      >
                        {isLoadingAccount ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Account Info...
                          </>
                        ) : (
                          "Get Account Info"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {currentAccount && (
                <>
                  <div className="bg-gray-800/40 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Account Address</p>
                      <p className="text-white font-medium truncate max-w-[250px]">{currentAccount.address}</p>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Owner</p>
                      <p className="text-white font-medium truncate max-w-[250px]">{currentAccount.owner}</p>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-400">Balance</p>
                      <p className="text-white font-medium">
                        {currentAccount.displayBalance} {currentToken?.symbol}
                      </p>
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
                    <RadioGroup 
                      value={freezeAction} 
                      onValueChange={(value: "freeze" | "unfreeze") => setFreezeAction(value)} 
                      className="flex space-x-4"
                    >
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
                disabled={!selectedToken || !currentAccount || isProcessing || isFreezeProcessing || !hasFreezeAuthority}
                onClick={handleFreezeAction}
              >
                {isProcessing || isFreezeProcessing ? (
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
        
        {/* Thêm phần quản lý Default Account State */}
        {currentToken && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-xl mt-6"
          >
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">Default Account State</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure how new token accounts are created by default
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DefaultAccountStateManager 
                  mintAddress={currentToken.id} 
                  tokenSymbol={currentToken.symbol}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      
      {/* Transaction success dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Transaction Successful</DialogTitle>
            <DialogDescription className="text-gray-400">
              Your token account has been {freezeAction === "freeze" ? "frozen" : "thawed"} successfully.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-800/50 p-3 rounded-md overflow-hidden">
            <p className="text-sm text-gray-400 mb-1">Transaction Signature</p>
            <p className="text-white break-all text-sm">{transactionSignature}</p>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              className="border-purple-500 text-white hover:bg-purple-500/20"
              onClick={() => {
                if (transactionSignature) {
                  window.open(`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`, '_blank');
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
            <DialogClose asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CommonLayout>
  )
}

// Component quản lý DefaultAccountState
function DefaultAccountStateManager({
  mintAddress,
  tokenSymbol
}: {
  mintAddress: string;
  tokenSymbol: string;
}) {
  const { 
    defaultState,
    isLoading,
    isProcessing,
    error,
    transactionSignature,
    hasDefaultAccountStateExtension,
    canUpdateState,
    fetchDefaultState,
    updateState
  } = useDefaultAccountState();
  
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  
  // Fetch default state khi component mount hoặc mintAddress thay đổi
  useEffect(() => {
    if (mintAddress) {
      fetchDefaultState(mintAddress);
    }
  }, [mintAddress, fetchDefaultState]);
  
  // Hiển thị dialog khi transaction thành công
  useEffect(() => {
    if (transactionSignature) {
      setShowTransactionDialog(true);
    }
  }, [transactionSignature]);
  
  // Xử lý bật/tắt trạng thái mặc định
  const handleToggleDefaultState = async () => {
    if (defaultState === null) return;
    
    // Nếu hiện tại là Initialized (0) thì chuyển sang Frozen (1), và ngược lại
    const newState = defaultState === 0 ? 1 : 0;
    await updateState(mintAddress, newState);
  };
  
  // Hiển thị trạng thái mặc định của token
  const getStateLabel = () => {
    if (defaultState === null) return "Not Available";
    return defaultState === 1 ? "Frozen (On)" : "Initialized (Off)";
  };
  
  // Nội dung mô tả trạng thái
  const getStateDescription = () => {
    if (!hasDefaultAccountStateExtension) {
      return "This token does not support Default Account State extension";
    }
    
    return defaultState === 1
      ? `When new ${tokenSymbol} accounts are created, they will be frozen by default`
      : `When new ${tokenSymbol} accounts are created, they will be active by default`;
  };
  
  return (
    <>
      <Alert className="bg-purple-900/20 border-purple-700 text-purple-100">
        <Info className="h-4 w-4 text-purple-400" />
        <AlertTitle>Default Account State</AlertTitle>
        <AlertDescription className="text-purple-200">
          This setting controls the default state of new token accounts when they are created.
        </AlertDescription>
      </Alert>
      
      <div className="bg-gray-800/40 rounded-md p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-medium">Current Default State</h3>
            <p className="text-gray-400 text-sm mt-1">{getStateDescription()}</p>
          </div>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin mr-2" />
                <span className="text-gray-400">Loading...</span>
              </div>
            ) : hasDefaultAccountStateExtension ? (
              <span className={`font-medium ${defaultState === 1 ? 'text-cyan-400' : 'text-green-400'}`}>
                {getStateLabel()}
              </span>
            ) : (
              <span className="text-gray-400">Not Available</span>
            )}
          </div>
        </div>
      </div>
      
      {hasDefaultAccountStateExtension && (
        <>
          {!canUpdateState && (
            <Alert className="bg-amber-900/20 border-amber-700 text-amber-100 mb-3">
              <Info className="h-4 w-4 text-amber-400" />
              <AlertTitle>Authority Required</AlertTitle>
              <AlertDescription className="text-amber-200">
                You need to be the freeze authority to update the default account state.
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            className={`w-full ${
              defaultState === 0 
                ? 'bg-cyan-600 hover:bg-cyan-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
            disabled={isProcessing || isLoading || !canUpdateState}
            onClick={handleToggleDefaultState}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : defaultState === 0 ? (
              <>
                <LockIcon className="mr-2 h-4 w-4" /> Enable Default Freeze
              </>
            ) : (
              <>
                <UnlockIcon className="mr-2 h-4 w-4" /> Disable Default Freeze
              </>
            )}
          </Button>
        </>
      )}
      
      {/* Dialog hiển thị kết quả transaction */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Default State Updated</DialogTitle>
            <DialogDescription className="text-gray-400">
              The default account state for {tokenSymbol} has been changed to {defaultState === 1 ? 'Frozen' : 'Initialized'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-800/50 p-3 rounded-md overflow-hidden">
            <p className="text-sm text-gray-400 mb-1">Transaction Signature</p>
            <p className="text-white break-all text-sm">{transactionSignature}</p>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              className="border-purple-500 text-white hover:bg-purple-500/20"
              onClick={() => {
                if (transactionSignature) {
                  window.open(`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`, '_blank');
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
            <DialogClose asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 