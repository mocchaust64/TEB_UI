import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { 
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedInstruction
} from "@solana/spl-token";

// Import Token from correct path
import { Token } from "solana-token-extension-boost";
import { saveTokensToCache } from "@/lib/utils/token-cache";
import { getUserTokens } from "./tokenList";

// Interface for token transfer options
export interface TokenTransferOptions {
  onStart?: () => void;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  onFinish?: () => void;
  memo?: string;
}

// Interface for token transfer parameters
export interface TokenTransferParams {
  mintAddress: string;  // Token mint address
  recipientAddress: string;  // Recipient wallet address
  amount: string;  // Amount as string (will be converted based on decimals)
  decimals: number;  // Token decimals
}

/**
 * Transfer tokens from user wallet to another wallet
 * @param connection Solana connection
 * @param wallet Sender's wallet context
 * @param params Token transfer parameters
 * @param options Options for callbacks
 * @returns Transaction signature
 */
export const transferToken = async (
  connection: Connection,
  wallet: WalletContextState,
  params: TokenTransferParams,
  options: TokenTransferOptions = {}
): Promise<string | null> => {
  const { mintAddress, recipientAddress, amount, decimals } = params;
  const { onStart, onSuccess, onError, onFinish, memo } = options;
  const { publicKey, sendTransaction } = wallet;
  
  if (!publicKey || !connection || !sendTransaction) {
    toast.error("Wallet not connected");
    return null;
  }
  
  try {
    if (onStart) onStart();
    
    // Convert amount to lamports (based on decimals)
    const amountToSend = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
    
    if (amountToSend <= BigInt(0)) {
      throw new Error("Invalid token amount");
    }
    
    // Parse addresses
    console.log("Mint address:", mintAddress);
    console.log("Recipient address:", recipientAddress);
    
    let mintPublicKey, recipientPublicKey;
    try {
      mintPublicKey = new PublicKey(mintAddress);
    } catch (err) {
      console.error("Error converting mint address:", err);
      throw new Error("Invalid token mint address");
    }
    
    try {
      recipientPublicKey = new PublicKey(recipientAddress);
    } catch (err) {
      console.error("Error converting recipient address:", err);
      throw new Error("Invalid recipient wallet address");
    }
    
    // Determine token program
    const tokenProgram = await determineTokenProgram(connection, mintPublicKey);
    
    // Initialize token instance from our SDK
    const token = new Token(connection, mintPublicKey);
    
    // Debug: Check Token class methods
    console.log("Token class methods:", Object.getOwnPropertyNames(Token.prototype));
    console.log("Token instance:", token);
    
    // Create or get source token account (sender)
    console.log("Getting source token account...");
    let sourceTokenAccount;
    
    try {
      // Get Associated Token Account address for sender - using Token class method
      const sourceAssociatedAddress = await token.getAssociatedAddress(
        publicKey,
        false
      );
      
      // Check if account already exists
      const sourceAccountInfo = await connection.getAccountInfo(sourceAssociatedAddress);
      
      if (!sourceAccountInfo) {
        throw new Error("Your token account does not exist. Please create a token account first.");
      }
      
      console.log("Source token account exists:", sourceAssociatedAddress.toString());
      sourceTokenAccount = sourceAssociatedAddress;
    } catch (err) {
      console.error("Error checking source token account:", err);
      throw new Error("Source token account not found. You need to have tokens in your wallet before transferring.");
    }
    
    // Create or get destination token account (recipient)
    console.log("Getting or creating destination token account...");
    let destinationTokenAccount;
    
    // Get Associated Token Account address for recipient - using Token class method
    const destinationAssociatedAddress = await token.getAssociatedAddress(
      recipientPublicKey,
      false
    );
    
    // Check if destination account already exists
    const destinationAccountInfo = await connection.getAccountInfo(destinationAssociatedAddress);
    
    // Transaction to hold instructions
    const transaction = new Transaction();
    
    // If destination account doesn't exist, add instruction to create it - using Token class method
    if (!destinationAccountInfo) {
      console.log("Creating new destination token account...");
      transaction.add(
        token.createAssociatedTokenAccountInstruction(
          publicKey,             // Payer
          destinationAssociatedAddress,  // Associated token account 
          recipientPublicKey     // Owner
        )
      );
    } else {
      console.log("Destination token account exists:", destinationAssociatedAddress.toString());
    }
    
    destinationTokenAccount = destinationAssociatedAddress;
    
    // Create token transfer instruction
    console.log("Creating token transfer instruction...");
    
    // Add token transfer instruction
    transaction.add(
      createTransferCheckedInstruction(
        sourceTokenAccount,          // Source
        mintPublicKey,               // Mint
        destinationTokenAccount,     // Destination
        publicKey,                   // Owner
        amountToSend,                // Amount
        decimals,                    // Decimals
        [],                          // Multisigners
        tokenProgram                 // Program ID
      )
    );
    
    // Add memo if provided
    if (memo) {
      const memoId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
      transaction.add({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
        programId: memoId,
        data: Buffer.from(memo, "utf-8")
      });
    }
    
    // Get blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;
    
    // Send transaction using wallet adapter
    console.log("Sending transaction...");
    const signature = await sendTransaction(transaction, connection, {
      skipPreflight: false,
      preflightCommitment: "confirmed"
    });
    
    // Wait for confirmation
    console.log("Waiting for confirmation...");
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, "confirmed");
    
    // Update token cache after successful transfer
    await updateTokenCache(connection, wallet);
    
    if (onSuccess) onSuccess(signature);
    
    return signature;
  } catch (error: any) {
    console.error("Error transferring token:", error);
    
    // Provide more user-friendly error messages
    let errorMessage = "An error occurred while transferring token";
    
    if (error.message?.includes("NonTransferable")) {
      errorMessage = "This token cannot be transferred (has NonTransferable extension)";
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient balance to complete transaction";
    } else if (error.message?.includes("invalid account owner")) {
      errorMessage = "Invalid account owner";
    } else if (error.message?.includes("failed to send transaction")) {
      errorMessage = "Failed to send transaction, please try again";
    } else if (error instanceof Error && error.name === "TokenAccountNotFoundError") {
      errorMessage = "Token account not found. Please make sure you have enough SOL to create token account";
    }
    
    toast.error(errorMessage);
    
    if (onError && error instanceof Error) onError(error);
    return null;
  } finally {
    if (onFinish) onFinish();
  }
};

