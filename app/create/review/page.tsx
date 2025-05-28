"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { CommonLayout } from "@/components/common-layout"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { 
  Coins, 
  Percent, 
  Eye, 
  Key, 
  Lock, 
  Zap, 
  Shield, 
  FileText, 
  Check,
  AlertCircle,
  ArrowLeft,
  Medal,
  ExternalLink,
  Info
} from "lucide-react"
import { useConnection, useWallet} from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"

import { toast } from "sonner"
import { ipfsToHTTP } from "@/lib/utils/pinata"
import { createToken } from "@/lib/services/token-service"

// Định nghĩa interface cho kết quả tạo token
interface TokenCreationResult {
  mint: PublicKey;
  signature: string;
  token: any;
}

// Định nghĩa kiểu dữ liệu cho token extensions
type TokenExtensionType = {
  id: string
  icon: React.ElementType
  name: string
  description: string
  color: string
  bgColor: string
}

// Map từ ID sang thông tin extension
const tokenExtensionsMap: Record<string, TokenExtensionType> = {
  "transfer-fees": {
    id: "transfer-fees",
    icon: Percent,
    name: "Transfer Fees",
    description: "Automatically collect fees for each token transfer transaction",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
  },
  "confidential-transfer": {
    id: "confidential-transfer",
    icon: Eye,
    name: "Confidential Transfer",
    description: "Secure transaction information with zero-knowledge proofs",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  "permanent-delegate": {
    id: "permanent-delegate",
    icon: Key,
    name: "Permanent Delegate",
    description: "Assign a permanent delegate for the token",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
  "non-transferable": {
    id: "non-transferable",
    icon: Lock,
    name: "Non-Transferable",
    description: "Create tokens that cannot be transferred",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
  },
  "interest-bearing": {
    id: "interest-bearing",
    icon: Zap,
    name: "Interest Bearing",
    description: "Tokens that automatically generate interest over time",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
  },
  "default-account-state": {
    id: "default-account-state",
    icon: Shield,
    name: "Default Account State",
    description: "Set default state for all accounts of this token",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
  },
  "mint-close-authority": {
    id: "mint-close-authority",
    icon: Key,
    name: "Mint Close Authority",
    description: "Authority allowed to close this mint",
    color: "text-pink-600",
    bgColor: "bg-pink-600/10",
  },
  // Metadata được thêm mặc định, nhưng vẫn giữ lại để hiển thị trong UI review
  "metadata": {
    id: "metadata",
    icon: FileText,
    name: "Token Metadata",
    description: "Metadata embedded directly in the token (always enabled)",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
  }
}

// Định nghĩa các cặp extensions không tương thích
const incompatibleExtensionPairs: [string, string][] = [
  ["transfer-fees", "non-transferable"],
  ["non-transferable", "transfer-hook"],
  ["confidential-transfer", "transfer-fees"],
  ["confidential-transfer", "transfer-hook"],
  ["confidential-transfer", "permanent-delegate"],
  ["confidential-transfer", "non-transferable"]
];

// Hàm kiểm tra xem danh sách extensions có tương thích với nhau không
const checkExtensionsCompatibility = (extensions: string[]): { 
  compatible: boolean; 
  incompatiblePairs?: [string, string][] 
} => {
  const incompatiblePairs: [string, string][] = [];
  
  for (let i = 0; i < extensions.length; i++) {
    for (let j = i + 1; j < extensions.length; j++) {
      const ext1 = extensions[i];
      const ext2 = extensions[j];
      
      // Kiểm tra từng cặp extensions
      const isIncompatible = incompatibleExtensionPairs.some(
        pair => (pair[0] === ext1 && pair[1] === ext2) || 
                (pair[0] === ext2 && pair[1] === ext1)
      );
      
      if (isIncompatible) {
        incompatiblePairs.push([ext1, ext2]);
      }
    }
  }
  
  return { 
    compatible: incompatiblePairs.length === 0,
    incompatiblePairs: incompatiblePairs.length > 0 ? incompatiblePairs : undefined
  };
};

// Hàm kiểm tra tính đầy đủ thông tin của extensions đã chọn
const checkExtensionRequiredFields = (extensions: string[], extensionOptions: Record<string, any>): { 
  valid: boolean; 
  missingFields: Record<string, string[]>;
} => {
  const missingFields: Record<string, string[]> = {};
  let valid = true;
  
  for (const extensionId of extensions) {
    const extension = tokenExtensionsMap[extensionId];
    if (!extension) continue;
    
    // Kiểm tra các extension cần có thông tin nhập
    if (extensionId === "permanent-delegate") {
      const delegateAddress = extensionOptions[extensionId]?.["delegate-address"];
      if (!delegateAddress || typeof delegateAddress !== 'string' || delegateAddress.trim() === '') {
        missingFields[extensionId] = [...(missingFields[extensionId] || []), "Delegate Address"];
        valid = false;
      }
    }
    else if (extensionId === "mint-close-authority") {
      const closeAuthority = extensionOptions[extensionId]?.["close-authority"];
      if (!closeAuthority || typeof closeAuthority !== 'string' || closeAuthority.trim() === '') {
        missingFields[extensionId] = [...(missingFields[extensionId] || []), "Close Authority Address"];
        valid = false;
      }
    }
  }
  
  return { valid, missingFields };
};

export default function ReviewToken() {
  const router = useRouter()
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isLoading, setIsLoading] = useState(true)
  const [tokenData, setTokenData] = useState<any>(null)
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [createdTokenMint, setCreatedTokenMint] = useState<string | null>(null)
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)
  const [creationError, setCreationError] = useState<string | null>(null)
  const [metadataUri, setMetadataUri] = useState<string>("")

  useEffect(() => {
    // Mô phỏng việc tải dữ liệu
    const loadData = async () => {
      // Đọc dữ liệu từ localStorage
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem('tokenData')
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          
          setTokenData({
            name: parsedData.name,
            symbol: parsedData.symbol,
            decimals: parsedData.decimals,
            supply: parsedData.supply,
            description: parsedData.description,
            extensionOptions: parsedData.extensionOptions,
            websiteUrl: parsedData.websiteUrl || "",
            twitterUrl: parsedData.twitterUrl || "",
            telegramUrl: parsedData.telegramUrl || "",
            discordUrl: parsedData.discordUrl || ""
          })
          
          if (parsedData.selectedExtensions) {
            // Thêm "metadata" vào danh sách extension để hiển thị trong review
            const extensions = [...parsedData.selectedExtensions];
            if (!extensions.includes("metadata")) {
              extensions.push("metadata");
            }
            
            // Kiểm tra tính tương thích của các extensions
            const compatibility = checkExtensionsCompatibility(extensions);
            if (!compatibility.compatible && compatibility.incompatiblePairs) {
              const incompatibleNames = compatibility.incompatiblePairs.map(pair => {
                const ext1 = tokenExtensionsMap[pair[0]]?.name || pair[0];
                const ext2 = tokenExtensionsMap[pair[1]]?.name || pair[1];
                return `${ext1} và ${ext2}`;
              }).join(", ");
              
              toast.error(
                `Phát hiện các extensions không tương thích: ${incompatibleNames}. Vui lòng quay lại trang tạo token và điều chỉnh.`, 
                { duration: 6000 }
              );
            }
            
            // Kiểm tra thông tin bắt buộc của các extensions
            const requiredCheck = checkExtensionRequiredFields(extensions, parsedData.extensionOptions);
            if (!requiredCheck.valid) {
              const missingFieldsInfo = Object.entries(requiredCheck.missingFields)
                .map(([extId, fields]) => {
                  const extName = tokenExtensionsMap[extId]?.name || extId;
                  return `${extName}: ${fields.join(', ')}`;
                }).join("; ");
              
              toast.error(
                `Thiếu thông tin bắt buộc cho các extension: ${missingFieldsInfo}. Vui lòng quay lại trang tạo token và nhập đầy đủ.`,
                { duration: 6000 }
              );
              
              // Quay lại trang tạo token
              setTimeout(() => {
                router.push('/create');
              }, 3000);
            }
            
            setSelectedExtensions(extensions);
          }
          
          if (parsedData.imageUrl) {
            setImageUrl(parsedData.imageUrl)
          }

          setIsLoading(false)
        } else {
          // Không có dữ liệu, quay lại trang tạo
          router.push('/create')
        }
      }
    }
    
    loadData()
  }, [router])

  const handleConfirmCreate = async () => {
    if (!wallet.connected || !connection) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!wallet.publicKey) {
      toast.error("Wallet public key not available")
      return
    }
    
    // Kiểm tra tính tương thích của các extensions một lần nữa trước khi tạo token
    const compatibility = checkExtensionsCompatibility(selectedExtensions);
    if (!compatibility.compatible) {
      const incompatibleNames = compatibility.incompatiblePairs!.map(pair => {
        const ext1 = tokenExtensionsMap[pair[0]]?.name || pair[0];
        const ext2 = tokenExtensionsMap[pair[1]]?.name || pair[1];
        return `${ext1} và ${ext2}`;
      }).join(", ");
      
      toast.error(`Không thể tạo token: Các extensions ${incompatibleNames} không tương thích với nhau`);
      return;
    }
    
    // Kiểm tra thông tin bắt buộc của các extensions một lần nữa
    const requiredCheck = checkExtensionRequiredFields(selectedExtensions, tokenData.extensionOptions);
    if (!requiredCheck.valid) {
      const missingFieldsInfo = Object.entries(requiredCheck.missingFields)
        .map(([extId, fields]) => {
          const extName = tokenExtensionsMap[extId]?.name || extId;
          return `${extName}: ${fields.join(', ')}`;
        }).join("; ");
      
      toast.error(`Không thể tạo token: Thiếu thông tin bắt buộc cho các extension - ${missingFieldsInfo}`);
      return;
    }
    
    // Kiểm tra khả năng ký
    if (!wallet.signTransaction) {
      toast.error("Wallet does not support transaction signing")
      return
    }

    setIsCreating(true)
    setCreationError(null)
    
    try {
      // Hiển thị thông báo chi tiết về từng bước
      const toastId1 = toast.loading("Đang chuẩn bị dữ liệu token...");
      
      // Chuẩn bị dữ liệu token với imageUrl
      const tokenDataWithImage = {
        ...tokenData,
        imageUrl: imageUrl
      };
      
      // Truyền trực tiếp wallet context vào service
      const result = await createToken(
        connection,
        wallet,
        tokenDataWithImage,
        selectedExtensions
      );
      
      toast.dismiss(toastId1);
      toast.success("Đã tạo token thành công!");
      
      // Phần còn lại giữ nguyên
      setCreatedTokenMint(result.mint);
      setTransactionSignature(result.signature);
      setMetadataUri(result.metadataUri);
      setSuccess(true);
      
      // Xóa dữ liệu trong localStorage sau khi tạo thành công
      localStorage.removeItem('tokenData');
    } catch (error: any) {
      // Xử lý các lỗi cụ thể liên quan đến wallet
      console.error("Detailed token creation error:", error);
      
      let errorMessage = error.message || "Error creating token";
      
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient funds to complete the transaction. Please add more SOL to your wallet.";
      } else if (errorMessage.includes("blockhash")) {
        errorMessage = "Transaction timeout. Please try again.";
      } else if (errorMessage.includes("transaction too large")) {
        errorMessage = "Transaction size exceeds limit. Try reducing the number of extensions.";
      }
      
      setCreationError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  }

  const handleBack = () => {
    router.push('/create')
  }

  const goToHome = () => {
    router.push('/')
  }

  // Hiển thị loading skeleton khi đang tải dữ liệu
  if (isLoading || !tokenData) {
    return <PageLoadingSkeleton />
  }

  if (success) {
    return (
      <CommonLayout>
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl font-bold text-white mb-4"
            >
              Token Created Successfully!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-gray-400 text-xl mb-8"
            >
              Your token {tokenData.name} ({tokenData.symbol}) has been created with {selectedExtensions.length} extensions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-8"
            >
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Medal className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Token Details</h3>
              </div>
              
              {imageUrl ? (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">Token Image:</p>
                  <div className="flex items-center mt-2">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30 bg-gray-800 mr-3">
                      <img 
                        src={imageUrl} 
                      alt="Token Icon" 
                      className="w-full h-full object-cover"
                    />
                    </div>
                    <div>
                      <a 
                        href={ipfsToHTTP(metadataUri || "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                      >
                        View Token Metadata
                        <ExternalLink className="inline-block ml-1 h-3 w-3" />
                      </a>
                      <p className="text-gray-500 text-xs mt-1">
                        Image will be displayed in wallets and explorers
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm">Token Image:</p>
                  <div className="flex items-center mt-2">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-800 mr-3 flex items-center justify-center">
                      <Info className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-yellow-400 text-sm">No image provided</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Your token will be created without an image
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-left mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Token Name:</p>
                  <p className="text-white font-medium">{tokenData.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Symbol:</p>
                  <p className="text-white font-medium">{tokenData.symbol}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Decimals:</p>
                  <p className="text-white font-medium text-lg">{tokenData.decimals}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Supply:</p>
                  <p className="text-white font-medium">{parseInt(tokenData.supply).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-2">
                <p className="text-gray-400 text-sm">Mint Address:</p>
                <p className="text-white font-mono text-sm break-all">{createdTokenMint}</p>
              </div>

              <div className="pt-2">
                <p className="text-gray-400 text-sm">Transaction:</p>
                <a 
                  href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-sm break-all flex items-center"
                >
                  {transactionSignature}
                  <ExternalLink className="inline-block ml-1 h-3 w-3" />
                </a>
              </div>

              <div className="pt-2">
                <p className="text-gray-400 text-sm">Metadata:</p>
                <div className="flex items-center">
                  <a 
                    href={ipfsToHTTP(metadataUri || "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-sm break-all flex items-center"
                  >
                    {metadataUri ? 
                      <>
                        View Token Metadata
                    <ExternalLink className="inline-block ml-1 h-3 w-3" />
                      </> : 
                      "Metadata not available yet"
                    }
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-7 text-xs"
                    onClick={() => {
                      if (metadataUri) {
                        window.open(ipfsToHTTP(metadataUri), '_blank');
                      }
                    }}
                    disabled={!metadataUri}
                  >
                    Verify
                  </Button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Tip: Verify your token metadata to ensure all attributes are correctly displayed on Solscan
                </p>
              </div>

              {/* Hiển thị các liên kết mạng xã hội */}
              {(tokenData.websiteUrl || tokenData.twitterUrl || tokenData.telegramUrl || tokenData.discordUrl) && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm mb-3 text-center">Social Links</p>
                  <div className="flex justify-center space-x-5">
                    {tokenData.websiteUrl && (
                      <a 
                        href={tokenData.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-400 hover:text-purple-400 transition-colors"
                        title="Website"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.5 8.5-3-2.5a1 1 0 0 0-1.5 1V12a1 1 0 0 0 1.5 1l3-2.5a1 1 0 0 0 0-2Z"/>
                        </svg>
                      </a>
                    )}
                    
                    {tokenData.twitterUrl && (
                      <a 
                        href={tokenData.twitterUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:text-purple-400 transition-colors"
                        title="Twitter"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                        </svg>
                      </a>
                    )}
                    
                    {tokenData.telegramUrl && (
                      <a 
                        href={tokenData.telegramUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:text-purple-400 transition-colors"
                        title="Telegram"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m22 8-5 5-5-5 5-5-5 5-5-5 5 5-5 5 5-5"/>
                          <path d="M2 12h10"/>
                          <path d="M17 22v-8.3a4 4 0 0 0-4-4h-1.7"/>
                        </svg>
                      </a>
                    )}
                    
                    {tokenData.discordUrl && (
                      <a 
                        href={tokenData.discordUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-indigo-400 hover:text-purple-400 transition-colors"
                        title="Discord"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 20a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3"/>
                          <path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                          <path d="M18 9a5 5 0 0 0-6-5 5 5 0 0 0-6 5v1a2 2 0 1 0 0 4"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex justify-center space-x-4"
            >
              <Button 
                onClick={goToHome}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
              >
                Return to Home
              </Button>
              
              <Button 
                onClick={() => window.open(`https://explorer.solana.com/address/${createdTokenMint}?cluster=devnet`, '_blank')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-6 text-lg"
              >
                View on Explorer
              </Button>
            </motion.div>
          </div>
        </div>
      </CommonLayout>
    )
  }

  return (
    <CommonLayout>
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Review Your 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}Token
            </span>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Confirm your token details before creating it on Solana
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Coins className="w-5 h-5 mr-2" />
                  Token Details
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Review the basic information for your token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Token Name</h3>
                    <p className="text-white font-medium text-lg">{tokenData.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Symbol</h3>
                    <p className="text-white font-medium text-lg">{tokenData.symbol}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Decimals</h3>
                    <p className="text-white font-medium text-lg">{tokenData.decimals}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Initial Supply</h3>
                    <p className="text-white font-medium text-lg">{parseInt(tokenData.supply).toLocaleString()}</p>
                  </div>
                </div>

                {imageUrl && (
                  <div className="pt-2 flex flex-col items-center">
                    <h3 className="text-sm text-gray-400 mb-3">Token Image</h3>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500/30 flex items-center justify-center bg-gray-800">
                      <img 
                        src={imageUrl} 
                        alt="Token" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <h3 className="text-sm text-gray-400 mb-1">Description</h3>
                  <p className="text-white bg-gray-800/50 p-3 rounded-lg min-h-[80px]">
                    {tokenData.description || <span className="text-gray-500 italic">No description provided</span>}
                  </p>
                </div>

                {/* Hiển thị các URL mạng xã hội nếu có */}
                {(tokenData.websiteUrl || tokenData.twitterUrl || tokenData.telegramUrl || tokenData.discordUrl) && (
                  <div className="pt-4">
                    <h3 className="text-sm text-gray-400 mb-3">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tokenData.websiteUrl && (
                        <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.5 8.5-3-2.5a1 1 0 0 0-1.5 1V12a1 1 0 0 0 1.5 1l3-2.5a1 1 0 0 0 0-2Z"/>
                          </svg>
                          <a 
                            href={tokenData.websiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-white truncate hover:text-purple-400 transition-colors"
                          >
                            {tokenData.websiteUrl}
                          </a>
                        </div>
                      )}
                      
                      {tokenData.twitterUrl && (
                        <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                          </svg>
                          <a 
                            href={tokenData.twitterUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-white truncate hover:text-purple-400 transition-colors"
                          >
                            {tokenData.twitterUrl}
                          </a>
                        </div>
                      )}
                      
                      {tokenData.telegramUrl && (
                        <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                            <path d="m22 8-5 5-5-5 5-5-5 5-5-5 5 5-5 5 5-5"/>
                            <path d="M2 12h10"/>
                            <path d="M17 22v-8.3a4 4 0 0 0-4-4h-1.7"/>
                          </svg>
                          <a 
                            href={tokenData.telegramUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-white truncate hover:text-purple-400 transition-colors"
                          >
                            {tokenData.telegramUrl}
                          </a>
                        </div>
                      )}
                      
                      {tokenData.discordUrl && (
                        <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                            <path d="M18 20a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3"/>
                            <path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                            <path d="M18 9a5 5 0 0 0-6-5 5 5 0 0 0-6 5v1a2 2 0 1 0 0 4"/>
                          </svg>
                          <a 
                            href={tokenData.discordUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-white truncate hover:text-purple-400 transition-colors"
                          >
                            {tokenData.discordUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-1"
          >
            <Card className="bg-gray-900/50 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Selected Extensions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {selectedExtensions.length} extensions selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedExtensions.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    <p>No extensions selected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedExtensions.map((extId) => {
                      const extension = tokenExtensionsMap[extId];
                      if (!extension) return null;
                      const IconComponent = extension.icon;
                      
                      const extensionOptions = tokenData.extensionOptions?.[extId];
                      
                      return (
                        <div 
                          key={extId}
                          className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                        >
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${extension.bgColor} mr-3`}>
                              <IconComponent className={`w-4 h-4 ${extension.color}`} />
                            </div>
                            <div className="w-full">
                              <p className="text-white font-medium">{extension.name}</p>
                              {renderExtensionDetails(extId, extensionOptions)}
                                    </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Token extensions cannot be added or removed after creation. Please review carefully.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleConfirmCreate}
                disabled={isCreating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
              >
                {isCreating ? 
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Creating...
                  </span> : 
                  <span>Confirm & Create Token</span>
                }
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleBack}
                disabled={isCreating}
                className="w-full text-white border-gray-700 hover:bg-gray-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Edit
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </CommonLayout>
  )
} 

// Hiển thị chi tiết cấu hình extension trong review
const renderExtensionDetails = (extId: string, options: any) => {
  if (extId === "permanent-delegate" && options?.["delegate-address"]) {
    return (
      <div className="text-xs text-gray-400 mt-2 pl-2 border-l-2 border-gray-700">
        <div className="flex">
          <span className="text-gray-500 w-24">Address:</span>
          <span className="text-gray-300 truncate font-mono">{options["delegate-address"]}</span>
        </div>
      </div>
    );
  }
  
  if (extId === "transfer-fees" && options?.["fee-percentage"] !== undefined) {
    return (
      <div className="text-xs text-gray-400 mt-2 pl-2 border-l-2 border-gray-700">
        <div className="flex">
          <span className="text-gray-500 w-24">Fee Rate:</span>
          <span className="text-gray-300">{options["fee-percentage"]}%</span>
        </div>
      </div>
    );
  }
  
  if (extId === "interest-bearing" && options?.["interest-rate"] !== undefined) {
    return (
      <div className="text-xs text-gray-400 mt-2 pl-2 border-l-2 border-gray-700">
        <div className="flex">
          <span className="text-gray-500 w-24">Annual Rate:</span>
          <span className="text-gray-300">{options["interest-rate"]}%</span>
        </div>
      </div>
    );
  }
  
  if (extId === "mint-close-authority" && options?.["close-authority"]) {
    return (
      <div className="text-xs text-gray-400 mt-2 pl-2 border-l-2 border-gray-700">
        <div className="flex">
          <span className="text-gray-500 w-24">Authority:</span>
          <span className="text-gray-300 truncate font-mono">{options["close-authority"]}</span>
        </div>
      </div>
    );
  }
  
  return null;
}; 