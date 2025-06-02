"use client";

import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { TOKEN_2022_PROGRAM_ID, getMint } from "@solana/spl-token";
import Link from "next/link";

import { CommonLayout } from "@/components/common-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WalletButton } from "@/components/wallet-button";
import {
  ArrowLeft,
  XCircle,
  ExternalLink,
  Loader2,
  Info,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { closeMint, getCloseableMints, MintInfo } from "@/lib/services/close-mint";
import { getUserTokens, TokenItem } from "@/lib/services/tokenList";

export default function CloseMintPage() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isMounted, setIsMounted] = useState(false);

  const [mints, setMints] = useState<MintInfo[]>([]); 
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMintInfo, setSelectedMintInfo] = useState<MintInfo | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    canClose: boolean;
    supply: string;
    hasCloseAuthority: boolean;
    message: string;
  } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);

  // Add state to track transaction status
  const [transactionResult, setTransactionResult] = useState<{
    signature: string;
    mintAddress: string;
    message?: string;
  } | null>(null);

  const { publicKey } = wallet;

  // Avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get user's closeable mint accounts
  useEffect(() => {
    if (!connection || !publicKey) return;

    const fetchMints = async () => {
      setIsLoading(true);
      try {
        // Lấy tất cả các mint accounts có supply = 0
        const closeableMints = await getCloseableMints(connection, wallet);
        setMints(closeableMints);
        console.log(`Found ${closeableMints.length} closeable mints`);
      } catch (error) {
        console.error("Error fetching closeable mints:", error);
        toast.error("Failed to load closeable mints");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMints().catch(console.error);
  }, [connection, publicKey, wallet]);

  // Update selected mint info
  useEffect(() => {
    if (selectedMint && mints.length > 0) {
      const mint = mints.find((m) => m.address === selectedMint);
      if (mint) {
        setSelectedMintInfo(mint);
        // Reset verification
        setVerifyResult(null);
      }
    } else {
      setSelectedMintInfo(null);
    }
  }, [selectedMint, mints]);

  // Verify if mint can be closed
  const verifyMint = async () => {
    if (!connection || !publicKey || !selectedMint) {
      toast.error("Please connect your wallet and select a mint");
      return;
    }
    
    setVerifyLoading(true);
    
    try {
      const mintPubkey = new PublicKey(selectedMint);
      
      console.log("Checking mint status...");
      console.log("Selected mint:", selectedMint);
      
      // Get mint info
      const mintInfo = await getMint(
        connection,
        mintPubkey,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );
      
      // Check supply
      const isZeroSupply = mintInfo.supply === BigInt(0);
      
      // Check if user is the mint authority
      const hasMintAuthority = mintInfo.mintAuthority?.equals(publicKey) || false;
      
      // Set verification result
      if (isZeroSupply && hasMintAuthority) {
        setVerifyResult({
          canClose: true,
          supply: mintInfo.supply.toString(),
          hasCloseAuthority: hasMintAuthority,
          message: "This mint can be closed"
        });
        toast.success("Verification successful: This mint can be closed");
      } else {
        setVerifyResult({
          canClose: false,
          supply: mintInfo.supply.toString(),
          hasCloseAuthority: hasMintAuthority,
          message: !isZeroSupply 
            ? "Cannot close: Token supply is not zero" 
            : "Cannot close: You are not the mint authority"
        });
        toast.error("Verification failed: " + (!isZeroSupply 
          ? "Token supply is not zero" 
          : "You are not the mint authority"));
      }
    } catch (error: any) {
      console.error("Error during verification:", error);
      toast.error(`Verification error: ${error.message}`);
      setVerifyResult({
        canClose: false,
        supply: "Unknown",
        hasCloseAuthority: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCloseMint = async () => {
    if (!connection || !wallet.publicKey || !selectedMintInfo) {
      toast.error("Please connect your wallet and select a mint");
      return;
    }

    if (!verifyResult || !verifyResult.canClose) {
      toast.error("Please verify the mint can be closed first");
      return;
    }

    setLoading(true);
    toast.loading("Processing mint closure...");

    try {
      const result = await closeMint({
        connection,
        wallet,
        mintAddress: selectedMint!
      });
      
      if (result && result.signature) {
        toast.success("Mint account closed successfully");
        console.log("Transaction ID:", result.signature);
        console.log(`https://explorer.solana.com/tx/${result.signature}`);
        
        // Set transaction result for success screen
        setTransactionResult(result);
        
        // Reset form
        setSelectedMint(null);
        setVerifyResult(null);
      } else {
        toast.error("Mint closure failed");
      }
    } catch (error: any) {
      console.error("Mint closure error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset result and go back to form
  const handleReset = () => {
    setTransactionResult(null);
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/30 to-red-500/30 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Close Mint
          </h1>
          <p className="text-gray-400 text-lg max-w-xl text-center">
            Permanently close token mint authority
          </p>
        </motion.div>

        {!wallet.connected ? (
          <div className="flex justify-center mb-8">
            <WalletButton />
          </div>
        ) : transactionResult ? (
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
              <h3 className="text-white text-xl font-medium mb-2">Mint Closed Successfully!</h3>
              <p className="text-gray-400 mb-4">
                {transactionResult.message || "Mint account has been permanently closed"}
              </p>
              <div className="bg-gray-800/50 rounded-md p-3 w-full mb-4">
                <p className="text-sm text-gray-400 mb-1">Signature</p>
                <p className="text-xs text-gray-300 break-all">{transactionResult.signature}</p>
              </div>
              <div className="bg-gray-800/50 rounded-md p-3 w-full mb-4">
                <p className="text-sm text-gray-400 mb-1">Mint Address</p>
                <p className="text-xs text-gray-300 break-all">{transactionResult.mintAddress}</p>
              </div>
              <div className="flex gap-2">
                <Link 
                  href={`https://explorer.solana.com/tx/${transactionResult.signature}?cluster=devnet`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="flex items-center gap-1">
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </Button>
                </Link>
                <Button 
                  onClick={handleReset}
                >
                  Close Another Mint
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-xl"
          >
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">Close Mint Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Permanently close a token mint account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-red-900/20 border-red-700 text-red-100">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertTitle>Warning: This action is irreversible</AlertTitle>
                  <AlertDescription className="text-red-200">
                    Closing a mint is permanent and cannot be undone. You can only close a mint when:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Token supply is zero</li>
                      <li>You are the mint authority</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                {/* Token Selection */}
                <div className="space-y-2">
                  <Label htmlFor="token-select">Select Mint</Label>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <p className="text-gray-400">Loading mints...</p>
                    </div>
                  ) : mints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                      <p className="text-white text-sm font-medium mb-2">No closeable mints found</p>
                      <p className="text-gray-400 text-xs mb-2">You don't have any mints with zero supply. Only mints with a supply of zero can be closed.</p>
                      <Button 
                        variant="outline" 
                        className="border-gray-600 text-white text-xs"
                        onClick={() => router.push("/create")}
                        size="sm"
                      >
                        Create a mint
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={selectedMint || ""}
                        onValueChange={(value) => setSelectedMint(value)}
                        disabled={!wallet.connected || mints.length === 0}
                      >
                        <SelectTrigger className="w-full bg-gray-800/70 border-gray-700 text-white">
                          <SelectValue placeholder="Select a mint" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {mints.map((mint) => (
                            <SelectItem 
                              key={mint.address} 
                              value={mint.address}
                            >
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center mr-2">
                                  {mint.image ? (
                                    <img 
                                      src={mint.image} 
                                      alt={mint.name} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-rose-500/30 to-red-500/30 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">{mint.symbol.charAt(0)}</span>
                                    </div>
                                  )}
                                </div>
                                <span>{mint.name} ({mint.symbol})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Verify Button */}
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={verifyMint}
                        disabled={!selectedMint || verifyLoading}
                      >
                        {verifyLoading ? (
                          <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                        ) : (
                          "Verify Mint Status"
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {/* Verification Results */}
                {verifyResult && (
                  <div className={`p-4 rounded-md ${
                    verifyResult.canClose 
                      ? "bg-green-900/20 border border-green-700" 
                      : "bg-red-900/20 border border-red-700"
                  }`}>
                    <div className="flex items-start mb-2">
                      {verifyResult.canClose ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 shrink-0" />
                      )}
                      <p className={`font-medium ${
                        verifyResult.canClose ? "text-green-400" : "text-red-400"
                      }`}>
                        {verifyResult.message}
                      </p>
                    </div>
                    <div className="space-y-1 pl-7">
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-400">Token Supply:</span> {verifyResult.supply}
                      </p>
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-400">Close Authority:</span> {verifyResult.hasCloseAuthority ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleCloseMint}
                  disabled={
                    loading ||
                    !wallet.connected ||
                    !selectedMint ||
                    !verifyResult ||
                    !verifyResult.canClose
                  }
                >
                  {loading ? 
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 
                    "Close Mint"
                  }
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </CommonLayout>
  );
} 