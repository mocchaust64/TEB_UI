"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CommonLayout } from "@/components/common-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Coins,
  ArrowLeft,
  Loader2,
  Info,
  Wallet,
  RefreshCw,
  Search,
  ExternalLink,
  CircleDollarSign,
  UploadCloud,
  Download
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PublicKey } from '@solana/web3.js'
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useTokenSearch } from "@/hooks/use-token-search"
import { fetchTokensFromBlockchain } from "@/lib/services/token-service"
import { TokenItem } from "@/lib/services/tokenList"
import { useTransferFee } from "@/lib/hooks/use-transfer-fee"
import { toast } from "sonner"
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"

export default function ClaimFee() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [selectedTab, setSelectedTab] = useState<string>("accounts");
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isRefreshingTokens, setIsRefreshingTokens] = useState(false);
  const [tokenSearchTerm, setTokenSearchTerm] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<PublicKey[]>([]);
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [isValidDestination, setIsValidDestination] = useState(false);
  
  // Get wallet and connection
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  
  // Token search hook
  const { filteredTokens, setSearchTerm } = useTokenSearch({
    tokens,
    initialSearchTerm: tokenSearchTerm
  });
  
  // Transfer fee hook
  const { 
    isLoading,
    isProcessing,
    error,
    hasTransferFeeExtension,
    canWithdrawFees,
    accountsWithFees,
    totalWithheldAmount,
    transactionSignature,
    findAccountsWithFees,
    harvestFeesToMint,
    withdrawFeesFromAccounts,
    withdrawFeesFromMint,
    getTokenAccountFeeInfo,
    resetState
  } = useTransferFee();
  
  // Thiết lập destination address mặc định khi wallet kết nối
  useEffect(() => {
    if (connected && publicKey && selectedToken) {
      try {
        const mintPubkey = new PublicKey(selectedToken);
        const tokenAccount = getAssociatedTokenAddressSync(
          mintPubkey,
          publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        setDestinationAddress(tokenAccount.toString());
        setIsValidDestination(true);
      } catch (error) {
        console.error("Error setting default destination:", error);
      }
    }
  }, [connected, publicKey, selectedToken]);

  // Format số BigInt thành số có thể đọc được
  const formatAmount = (amount: bigint, decimals: number = 9): string => {
    try {
      const amountNumber = Number(amount) / Math.pow(10, decimals);
      return amountNumber.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      });
    } catch (error) {
      console.error("Error formatting amount:", error);
      return "0";
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
  
  // Tìm các tài khoản có phí khi chọn token
  useEffect(() => {
    if (selectedToken) {
      findAccountsWithFees(selectedToken);
    }
  }, [selectedToken, findAccountsWithFees]);
  
  // Cập nhật dialog khi có transaction signature
  useEffect(() => {
    if (transactionSignature) {
      setShowTransactionDialog(true);
    }
  }, [transactionSignature]);
  
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
        // Lọc token có extension transfer fee
        // Trong thực tế, cần kiểm tra metadata của token
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
  
  // Xử lý khi chọn hoặc bỏ chọn một tài khoản
  const handleAccountSelection = (account: PublicKey) => {
    setSelectedAccounts(prev => {
      const isSelected = prev.some(a => a.equals(account));
      if (isSelected) {
        return prev.filter(a => !a.equals(account));
      } else {
        return [...prev, account];
      }
    });
  };
  
  // Chọn tất cả tài khoản
  const handleSelectAllAccounts = () => {
    if (selectedAccounts.length === accountsWithFees.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts([...accountsWithFees]);
    }
  };
  
  // Xử lý thu hoạch phí vào mint
  const handleHarvestToMint = async () => {
    if (!selectedToken || selectedAccounts.length === 0) {
      toast.error("No accounts selected");
      return;
    }
    
    try {
      await harvestFeesToMint(selectedToken, selectedAccounts);
      // Reset lựa chọn sau khi thành công
      setSelectedAccounts([]);
    } catch (error) {
      console.error("Error harvesting fees:", error);
    }
  };
  
  // Xử lý rút phí từ tài khoản
  const handleWithdrawFromAccounts = async () => {
    if (!selectedToken || selectedAccounts.length === 0 || !destinationAddress || !isValidDestination) {
      toast.error("Invalid selection or destination");
      return;
    }
    
    try {
      await withdrawFeesFromAccounts(selectedToken, selectedAccounts, destinationAddress);
      // Reset lựa chọn sau khi thành công
      setSelectedAccounts([]);
    } catch (error) {
      console.error("Error withdrawing fees from accounts:", error);
    }
  };
  
  // Xử lý rút phí từ mint
  const handleWithdrawFromMint = async () => {
    if (!selectedToken || !destinationAddress || !isValidDestination) {
      toast.error("Invalid selection or destination");
      return;
    }
    
    try {
      await withdrawFeesFromMint(selectedToken, destinationAddress);
    } catch (error) {
      console.error("Error withdrawing fees from mint:", error);
    }
  };
  
  // Kiểm tra địa chỉ đích hợp lệ
  const validateDestinationAddress = (address: string) => {
    try {
      if (!address) {
        setIsValidDestination(false);
        return;
      }
      
      // Kiểm tra xem địa chỉ có phải PublicKey hợp lệ không
      new PublicKey(address);
      setIsValidDestination(true);
    } catch (error) {
      setIsValidDestination(false);
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-500/30 flex items-center justify-center mb-4">
            <Coins className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Claim Transfer Fees
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Harvest and withdraw transfer fees from token accounts and mint
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-3xl"
        >
          <Card className="bg-gray-900/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-xl">Select Token</CardTitle>
              <CardDescription className="text-gray-400">
                Choose a token to view and manage transfer fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-900/20 border-amber-700 text-amber-100">
                <Info className="h-4 w-4 text-amber-400" />
                <AlertTitle>Transfer Fee Management</AlertTitle>
                <AlertDescription className="text-amber-200">
                  You can only withdraw fees if you are the withdraw authority for the token.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="token" className="text-white">Token with Transfer Fee</Label>
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
                    <SelectValue placeholder="Select a token with transfer fee" />
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
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-500/30 flex items-center justify-center mr-2">
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
              
              {selectedToken && (
                <div className="bg-gray-800/40 rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">Accounts with Fees</p>
                    <p className="text-white font-medium">{accountsWithFees.length}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">Total Withheld Amount</p>
                    <p className="text-white font-medium">
                      {formatAmount(totalWithheldAmount)} {filteredTokens.find(t => t.id === selectedToken)?.symbol || ''}
                    </p>
                  </div>
                </div>
              )}
              
              {selectedToken && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="destinationAddress" className="text-white">Fee Destination Address</Label>
                    <Input
                      id="destinationAddress"
                      placeholder="Enter destination address for fee withdrawal"
                      className={`bg-gray-800/70 border-${isValidDestination ? 'gray-700' : 'red-700'} text-white`}
                      value={destinationAddress}
                      onChange={(e) => {
                        setDestinationAddress(e.target.value);
                        validateDestinationAddress(e.target.value);
                      }}
                    />
                    {destinationAddress && !isValidDestination && (
                      <p className="text-sm text-red-400">Invalid destination address</p>
                    )}
                  </div>
                  
                  <Separator className="bg-gray-700" />
                  
                  <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid grid-cols-2 bg-gray-800">
                      <TabsTrigger value="accounts" className="data-[state=active]:bg-amber-900/50">
                        Token Accounts
                      </TabsTrigger>
                      <TabsTrigger value="mint" className="data-[state=active]:bg-amber-900/50">
                        Mint Account
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="accounts" className="mt-4">
                      <FeeAccountsTab 
                        accounts={accountsWithFees}
                        selectedAccounts={selectedAccounts}
                        isLoading={isLoading}
                        onSelectAccount={handleAccountSelection}
                        onSelectAll={handleSelectAllAccounts}
                        onHarvestToMint={handleHarvestToMint}
                        onWithdrawFees={handleWithdrawFromAccounts}
                        isProcessing={isProcessing}
                        canWithdrawFees={canWithdrawFees}
                        hasValidDestination={isValidDestination}
                      />
                    </TabsContent>
                    <TabsContent value="mint" className="mt-4">
                      <FeeMintTab 
                        onWithdrawFees={handleWithdrawFromMint}
                        isProcessing={isProcessing}
                        canWithdrawFees={canWithdrawFees}
                        hasValidDestination={isValidDestination}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Transaction success dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Transaction Successful</DialogTitle>
            <DialogDescription className="text-gray-400">
              Your fee operation completed successfully.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-800/50 p-3 rounded-md overflow-hidden">
            <p className="text-sm text-gray-400 mb-1">Transaction Signature</p>
            <p className="text-white break-all text-sm">{transactionSignature}</p>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              className="border-amber-500 text-white hover:bg-amber-500/20"
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
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CommonLayout>
  )
}

// Component cho tab quản lý phí từ tài khoản token
function FeeAccountsTab({ 
  accounts, 
  selectedAccounts, 
  isLoading, 
  onSelectAccount, 
  onSelectAll,
  onHarvestToMint,
  onWithdrawFees,
  isProcessing,
  canWithdrawFees,
  hasValidDestination
}: { 
  accounts: PublicKey[]; 
  selectedAccounts: PublicKey[];
  isLoading: boolean;
  onSelectAccount: (account: PublicKey) => void;
  onSelectAll: () => void;
  onHarvestToMint: () => Promise<void>;
  onWithdrawFees: () => Promise<void>;
  isProcessing: boolean;
  canWithdrawFees: boolean;
  hasValidDestination: boolean;
}) {
  // Kiểm tra nếu tất cả tài khoản đã được chọn
  const allSelected = accounts.length > 0 && selectedAccounts.length === accounts.length;
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-amber-400 animate-spin mr-2" />
          <span className="text-gray-400">Loading accounts with fees...</span>
        </div>
      ) : accounts.length === 0 ? (
        <Alert className="bg-gray-800/50 border-gray-700">
          <Info className="h-4 w-4 text-gray-400" />
          <AlertTitle>No Accounts Found</AlertTitle>
          <AlertDescription className="text-gray-400">
            There are no token accounts with withheld fees for this token.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-300 border-gray-700 hover:bg-gray-800"
              onClick={onSelectAll}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
            <Badge variant="outline" className="text-amber-400 border-amber-600">
              {selectedAccounts.length} of {accounts.length} selected
            </Badge>
          </div>
          
          <div className="border border-gray-700 rounded-md overflow-hidden mb-4">
            <Table>
              <TableHeader className="bg-gray-800/80">
                <TableRow>
                  <TableHead className="w-[50px] text-gray-400">Select</TableHead>
                  <TableHead className="text-gray-400">Account Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account, index) => {
                  const isSelected = selectedAccounts.some(a => a.equals(account));
                  return (
                    <TableRow 
                      key={account.toString()} 
                      className={`border-t border-gray-700 hover:bg-gray-800/30 ${isSelected ? 'bg-amber-900/10' : ''}`}
                    >
                      <TableCell>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => onSelectAccount(account)}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-amber-600 focus:ring-amber-600"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-300 truncate max-w-[300px]">
                        {account.toString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
              disabled={selectedAccounts.length === 0 || isProcessing}
              onClick={onHarvestToMint}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" /> Harvest to Mint
                </>
              )}
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
              disabled={
                selectedAccounts.length === 0 || 
                isProcessing || 
                !canWithdrawFees ||
                !hasValidDestination
              }
              onClick={onWithdrawFees}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Withdraw Fees
                </>
              )}
            </Button>
          </div>
          
          {!canWithdrawFees && (
            <Alert className="bg-red-900/20 border-red-700 text-red-100">
              <Info className="h-4 w-4 text-red-400" />
              <AlertTitle>Authority Required</AlertTitle>
              <AlertDescription className="text-red-200">
                You need to be the withdraw withheld authority to withdraw fees.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}

// Component cho tab quản lý phí từ mint account
function FeeMintTab({ 
  onWithdrawFees,
  isProcessing,
  canWithdrawFees,
  hasValidDestination
}: { 
  onWithdrawFees: () => Promise<void>;
  isProcessing: boolean;
  canWithdrawFees: boolean;
  hasValidDestination: boolean;
}) {
  return (
    <div className="space-y-4">
      <Alert className="bg-gray-800/50 border-gray-700">
        <Info className="h-4 w-4 text-gray-400" />
        <AlertTitle>Mint Account Fees</AlertTitle>
        <AlertDescription className="text-gray-400">
          Fees are sent to the mint account when they are harvested from token accounts. 
          You can withdraw these fees if you are the withdraw authority.
        </AlertDescription>
      </Alert>
      
      <Button 
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        disabled={isProcessing || !canWithdrawFees || !hasValidDestination}
        onClick={onWithdrawFees}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" /> Withdraw Fees from Mint
          </>
        )}
      </Button>
      
      {!canWithdrawFees && (
        <Alert className="bg-red-900/20 border-red-700 text-red-100">
          <Info className="h-4 w-4 text-red-400" />
          <AlertTitle>Authority Required</AlertTitle>
          <AlertDescription className="text-red-200">
            You need to be the withdraw withheld authority to withdraw fees from the mint.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 