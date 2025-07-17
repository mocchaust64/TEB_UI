"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Loader2, Wallet, ArrowRight, ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  
} from "@solana/spl-token";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { trackAccountClosure, sendGAEvent } from "@/lib/utils/analytics";

// Define a simple token interface based on the project's structures
interface TokenItem {
  id: string;
  address: string;
  name: string;
  symbol?: string;
  balance: string;
  decimals: number;
  logoURI?: string;
  type?: string;
  frozen?: boolean;
  mint: string;
}

// Transaction result interface
interface TransactionResult {
  signature: string;
  closedAccounts: string[];
  totalReclaimed: number;
  success: boolean;
  errorMessage?: string;
}

// Native SOL mint address (used to exclude)
const NATIVE_SOL = "So11111111111111111111111111111111111111112";

const formSchema = z.object({
  selectedAccounts: z
    .array(z.string())
    .min(1, "Please select at least one account to close"),
});

// Custom hook to replace the missing useUserTokens
function useUserTokens() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    if (wallet.publicKey && connection) {
      try {
        // Lấy tất cả tài khoản token của người dùng, bao gồm cả số dư bằng 0
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          wallet.publicKey,
          { programId: TOKEN_2022_PROGRAM_ID }
        );

        const splTokenAccounts = await connection.getParsedTokenAccountsByOwner(
          wallet.publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );

        // Combine both token types
        const allAccounts = [...tokenAccounts.value, ...splTokenAccounts.value];
        
        const formattedTokens: TokenItem[] = [];
        
        // Process all accounts
        for (const { pubkey, account } of allAccounts) {
          try {
            const accountData = account.data.parsed.info;
            const mintAddress = accountData.mint;
            const amount = accountData.tokenAmount.uiAmount;
            const decimals = accountData.tokenAmount.decimals;
            
            // Include accounts with zero balance
            formattedTokens.push({
              id: mintAddress,
              address: pubkey.toBase58(),
              name: "Token",
              symbol: "TKN",
              balance: amount.toString(),
              decimals: decimals,
              type: mintAddress.toLowerCase() === NATIVE_SOL.toLowerCase() ? "sol" : "token",
              frozen: accountData.state === "frozen",
              mint: mintAddress
            });
          } catch (err) {
            console.error("Error processing token account:", err);
          }
        }
        
        // Update state with all token accounts
        setTokens(formattedTokens);
        console.log(`Loaded ${formattedTokens.length} token accounts (including zero balance)`);
      } catch (error) {
        console.error("Error fetching token accounts:", error);
        toast.error("Failed to load token accounts");
        setTokens([]);
      }
    } else {
      setTokens([]);
    }
    setLoading(false);
  };

  // Fetch tokens on mount and when wallet changes
  useEffect(() => {
    if (wallet.publicKey && connection) {
      refetch();
    }
  }, [wallet.publicKey, connection]);

  return { tokens, loading, refetch };
}