/**
 * Determine token program for a token (Token Program or Token-2022 Program)
 * @param connection Solana connection
 * @param mintAddress Token mint address
 * @returns Token program ID
 */
export async function determineTokenProgram(
  connection: Connection,
  mintAddress: PublicKey
): Promise<PublicKey> {
  try {
    // Check account info
    const accountInfo = await connection.getAccountInfo(mintAddress);
    
    if (!accountInfo) {
      throw new Error("Token mint does not exist");
    }
    
    // Check if account owner is Token Program or Token-2022 Program
    if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      return TOKEN_2022_PROGRAM_ID;
    }
    
    return TOKEN_PROGRAM_ID;
  } catch (error) {
    console.error("Error determining token program:", error);
    // Default to Token Program
    return TOKEN_PROGRAM_ID;
  }
}

/**
 * Update token cache after successful token transfer
 * @param connection Solana connection
 * @param wallet Wallet context
 */
async function updateTokenCache(
  connection: Connection,
  wallet: WalletContextState
) {
  try {
    const { publicKey } = wallet;
    if (!publicKey) return;
    
    // Fetch tokens from blockchain
    const userTokens = await getUserTokens(connection, wallet);
    
    // Calculate total value
    const total = userTokens.reduce((acc, token) => {
      if (token.price) {
        const price = parseFloat(token.price.replace('$', '')) || 0;
        const balance = parseFloat(token.balance) || 0;
        return acc + (price * balance);
      }
      return acc;
    }, 0);
    
    const formattedTotal = total.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 2
    });
    
    // Update cache
    saveTokensToCache(userTokens, formattedTotal, publicKey.toString());
  } catch (error) {
    console.error("Error updating token cache:", error);
  }
} 