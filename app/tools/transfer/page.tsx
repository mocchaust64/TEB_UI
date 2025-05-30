"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CommonLayout } from "@/components/common-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Send, 
  ArrowLeft,
  Wallet,
  Loader2,
  Search,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Info,
  AlertTriangle
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
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { TokenItem } from "@/lib/services/tokenList"
import { fetchTokensFromBlockchain } from "@/lib/services/token-service"
import { formatTokenBalance, formatAddress } from "@/lib/utils/format-utils"
import { useTokenSearch } from "@/hooks/use-token-search"
import { WalletButton } from "@/components/wallet-button"
import { toast } from "sonner"
import { getTokensFromCache } from "@/lib/utils/token-cache"
import { transferToken, TokenTransferParams } from "@/lib/services/token-transfer"
import Link from "next/link"
import { PublicKey } from "@solana/web3.js"
import { TOKEN_2022_PROGRAM_ID } from "@/token-extensions-boost/src/utils/constants"
import { 
  TokenExtensionInfo, 
  TokenItemWithDetails,
  getTokenExtensions,
  calculateTransferFee,
  generateExtensionWarnings,
  ExtensionWarning
} from "@/lib/utils/token-extensions"

export default function TransferToken() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | undefined>();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentToken, setCurrentToken] = useState<TokenItemWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tokens, setTokens] = useState<TokenItemWithDetails[]>([]);
  const [tokenSearchTerm, setTokenSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  // Thêm state cho bước review giao dịch
  const [isReviewing, setIsReviewing] = useState(false);
  
  // Ref cho input tìm kiếm token
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Lấy wallet và connection
  const wallet = useWallet();
  const { publicKey, connected, sendTransaction } = wallet;
  const { connection } = useConnection();
  
  // Sử dụng hook tìm kiếm token
  const { filteredTokens } = useTokenSearch({ 
    tokens, 
    initialSearchTerm: tokenSearchTerm 
  });
  
  // State để lưu thông tin về token extensions
  const [tokenExtensions, setTokenExtensions] = useState<TokenExtensionInfo>({
    isToken2022: false,
    hasTransferFee: false,
    hasNonTransferable: false,
    hasPermanentDelegate: false,
    hasDefaultAccount: false,
    hasMetadata: false
  });
  
  // State để lưu các cảnh báo về extension
  const [extensionWarnings, setExtensionWarnings] = useState<ExtensionWarning[]>([]);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load tokens khi wallet kết nối
  useEffect(() => {
    if (isMounted && connected && publicKey && connection) {
      loadTokens(false);
    }
  }, [isMounted, connected, publicKey, connection]);
  
  // Cập nhật token hiện tại khi chọn token
  useEffect(() => {
    if (selectedToken && tokens.length > 0) {
      const token = tokens.find(t => t.id === selectedToken) as TokenItemWithDetails;
      setCurrentToken(token || null);
      
      // Kiểm tra xem token có extension không nếu có token được chọn
      if (token) {
        checkTokenExtensions(token);
      }
    } else {
      setCurrentToken(null);
    }
  }, [selectedToken, tokens]);
  
  // Cập nhật cảnh báo khi amount thay đổi
  useEffect(() => {
    if (currentToken && amount && tokenExtensions.hasTransferFee) {
      updateExtensionWarnings();
    }
  }, [amount, currentToken, tokenExtensions]);
  
  // Hàm cập nhật cảnh báo extension
  const updateExtensionWarnings = () => {
    if (!currentToken || !amount) return;
    
    const warnings = generateExtensionWarnings(
      tokenExtensions,
      amount,
      currentToken.symbol,
      currentToken.decimals
    );
    
    setExtensionWarnings(warnings);
  };
  
  // Hàm kiểm tra token extensions
  const checkTokenExtensions = async (token: TokenItemWithDetails) => {
    if (!connection || !token) return;
    
    try {
      // Sử dụng hàm tiện ích để kiểm tra extensions
      const extensionInfo = await getTokenExtensions(connection, token);
      setTokenExtensions(extensionInfo);
      
      // Cập nhật cảnh báo nếu có số lượng
      if (amount) {
        const warnings = generateExtensionWarnings(
          extensionInfo,
          amount,
          token.symbol,
          token.decimals
        );
        setExtensionWarnings(warnings);
      }
    } catch (error) {
      console.error("Error checking token extensions:", error);
      // Reset về giá trị mặc định nếu có lỗi
      setTokenExtensions({
        isToken2022: false,
        hasTransferFee: false,
        hasNonTransferable: false,
        hasPermanentDelegate: false,
        hasDefaultAccount: false,
        hasMetadata: false
      });
      setExtensionWarnings([]);
    }
  };
  
  // Hàm load tokens từ cache hoặc blockchain
  const loadTokens = async (forceRefresh = false) => {
    if (!publicKey || !connection || !wallet) return;
    
    // Nếu không bắt buộc làm mới, thử đọc từ cache trước
    if (!forceRefresh) {
      const cachedData = getTokensFromCache(publicKey.toString());
      
      if (cachedData) {
        // Chỉ lấy các token có số dư > 0
        const tokensWithBalance = cachedData.tokens.filter(token => 
          parseFloat(token.balance) > 0
        );
        
        setTokens(tokensWithBalance);
        setLastUpdated(new Date(cachedData.timestamp));
        
        // Vẫn tải trong nền để cập nhật nếu cần
        fetchFromBlockchain(true);
        return;
      }
    }
    
    // Nếu không có dữ liệu cache hoặc buộc làm mới, tải từ blockchain
    fetchFromBlockchain(false);
  };
  
  // Hàm tải token từ blockchain
  const fetchFromBlockchain = async (isBackgroundFetch = false) => {
    if (!publicKey || !connection || !wallet) return;
    
    if (!isBackgroundFetch) {
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
        // Chỉ lấy các token có số dư > 0
        const tokensWithBalance = userTokens.filter(token => 
          parseFloat(token.balance) > 0
        );
        setTokens(tokensWithBalance);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
      setIsError(true);
      
      if (!isBackgroundFetch) {
        toast.error("Không thể tải danh sách token");
      }
    } finally {
      if (!isBackgroundFetch) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };
  
  // Hàm làm mới token
  const handleRefreshTokens = () => {
    loadTokens(true);
  };
  
  // Hàm chuyển token sử dụng module token-transfer
  const handleTransfer = async () => {
    if (!currentToken || !amount || !recipientAddress || !connection || !publicKey) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    // Kiểm tra tính hợp lệ của số lượng
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Số lượng không hợp lệ");
      return;
    }
    
    // Kiểm tra xem số lượng có vượt quá số dư không
    const tokenBalance = parseFloat(currentToken.balance);
    if (numAmount > tokenBalance) {
      toast.error(`Số dư không đủ. Bạn chỉ có ${formatTokenBalance(currentToken.balance, currentToken.decimals)} ${currentToken.symbol}`);
      return;
    }
    
    // Cập nhật cảnh báo trước khi chuyển sang review
    updateExtensionWarnings();
    
    // Kiểm tra cảnh báo nghiêm trọng
    const hasErrorWarning = extensionWarnings.some(warning => warning.type === 'error');
    
    if (hasErrorWarning) {
      toast.error("Token này có các hạn chế không cho phép chuyển. Xem chi tiết trong phần Review.");
    }
    
    // Chuyển sang chế độ review thay vì thực hiện giao dịch ngay
    setIsReviewing(true);
  };
  
  // Hàm thực hiện giao dịch sau khi đã review
  const confirmTransfer = async () => {
    if (!currentToken || !amount || !recipientAddress || !connection || !publicKey) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    // Kiểm tra lại xem có cảnh báo loại error không
    const hasErrorWarning = extensionWarnings.some(warning => warning.type === 'error');
    
    if (hasErrorWarning) {
      toast.error("Không thể chuyển token do có hạn chế (Non-Transferable)");
      return;
    }
    
    // Tạo tham số chuyển token
    const transferParams: TokenTransferParams = {
      mintAddress: currentToken.id,
      recipientAddress: recipientAddress,
      amount: amount,
      decimals: currentToken.decimals
    };
    
    setIsProcessing(true);
    setTransactionSignature(null);
    
    try {
      // Gọi hàm chuyển token
      const signature = await transferToken(connection, wallet, transferParams, {
        memo: memo || undefined,
        onStart: () => {
          const loadingMessage = tokenExtensions.hasTransferFee 
            ? `Đang xử lý giao dịch... Phí chuyển: ${(parseFloat(amount) * (tokenExtensions.feePercentage || 0) / 100).toFixed(currentToken.decimals)} ${currentToken.symbol}`
            : "Đang xử lý giao dịch...";
          
          toast.loading(loadingMessage);
        },
        onSuccess: (txSig) => {
          const successMessage = tokenExtensions.hasTransferFee 
            ? `Chuyển token thành công! Đã trừ phí ${tokenExtensions.feePercentage}%`
            : "Chuyển token thành công!";
          
          toast.success(successMessage);
          setTransactionSignature(txSig);
        },
        onError: (error) => {
          console.error("Error in transfer:", error);
        },
        onFinish: () => {
          setIsProcessing(false);
          setIsReviewing(false); // Tắt chế độ review khi xong
        }
      });
      
    } catch (error) {
      console.error("Error transferring token:", error);
      toast.error("Có lỗi xảy ra khi chuyển token");
      setIsProcessing(false);
      setIsReviewing(false); // Tắt chế độ review khi có lỗi
    }
  };
  
  const handleMaxAmount = () => {
    if (currentToken) {
      setAmount(currentToken.balance);
    }
  };
  
  // Hàm xử lý tìm kiếm token
  const handleTokenSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenSearchTerm(e.target.value);
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mb-4">
            <Send className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Chuyển Token
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Chuyển các token của bạn đến địa chỉ ví khác trên mạng Solana
          </p>
        </motion.div>
        
        {!connected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-xl"
          >
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <Wallet className="w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-white text-xl font-medium mb-2">Kết nối ví của bạn</h3>
                <p className="text-gray-400 mb-6">
                  Bạn cần kết nối ví Solana để chuyển token
                </p>
                <WalletButton />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-xl"
          >
            {transactionSignature ? (
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
                  <h3 className="text-white text-xl font-medium mb-2">Chuyển token thành công!</h3>
                  <p className="text-gray-400 mb-4">
                    Giao dịch đã được xác nhận trên blockchain
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
                        Xem trên Explorer
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => {
                        setTransactionSignature(null);
                        setAmount("");
                        setRecipientAddress("");
                        setMemo("");
                        loadTokens(true);
                      }}
                    >
                      Chuyển tiếp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : isReviewing ? (
              <Card className="bg-gray-900/50 border-gray-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Xác nhận giao dịch</CardTitle>
                  <CardDescription className="text-gray-400">
                    Vui lòng kiểm tra thông tin giao dịch trước khi xác nhận
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Thông tin Token */}
                  <div>
                    <h3 className="text-sm text-gray-400 mb-2">Chi tiết Token</h3>
                    <div className="bg-gray-800/50 rounded-md p-3">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center mr-2">
                          {currentToken?.image ? (
                            <img 
                              src={currentToken.image} 
                              alt={currentToken.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{currentToken?.symbol.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{currentToken?.name} ({currentToken?.symbol})</p>
                          <p className="text-xs text-gray-400">
                            {formatAddress(currentToken?.id || "")}
                          </p>
                        </div>
                      </div>
                      
                      {/* Token Standard */}
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Token Standard:</span>
                        <span className="text-white">{currentToken?.id.startsWith("So") ? "Token 2022" : "SPL Token"}</span>
                      </div>
                      
                      {/* Số dư */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Số dư hiện tại:</span>
                        <span className="text-white">{formatTokenBalance(currentToken?.balance || "0", currentToken?.decimals || 0)} {currentToken?.symbol}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chi tiết giao dịch */}
                  <div>
                    <h3 className="text-sm text-gray-400 mb-2">Chi tiết giao dịch</h3>
                    <div className="bg-gray-800/50 rounded-md p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Số lượng gửi:</span>
                        <span className="text-white">{amount} {currentToken?.symbol}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Địa chỉ người nhận:</span>
                        <span className="text-white">{formatAddress(recipientAddress)}</span>
                      </div>
                      
                      {memo && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Memo:</span>
                          <span className="text-white truncate max-w-[200px]">{memo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Thông tin Extension */}
                  {(tokenExtensions.hasTransferFee || 
                    tokenExtensions.hasNonTransferable || 
                    tokenExtensions.hasPermanentDelegate) && (
                    <div>
                      <h3 className="text-sm text-gray-400 mb-2">Token Extensions</h3>
                      <div className="space-y-2">
                        {extensionWarnings.map((warning, index) => {
                          // Xác định màu sắc và icon dựa trên loại cảnh báo
                          let bgColor = "bg-blue-500/10";
                          let borderColor = "border-blue-500/20";
                          let textColor = "text-blue-400";
                          let Icon = Info;
                          
                          if (warning.type === 'warning') {
                            bgColor = "bg-yellow-500/10";
                            borderColor = "border-yellow-500/20";
                            textColor = "text-yellow-400";
                            Icon = AlertTriangle;
                          } else if (warning.type === 'error') {
                            bgColor = "bg-red-500/10";
                            borderColor = "border-red-500/20";
                            textColor = "text-red-400";
                            Icon = AlertCircle;
                          }
                          
                          return (
                            <div key={index} className={`${bgColor} border ${borderColor} rounded-md p-3`}>
                              <div className="flex items-start mb-2">
                                <Icon className={`h-4 w-4 ${textColor} mt-0.5 mr-2 shrink-0`} />
                                <p className={`${textColor} font-medium text-sm`}>{warning.title}</p>
                              </div>
                              <p className={`text-xs ${textColor}/80 pl-6`}>
                                {warning.message}
                              </p>
                            </div>
                          );
                        })}
                        
                        {/* Hiển thị thông tin chi tiết nếu có transfer fee */}
                        {tokenExtensions.hasTransferFee && tokenExtensions.feePercentage && (
                          <div className="bg-gray-800/50 rounded-md p-3 mt-2">
                            <h4 className="text-sm text-white mb-2">Chi tiết Transfer Fee</h4>
                            <div className="space-y-1">
                              {amount && (
                                <>
                                  {(() => {
                                    const { feeAmount, receivedAmount } = calculateTransferFee(
                                      amount,
                                      tokenExtensions.feePercentage,
                                      currentToken?.decimals || 0
                                    );
                                    
                                    return (
                                      <>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400">Phí chuyển:</span>
                                          <span className="text-yellow-400">{tokenExtensions.feePercentage}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400">Số token gửi:</span>
                                          <span className="text-white">{amount} {currentToken?.symbol}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400">Phí ước tính:</span>
                                          <span className="text-yellow-400">
                                            {feeAmount} {currentToken?.symbol}
                                          </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm font-medium">
                                          <span className="text-gray-400">Số lượng thực nhận:</span>
                                          <span className="text-green-400">
                                            {receivedAmount} {currentToken?.symbol}
                                          </span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <div className="flex w-full gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsReviewing(false)}
                    >
                      Quay lại
                    </Button>
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={isProcessing || extensionWarnings.some(w => w.type === 'error')}
                      onClick={confirmTransfer}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Xác nhận giao dịch
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Hiển thị thông báo dựa trên loại cảnh báo */}
                  {extensionWarnings.some(w => w.type === 'error') && (
                    <p className="text-xs text-red-400 text-center">
                      Token có thuộc tính Non-Transferable không thể được chuyển đi.
                    </p>
                  )}
                  
                  {!extensionWarnings.some(w => w.type === 'error') && 
                   extensionWarnings.some(w => w.type === 'warning') && (
                    <p className="text-xs text-yellow-400 text-center">
                      Giao dịch này có phí transfer fee. Vui lòng kiểm tra số lượng thực nhận.
                    </p>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-xl">Chi tiết giao dịch</CardTitle>
                      <CardDescription className="text-gray-400">
                        Điền thông tin chi tiết để chuyển token
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
                  {lastUpdated && (
                    <p className="text-xs text-gray-500 mt-1">
                      Cập nhật lần cuối: {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </CardHeader>
                
                {isLoading ? (
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                    <p className="text-gray-400">Đang tải danh sách token...</p>
                  </CardContent>
                ) : isError ? (
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                    <p className="text-white text-lg font-medium mb-2">Không thể tải token</p>
                    <p className="text-gray-400 mb-4">Có lỗi xảy ra khi tải danh sách token</p>
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-white"
                      onClick={() => loadTokens(true)}
                    >
                      Thử lại
                    </Button>
                  </CardContent>
                ) : tokens.length === 0 ? (
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Wallet className="w-10 h-10 text-gray-500 mb-4" />
                    <p className="text-white text-lg font-medium mb-2">Không có token</p>
                    <p className="text-gray-400 mb-4">Bạn không có token nào để chuyển</p>
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-white"
                      onClick={() => router.push("/create")}
                    >
                      Tạo token mới
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token" className="text-white">Chọn Token</Label>
                      <Select value={selectedToken} onValueChange={setSelectedToken}>
                        <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                          <SelectValue placeholder="Chọn token để chuyển" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 max-h-80">
                          <div className="flex items-center px-2 pb-1 sticky top-0 bg-gray-800 z-10">
                            <Search className="w-4 h-4 text-gray-400 absolute left-4" />
                            <Input 
                              placeholder="Tìm kiếm token..." 
                              className="pl-8 bg-gray-700/50 border-gray-600 text-white text-sm"
                              value={tokenSearchTerm}
                              onChange={handleTokenSearch}
                              ref={searchInputRef}
                            />
                          </div>
                          
                          {filteredTokens.length > 0 ? (
                            filteredTokens.map((token) => (
                              <SelectItem key={token.id} value={token.id}>
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center mr-2">
                                    {token.image ? (
                                      <img 
                                        src={token.image} 
                                        alt={token.name} 
                                        className="w-full h-full object-cover" 
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{token.symbol.charAt(0)}</span>
                                      </div>
                                    )}
                                  </div>
                                  <span>{token.name} ({token.symbol})</span>
                                  <span className="ml-2 text-gray-400">
                                    - {formatTokenBalance(token.balance, token.decimals)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-gray-400 text-sm">
                              Không tìm thấy token nào
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {currentToken && (
                      <div className="bg-gray-800/40 rounded-md p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-400">Số dư hiện tại</p>
                          <p className="text-white font-medium">
                            {formatTokenBalance(currentToken.balance, currentToken.decimals)} {currentToken.symbol}
                          </p>
                        </div>
                        <div className="text-right">
                          <Button 
                            variant="ghost" 
                            className="text-purple-400 hover:text-purple-300 text-sm p-1"
                            onClick={handleMaxAmount}
                          >
                            MAX
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {currentToken && (
                      <div className="space-y-1">
                        {/* Hiển thị thông tin về token extensions */}
                        {tokenExtensions.hasNonTransferable && (
                          <div className="text-xs bg-red-500/20 text-red-400 p-2 rounded-md flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Token này không thể chuyển (Non-Transferable)
                          </div>
                        )}
                        
                        {tokenExtensions.hasTransferFee && (
                          <div className="text-xs bg-yellow-500/20 text-yellow-400 p-2 rounded-md">
                            <div className="flex items-start">
                              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                              <div>
                                <p className="font-medium">Token này có phí chuyển khoản ({tokenExtensions.feePercentage}%)</p>
                                {amount && (
                                  <div className="mt-1">
                                    <p>Số lượng gửi: {amount} {currentToken.symbol}</p>
                                    <p>Phí ước tính: {(parseFloat(amount) * (tokenExtensions.feePercentage || 0) / 100).toFixed(currentToken.decimals)} {currentToken.symbol}</p>
                                    <p className="font-medium">Người nhận sẽ nhận được: {(parseFloat(amount) * (1 - (tokenExtensions.feePercentage || 0) / 100)).toFixed(currentToken.decimals)} {currentToken.symbol}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {tokenExtensions.hasPermanentDelegate && (
                          <div className="text-xs bg-blue-500/20 text-blue-400 p-2 rounded-md flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Token này có Permanent Delegate
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-white">Địa chỉ người nhận</Label>
                      <Input
                        id="recipient"
                        placeholder="Địa chỉ ví Solana (Pubkey)"
                        className="bg-gray-800/70 border-gray-700 text-white"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-white">Số lượng</Label>
                      <Input
                        id="amount"
                        type="text"
                        placeholder="Nhập số lượng token"
                        className="bg-gray-800/70 border-gray-700 text-white"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    
                    <Separator className="bg-gray-700" />
                    
                    <div className="space-y-2">
                      <Label htmlFor="memo" className="text-white">Memo (tùy chọn)</Label>
                      <Input
                        id="memo"
                        placeholder="Thêm ghi chú cho giao dịch"
                        className="bg-gray-800/70 border-gray-700 text-white"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                      />
                    </div>
                  </CardContent>
                )}
                
                {!isLoading && !isError && tokens.length > 0 && (
                  <CardFooter className="flex flex-col gap-4">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={!selectedToken || !recipientAddress || !amount || isProcessing}
                      onClick={handleTransfer}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Xem lại giao dịch
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-gray-400 text-center">
                      Giao dịch sẽ được xác nhận thông qua ví đã kết nối của bạn.
                    </p>
                  </CardFooter>
                )}
                
                {/* Hiển thị thông tin cơ bản về giao dịch */}
                {selectedToken && currentToken && amount && (
                  <div className="mt-4 bg-gray-800/40 rounded-md p-3">
                    <h3 className="text-white text-sm font-medium mb-2">Thông tin giao dịch</h3>
                    <div className="space-y-1 text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>Số lượng:</span>
                        <span>{amount} {currentToken.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Người nhận:</span>
                        <span>{formatAddress(recipientAddress)}</span>
                      </div>
                      
                      {/* Hiển thị thông tin về phí nếu có */}
                      {tokenExtensions.hasTransferFee && (
                        <>
                          <div className="flex justify-between text-yellow-400">
                            <span>Phí chuyển ({tokenExtensions.feePercentage}%):</span>
                            <span>{(parseFloat(amount) * (tokenExtensions.feePercentage || 0) / 100).toFixed(currentToken.decimals)} {currentToken.symbol}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Số lượng thực nhận:</span>
                            <span>{(parseFloat(amount) * (1 - (tokenExtensions.feePercentage || 0) / 100)).toFixed(currentToken.decimals)} {currentToken.symbol}</span>
                          </div>
                        </>
                      )}
                      
                      {memo && (
                        <div className="flex justify-between">
                          <span>Memo:</span>
                          <span className="truncate max-w-[200px]">{memo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </CommonLayout>
  )
} 