export default function CloseAccountForm() {
  const [loading, setLoading] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedRent, setEstimatedRent] = useState({ userRent: 0, adminRent: 0 });
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { tokens, loading: tokensLoading, refetch } = useUserTokens();
  // Add state for transaction result
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { selectedAccounts: [] },
  });

  const selectedAccounts = form.watch("selectedAccounts");

  // Filter zero-balance accounts
  const zeroBalanceAccounts = useMemo(() => {
    const filtered = tokens.filter((token: TokenItem) => 
      parseFloat(token.balance) === 0 && 
      token.type !== "sol" && 
      !token.frozen
    );
    
    console.log(`Found ${filtered.length} zero balance accounts out of ${tokens.length} total`);
    return filtered;
  }, [tokens]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      form.setValue(
        "selectedAccounts",
        zeroBalanceAccounts.map((token: TokenItem) => token.address)
      );
    } else {
      form.setValue("selectedAccounts", []);
    }
  };

  const shortenAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  // Reset transaction result and form
  const handleReset = () => {
    setTransactionResult(null);
    form.reset();
    refetch();
  };

  // Track when user views transaction on explorer
  const handleViewOnExplorer = (signature: string) => {
    // Track the click on "View on Explorer"
    sendGAEvent('view_transaction_explorer', {
      event_category: 'user_engagement',
      event_label: 'View Transaction on Solscan',
      transaction_id: signature
    });
    
    // Open Solscan in a new tab
    window.open(`https://solscan.io/tx/${signature}`, "_blank");
  };

  // Estimate rent that will be reclaimed
  useEffect(() => {
    const fetchRent = async () => {
      if (selectedAccounts.length === 0 || !publicKey || !connection) {
        setEstimatedRent({ userRent: 0, adminRent: 0 });
        return;
      }
      
      try {
        setIsEstimating(true);
        let totalRent = 0;
        
        for (const accountAddress of selectedAccounts) {
          const accountInfo = await connection.getAccountInfo(new PublicKey(accountAddress));
          if (accountInfo) {
            totalRent += accountInfo.lamports;
          }
        }
        
        // Update to keep all rent for user
        setEstimatedRent({
          userRent: totalRent,
          adminRent: 0,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to estimate rent";
        toast.error(message);
        setEstimatedRent({ userRent: 0, adminRent: 0 });
      } finally {
        setIsEstimating(false);
      }
    };
    
    fetchRent();
  }, [selectedAccounts, publicKey, connection]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setTransactionResult(null);

      if (!publicKey || !signTransaction || !connection) {
        throw new Error("Please connect your wallet first");
      }

      const transaction = new Transaction();
      let totalRent = 0;
      const closedAccounts: string[] = [];

      // Add close instructions for each account
      for (const accountAddress of values.selectedAccounts) {
        try {
          // Find the token account in our list
          const tokenAccount = zeroBalanceAccounts.find(t => t.address === accountAddress);
          if (!tokenAccount) {
            console.warn(`Token account ${accountAddress} not found in zero balance accounts, skipping`);
            continue;
          }

          // Get account info directly from blockchain
          const accountInfo = await connection.getAccountInfo(new PublicKey(accountAddress));
          if (!accountInfo) {
            console.warn(`Token account ${accountAddress} not found, skipping`);
            continue;
          }

          totalRent += accountInfo.lamports;
          
          // Determine which token program to use based on accountInfo.owner
          const programId = accountInfo.owner.equals(TOKEN_PROGRAM_ID) 
            ? TOKEN_PROGRAM_ID 
            : TOKEN_2022_PROGRAM_ID;
          
          // Verify the account can be closed
          const tokenAccountInfo = await getAccount(
            connection, 
            new PublicKey(accountAddress), 
            'confirmed',
            programId
          );
          
          if (tokenAccountInfo.isFrozen) {
            throw new Error(`Token account ${accountAddress} is frozen and cannot be closed`);
          }
          
          if (tokenAccountInfo.amount > BigInt(0)) {
            throw new Error(`Token account ${accountAddress} has a balance and cannot be closed`);
          }
          
          // Add close instruction using the appropriate token program
          transaction.add(
            createCloseAccountInstruction(
              new PublicKey(accountAddress),
              publicKey,
              publicKey,
              [],
              programId
            )
          );
          
          // Track successful accounts to display later
          closedAccounts.push(accountAddress);
          
          console.log(`Added close instruction for account ${accountAddress} using program ${programId.toString()}`);
        } catch (error) {
          console.warn(`Could not close account ${accountAddress}:`, error);
          continue;
        }
      }

      if (totalRent === 0) {
        throw new Error("No rent to reclaim from selected accounts");
      }

      // Send transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      );

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // Track successful account closure with Analytics
      trackAccountClosure(true, {
        accountsClosed: closedAccounts.length,
        solReclaimed: totalRent / 1_000_000_000,
        wallet: publicKey.toBase58(),
        transactionId: signature
      });

      toast.success("🎉 Accounts closed successfully!", {
        description: `Closed ${closedAccounts.length} accounts. You received ${(totalRent / 1_000_000_000).toFixed(9)} SOL.`,
        action: {
          label: "View Transaction",
          onClick: () => window.open(`https://solscan.io/tx/${signature}`, "_blank"),
        },
      });
      
      // Set transaction result for success screen
      setTransactionResult({
        signature,
        closedAccounts,
        totalReclaimed: totalRent,
        success: true
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to close accounts";
      
      // Track error with Analytics
      trackAccountClosure(false, {
        errorMessage: message,
        wallet: publicKey?.toBase58()
      });
      
      toast.error(message);
      
      // Set transaction result for error screen
      setTransactionResult({
        signature: "",
        closedAccounts: [],
        totalReclaimed: 0,
        success: false,
        errorMessage: message
      });
    } finally {
      setLoading(false);
    }
  };

  if (transactionResult) {
    return (
      <Card className="bg-card/50 border-border/50 shadow-md max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {transactionResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <CardTitle>
              {transactionResult.success ? "Accounts Closed Successfully" : "Failed to Close Accounts"}
            </CardTitle>
          </div>
          <CardDescription>
            {transactionResult.success
              ? `${transactionResult.closedAccounts.length} accounts were closed and ${(transactionResult.totalReclaimed / 1_000_000_000).toFixed(9)} SOL was reclaimed.`
              : "There was an error while trying to close accounts."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {transactionResult.success ? (
            <>
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success-foreground">
                  ✅ You've successfully closed {transactionResult.closedAccounts.length} accounts and reclaimed {(transactionResult.totalReclaimed / 1_000_000_000).toFixed(9)} SOL.
                </p>
              </div>
              
              {transactionResult.signature && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm text-muted-foreground mb-1">Transaction Signature</p>
                  <p className="text-xs break-all font-mono">{transactionResult.signature}</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" /> Close More Accounts
                </Button>
                
                {transactionResult.signature && (
                  <Link 
                    href={`https://solscan.io/tx/${transactionResult.signature}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => handleViewOnExplorer(transactionResult.signature)}
                  >
                    <Button variant="secondary" className="flex items-center gap-1 w-full sm:w-auto">
                      <ExternalLink className="h-4 w-4" /> View on Explorer
                    </Button>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {transactionResult.errorMessage || "An unexpected error occurred."}
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={handleReset}
                className="w-full"
                variant="default"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50 shadow-md max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle>Close Zero-Balance Accounts</CardTitle>
        </div>
        <CardDescription>
          Reclaim SOL from your zero-balance token accounts.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-sm text-success-foreground">
            ⚡ Solana blockchain keeps your SOL! Close unused accounts and get your SOL back!
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {tokensLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading accounts...</p>
                </div>
              ) : zeroBalanceAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {tokens.length > 0 ? 
                    "No zero-balance accounts found that can be closed." : 
                    "No token accounts found. Try connecting a different wallet."
                  }
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50 cursor-pointer px-4">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.length === zeroBalanceAccounts.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-input"
                    />
                    <span className="font-medium">
                      Select All ({zeroBalanceAccounts.length} accounts)
                    </span>
                  </label>
                  
                  <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                    {zeroBalanceAccounts.map((token: TokenItem) => (
                      <label
                        key={token.address}
                        className="flex items-center gap-4 p-2 border rounded-lg hover:bg-muted/30 cursor-pointer px-4"
                      >
                        <input
                          type="checkbox"
                          value={token.address}
                          checked={selectedAccounts.includes(token.address)}
                          onChange={(e) => {
                            const current = form.getValues("selectedAccounts");
                            if (e.target.checked) {
                              form.setValue("selectedAccounts", [
                                ...current,
                                token.address,
                              ]);
                            } else {
                              form.setValue(
                                "selectedAccounts",
                                current.filter((addr) => addr !== token.address)
                              );
                            }
                          }}
                          className="rounded border-input"
                        />
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                            {token.logoURI ? (
                              <Image
                                src={token.logoURI}
                                alt={token.name || "Token"}
                                width={28}
                                height={28}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {token.symbol?.substring(0, 2) || "TK"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {token.symbol || "Token"} {token.name ? `(${token.name})` : ""}
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-col">
                              <span>Account: {shortenAddress(token.address)}</span>
                              <span>Mint: {shortenAddress(token.mint)}</span>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="text-sm">
                  💰{" "}
                  <strong>
                    Estimated Reclaimed Rent ({selectedAccounts.length} accounts):
                  </strong>{" "}
                  {selectedAccounts.length === 0 ? (
                    "Select accounts to estimate"
                  ) : isEstimating ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Estimating rent...</span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      You will receive:{" "}
                      <strong className="text-success">
                        +{(estimatedRent.userRent / 1_000_000_000).toFixed(9)} SOL
                      </strong>{" "}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full font-semibold"
              variant="default"
              disabled={loading || !publicKey || selectedAccounts.length === 0}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Closing Accounts...</span>
                </div>
              ) : (
                "Close Accounts"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 