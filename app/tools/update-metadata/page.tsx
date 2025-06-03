"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { CommonLayout } from "@/components/common-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Search, Settings, AlertCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { PublicKey, LAMPORTS_PER_SOL, Transaction, TransactionInstruction } from "@solana/web3.js"
import { WalletButton } from "@/components/wallet-button"
import { getTokenMetadata } from "@solana/spl-token"
import { TokenMetadataToken } from "solana-token-extension-boost"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { TokenMintInput } from "@/components/token/TokenMintInput"
import { MetadataEditor, TokenMetadataValues } from "@/components/token/MetadataEditor"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import {
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import Link from "next/link"

// Xóa bỏ hàm convertToHttpUrl bị lỗi và thay thế bằng hàm đơn giản hơn
const getImageUrl = (uri: string): string => {
  if (!uri) return '';

  // Nếu đã là URL HTTP, trả về nguyên vẹn
  if (uri.startsWith('http')) {
    return uri;
  }

  // Xử lý URI IPFS một cách đơn giản - ưu tiên Cloudflare gateway
  if (uri.startsWith('ipfs://')) {
    return `https://cloudflare-ipfs.com/ipfs/${uri.replace('ipfs://', '')}`;
  }

  // Trường hợp đã là URL gateway.pinata.cloud
  if (uri.includes('/ipfs/')) {
    return uri;
  }

  // Trường hợp chỉ là CID
  if (/^[a-zA-Z0-9]{46,59}$/.test(uri)) {
    return `https://cloudflare-ipfs.com/ipfs/${uri}`;
  }

  return uri;
};

// Khắc phục lỗi tải ảnh dựa trên URI - hàm này vẫn giữ
const getImageFallback = (tokenName: string = "", tokenSymbol: string = ""): string => {
  const symbol = tokenSymbol.charAt(0) || "";
  const name = tokenName.charAt(0) || "";
  const letter = symbol || name || "?";
  
  // Use placeholder text
  return `https://placehold.co/200x200/6366f1/ffffff?text=${letter}`;
};

// Đơn giản hóa hàm fetchImageUrlFromMetadata
const fetchImageUrlFromMetadata = async (metadataUrl: string): Promise<string> => {
  try {
    if (!metadataUrl) return "";
    
    // Prioritize HTTP URL
    const httpUrl = getImageUrl(metadataUrl);
    
    // Load metadata with timeout to avoid waiting too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(httpUrl, { 
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Could not load metadata: ${response.status}`);
    }
    
    const metadata = await response.json();
    
    // Return direct image URL if available
    if (metadata.image) {
      return getImageUrl(metadata.image);
    }
    
    return "";
  } catch (error) {
    return "";
  }
};

// Tạo interface cho metadata update options
interface MetadataUpdateOptions {
  priorityLevel?: 'low' | 'medium' | 'high';
  skipPreflight?: boolean;
  allocateStorage?: boolean;
}

// Type cho metadata sử dụng trong ứng dụng
type TokenMetadataType = {
  name?: string;
  symbol?: string;
  uri?: string;
  additionalMetadata?: readonly (readonly [string, string])[];
};

export default function UpdateTokenMetadata() {
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    mint?: string;
  }>({})
  const [tokenData, setTokenData] = useState<TokenMetadataValues>({
    mint: "",
    name: "",
    symbol: "",
    description: "",
    imageUrl: "",
    websiteUrl: "",
    twitterUrl: "",
    telegramUrl: "",
    discordUrl: "",
    additionalMetadata: {}
  })

  // State to store successful transaction signature
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)
  
  // State to track fields that have been deleted (need to be removed on blockchain)
  const [fieldsToRemove, setFieldsToRemove] = useState<string[]>([])

  const wallet = useWallet()
  const { connection } = useConnection()

  useEffect(() => {
      setIsLoading(false)
  }, [])

  // Function to load token metadata
  const fetchTokenMetadata = async (mintAddress: string) => {
    if (!mintAddress.trim()) {
      setFormErrors({...formErrors, mint: "Please enter a token mint address"})
      return
    }
    
    try {
      const mintPubkey = new PublicKey(mintAddress)
      
      // Get metadata information
      const metadata = await getTokenMetadata(
        connection,
        mintPubkey,
        "confirmed"
      )
      
      if (!metadata) {
        toast.error("Token not found or has no metadata")
        return
      }
      
      // Create object to store additionalMetadata fields
      const additionalMetadataObj: Record<string, string> = {}
      if (metadata.additionalMetadata && metadata.additionalMetadata.length > 0) {
        for (const [key, value] of metadata.additionalMetadata) {
          additionalMetadataObj[key] = value
        }
      }

      // Create website, twitter from additionalMetadata if available
      const websiteUrl = additionalMetadataObj["website"] || ""
      const twitterUrl = additionalMetadataObj["twitter"] || ""
      const telegramUrl = additionalMetadataObj["telegram"] || ""
      const discordUrl = additionalMetadataObj["discord"] || ""
      const description = additionalMetadataObj["description"] || ""
      
      // Remove processed fields from additionalMetadata
      delete additionalMetadataObj["website"]
      delete additionalMetadataObj["twitter"] 
      delete additionalMetadataObj["telegram"]
      delete additionalMetadataObj["discord"]
      delete additionalMetadataObj["description"]
      
      // Default to fallback avatar
      const fallbackImage = getImageFallback(metadata.name, metadata.symbol);
      let imageUrl = fallbackImage;
      
      // Show loading toast
      toast.loading("Loading token information...", { id: "loading-metadata" });
      
      // Load metadata to get image URL
      if (metadata.uri) {
        try {
          const actualImageUrl = await fetchImageUrlFromMetadata(metadata.uri);
          if (actualImageUrl) {
            imageUrl = actualImageUrl;
          }
        } catch (error) {
          // Handle error silently, keep fallback
        }
      }
      
      // Remove loading toast
      toast.dismiss("loading-metadata");

      // Update form with metadata information
      setTokenData({
        mint: mintAddress,
        name: metadata.name || "",
        symbol: metadata.symbol || "",
        description,
        imageUrl: imageUrl,
        additionalMetadata: additionalMetadataObj,
        websiteUrl,
        twitterUrl,
        telegramUrl,
        discordUrl
      })
      
      // Clear errors if any
      setFormErrors({})
      toast.success("Token metadata loaded successfully")
      
    } catch (error) {
      toast.error("Could not load metadata information. Please check the token address.")
    }
  }

  // Create wallet adapter proxy for transaction signing
  const getWalletAdapter = () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected or does not support transaction signing")
    }
    
      return {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction
    }
  }

  // Function to automatically optimize metadata update cost
  const optimizeMetadataUpdate = async (
    currentMetadata: TokenMetadataType | null,
    newData: TokenMetadataValues
  ) => {
    // Initialize object containing fields that have actually changed
    const changedFields: Record<string, string> = {};
    let hasChanges = false;

    // Get current metadata fields
    const currentFields: Record<string, string> = {};
    if (currentMetadata?.additionalMetadata) {
      for (const [key, value] of currentMetadata.additionalMetadata) {
        currentFields[key] = value;
      }
    }

    // Compare and only get changed fields
    // Description field
    if (newData.description && newData.description !== currentFields.description) {
      changedFields.description = newData.description;
      hasChanges = true;
    }

    // Social media fields
    if (newData.websiteUrl && newData.websiteUrl !== currentFields.website) {
      changedFields.website = newData.websiteUrl;
      hasChanges = true;
    }

    if (newData.twitterUrl && newData.twitterUrl !== currentFields.twitter) {
      changedFields.twitter = newData.twitterUrl;
      hasChanges = true;
    }

    if (newData.telegramUrl && newData.telegramUrl !== currentFields.telegram) {
      changedFields.telegram = newData.telegramUrl;
      hasChanges = true;
    }

    if (newData.discordUrl && newData.discordUrl !== currentFields.discord) {
      changedFields.discord = newData.discordUrl;
      hasChanges = true;
    }

    // Custom fields
    Object.entries(newData.additionalMetadata).forEach(([key, value]) => {
      if (value.trim() !== '' && value !== currentFields[key]) {
        changedFields[key] = value;
        hasChanges = true;
      }
    });

    // Remove URI check
    const hasUriChange = false; // Don't allow changing token image

    // Calculate total changes
    const totalChanges = Object.keys(changedFields).length + fieldsToRemove.length;
    
    // Fixed priority level is 'medium' - simplified
    const optimalPriority: 'low' | 'medium' | 'high' = 'medium';
    
    // Each transaction will process up to 10 fields
    const optimalFieldsPerTx = 10;
    
    return {
      changedFields,
      hasUriChange,
      hasChanges,
      totalChanges,
      optimalPriority,
      optimalFieldsPerTx
    };
  };

  const handleUpdateMetadata = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet to continue")
      return
    }
    
    if (!tokenData.mint) {
      setFormErrors({...formErrors, mint: "Please enter a token mint address"})
      return
    }
    
    try {
      setUpdating(true)
      // Reset transaction signature when starting a new transaction
      setTransactionSignature(null)
      const mintPubkey = new PublicKey(tokenData.mint)
      
      // Load token with TokenMetadataToken extension
      const tokenWithMetadata = await TokenMetadataToken.fromMint(connection, mintPubkey)
      if (!tokenWithMetadata) {
        toast.error("Token not found or has no metadata extension")
        return
      }
      
      // Get current metadata to compare changes
      const currentMetadata = await getTokenMetadata(connection, mintPubkey, "confirmed")
      
      // Use optimization function to only update fields that have actually changed
      const {
        changedFields,
        hasChanges,
        optimalPriority,
        optimalFieldsPerTx
      } = await optimizeMetadataUpdate(currentMetadata, tokenData);
      
      // Check if any fields need to be removed
      const hasFieldsToRemove = fieldsToRemove.length > 0;
      
      // If there are no changes, notify and exit
      if (!hasChanges && !hasFieldsToRemove) {
        toast.info("No information needs to be updated");
        setUpdating(false);
        return;
      }

      try {
        // Get wallet adapter to avoid null/undefined errors
        const walletAdapter = getWalletAdapter();
        
        // Change: Instead of splitting into separate transactions, we combine instructions
        let allInstructions: TransactionInstruction[] = [];
        
        // Add priority fee instruction
        allInstructions.push(
          TokenMetadataToken.createPriorityFeeInstruction(optimalPriority)
        );
        
        // Add instructions to remove metadata fields
        if (hasFieldsToRemove) {
          for (const key of fieldsToRemove) {
            allInstructions.push(
              tokenWithMetadata.createRemoveMetadataFieldInstruction(walletAdapter.publicKey, key, true)
            );
          }
        }
        
        // Add instructions to update other metadata - only fields that have actually changed
        if (hasChanges) {
          // Use batch storage calculation method for optimization
          const storageIx = await tokenWithMetadata.calculateBatchStorageInstruction(
            connection, walletAdapter.publicKey, changedFields
          );
          if (storageIx) {
            allInstructions.push(storageIx);
          }
          
          // Add instruction to update each metadata field
          for (const [key, value] of Object.entries(changedFields)) {
            allInstructions.push(
              tokenWithMetadata.createUpdateMetadataFieldInstruction(
                walletAdapter.publicKey, key, value
              )
            );
          }
        }
        
        // Split instructions into multiple transactions if needed
        const chunkedTransactions: TransactionInstruction[][] = [];
        const MAX_INSTRUCTIONS_PER_TX = Math.min(15, optimalFieldsPerTx); // Limit number of instructions in 1 transaction
        
        // Ensure each transaction has a priority fee instruction
        for (let i = 0; i < allInstructions.length; i += MAX_INSTRUCTIONS_PER_TX) {
          if (i === 0) {
            // First package already has priority instruction
            chunkedTransactions.push(allInstructions.slice(i, i + MAX_INSTRUCTIONS_PER_TX));
          } else {
            // Later packages need new priority instruction
            const chunk = [TokenMetadataToken.createPriorityFeeInstruction(optimalPriority)];
            chunk.push(...allInstructions.slice(i, i + MAX_INSTRUCTIONS_PER_TX - 1));
            chunkedTransactions.push(chunk);
          }
        }
        
        // Execute each transaction
        const signatures = [];
        
        for (let i = 0; i < chunkedTransactions.length; i++) {
          const instructionChunk = chunkedTransactions[i];
          
          // Create transaction
          const transaction = new Transaction();
          transaction.add(...instructionChunk);
          
          // Set up transaction
          transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          transaction.feePayer = walletAdapter.publicKey;
          
          // Sign and send transaction
          const signedTx = await walletAdapter.signTransaction(transaction);
          const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true
          });
          
          // Confirm transaction
          await connection.confirmTransaction(signature, 'confirmed');
          signatures.push(signature);
          
          toast.success(`Completed transaction ${i + 1}/${chunkedTransactions.length}`);
        }
        
        if (signatures.length > 0) {
          // Save last signature to display success screen
          setTransactionSignature(signatures[signatures.length - 1]);
          toast.success("Metadata update complete!");
          
          // Reset list of fields to remove
          setFieldsToRemove([]);
        }
        
      } catch (error) {
        const err = error as Error;
        toast.error(`Could not complete transaction: ${err.message}`);
      }
      
    } catch (err) {
      const error = err as Error;
      
      // Check for rent-related errors
      if (error.toString().includes("Insufficient Funds For Rent")) {
        toast.error("Not enough SOL in wallet for metadata storage fees. Please add more SOL to your wallet.");
      } else {
        toast.error(`Could not update metadata: ${error.message || "Please try again later."}`);
      }
    } finally {
      setUpdating(false);
    }
  }

  const handleMetadataChange = (newValues: Partial<TokenMetadataValues>) => {
    setTokenData(prev => ({ ...prev, ...newValues }))
  }

  const handleAddCustomField = (key: string, value: string) => {
    setTokenData(prev => ({
      ...prev,
      additionalMetadata: {
        ...prev.additionalMetadata,
        [key]: value
      }
    }))
    toast.success(`Added metadata field: ${key}`)
    }

  const handleRemoveCustomField = (key: string) => {
    const newAdditionalMetadata = { ...tokenData.additionalMetadata };
    delete newAdditionalMetadata[key];
    
    // Add key to list of fields to remove on blockchain
    setFieldsToRemove(prev => [...prev, key]);
    
    setTokenData(prev => {
      const updated = {
        ...prev,
        additionalMetadata: newAdditionalMetadata
      };
      return updated;
    });
    
    toast.success(`Removed metadata field: ${key}`);
  }

  const handleUpdateCustomField = (key: string, value: string) => {
    setTokenData(prev => ({
      ...prev,
      additionalMetadata: {
        ...prev.additionalMetadata,
        [key]: value
      }
    }))
  }

  if (isLoading) {
    return <PageLoadingSkeleton />
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
            Update 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}Token Metadata
            </span>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Update token metadata with optimized settings
          </p>
        </motion.div>
          
        <div className="max-w-4xl mx-auto space-y-8">
          {transactionSignature ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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
                  <h3 className="text-white text-xl font-medium mb-2">Metadata updated successfully!</h3>
                  <p className="text-gray-400 mb-4">
                    Transaction has been confirmed on the blockchain
                  </p>
                  <div className="bg-gray-800/50 rounded-md p-3 w-full mb-4">
                    <p className="text-sm text-gray-400 mb-1">Transaction Signature</p>
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
                        // Reset form if needed
                      }}
                    >
                      Update Again
            </Button>
          </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Token Mint Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Search className="w-5 h-5 mr-2" />
                      Token Mint Address
                </CardTitle>
                    <CardDescription className="text-gray-400">
                      Enter token mint address to load metadata information
                </CardDescription>
              </CardHeader>
              <CardContent>
                    <TokenMintInput 
                      onLoadMetadata={fetchTokenMetadata} 
                      onChange={(value) => setTokenData(prev => ({ ...prev, mint: value }))}
                      value={tokenData.mint}
                      error={formErrors.mint}
                    />
                  </CardContent>
                </Card>
              </motion.div>
                      
              {/* Token Metadata Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Metadata Information
            </CardTitle>
                    <CardDescription className="text-gray-400">
                      Update metadata information for your token
            </CardDescription>
          </CardHeader>
          <CardContent>
                    <MetadataEditor 
                      metadata={tokenData}
                      onMetadataChange={handleMetadataChange}
                      onCustomFieldAdd={handleAddCustomField}
                      onCustomFieldRemove={handleRemoveCustomField}
                      onCustomFieldUpdate={handleUpdateCustomField}
                      imageNamePrefix={tokenData.name ? `token-${tokenData.name.toLowerCase()}` : "token"}
                    />
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Remove Advanced Options section */}
              
              <div className="flex justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                                <Button
                        className="bg-purple-600 hover:bg-purple-700 text-white py-5 text-base px-6"
                            onClick={handleUpdateMetadata}
                        disabled={updating || !wallet.connected}
                          >
                        {updating ? (
                              <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                              </>
                            ) : (
                              <>
                            <FileText className="mr-1.5 h-4 w-4" />
                            Update Metadata
                              </>
                            )}
                          </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{wallet.connected ? "Update token metadata" : "Connect wallet to continue"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                        </div>
            </>
                        )}
                      </div>
      </div>
    </CommonLayout>
  )
} 