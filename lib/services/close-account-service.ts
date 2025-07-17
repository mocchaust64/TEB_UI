import { CloseAccountExtension } from 'solana-token-extension-boost';
import { Connection, PublicKey } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

// Admin fee percentage and recipient
const ADMIN_FEE_PERCENT = 5; // 5%
const ADMIN_PUBLIC_KEY = new PublicKey("B2mVnCtuURVnSZmHqWKQMTZqM79GxnZbyxdDNVYNT5y");

/**
 * Close token accounts with zero balance
 * @param connection - Solana connection
 * @param wallet - Wallet context
 * @param tokenAccountAddresses - Array of token account addresses to close
 * @returns Transaction signature
 */
export async function closeAccounts(
  connection: Connection,
  wallet: WalletContextState,
  tokenAccountAddresses: string[]
): Promise<string> {
  const { publicKey, signTransaction } = wallet;
  
  if (!publicKey || !signTransaction) {
    throw new Error("Wallet not connected");
  }

  // Use any existing token to initialize the extension
  // It doesn't matter which token we use since we're just closing accounts
  const mockMint = new PublicKey("So11111111111111111111111111111111111111112"); 
  const closeAccountExtension = new CloseAccountExtension(connection, mockMint);

  // Convert string addresses to PublicKey objects
  const accountsToClose = tokenAccountAddresses.map(addr => new PublicKey(addr));
  
  // Prepare the transaction with admin fee
  const result = await closeAccountExtension.prepareCloseAccountsTransaction(
    accountsToClose, 
    publicKey,
    {
      adminFeeReceiver: ADMIN_PUBLIC_KEY,
      adminFeeBasisPoints: ADMIN_FEE_PERCENT * 100 // Convert percentage to basis points
    }
  );

  if (result.closeableAccounts.length === 0) {
    throw new Error("No accounts can be closed");
  }

  // Sign and send the transaction
  result.transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  result.transaction.feePayer = publicKey;
  
  const signedTransaction = await signTransaction(result.transaction);
  
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize(),
    {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    }
  );
  
  await connection.confirmTransaction(signature, "confirmed");
  
  return signature;
}

/**
 * Estimate the SOL rent that will be reclaimed from closing accounts
 * @param connection - Solana connection
 * @param wallet - Wallet context
 * @param tokenAccountAddresses - Array of token account addresses to close
 * @returns Estimated rent information
 */
export async function estimateReclaimableRent(
  connection: Connection,
  wallet: WalletContextState,
  tokenAccountAddresses: string[]
): Promise<{
  totalRent: number;
  userRent: number;
  adminRent: number;
  closeableAccounts: string[];
}> {
  const { publicKey } = wallet;
  
  if (!publicKey) {
    throw new Error("Wallet not connected");
  }

  // Use any existing token to initialize the extension
  const mockMint = new PublicKey("So11111111111111111111111111111111111111112");
  const closeAccountExtension = new CloseAccountExtension(connection, mockMint);

  // Convert string addresses to PublicKey objects
  const accounts = tokenAccountAddresses.map(addr => new PublicKey(addr));
  
  // Get rent estimate
  const rentEstimate = await closeAccountExtension.estimateReclaimableRent(
    accounts,
    ADMIN_FEE_PERCENT * 100 // Convert percentage to basis points
  );

  // Get addresses of closeable accounts
  const closeableAccounts = rentEstimate.accountsInfo
    .filter(info => info.closeable)
    .map(info => info.address.toBase58());

  return {
    totalRent: rentEstimate.totalRent,
    userRent: rentEstimate.userRent,
    adminRent: rentEstimate.adminRent,
    closeableAccounts
  };
}

/**
 * Find token accounts with zero balance for a wallet
 * @param connection - Solana connection
 * @param walletPublicKey - Public key of the wallet
 * @returns Array of token accounts with zero balance
 */
export async function findZeroBalanceAccounts(
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<Array<{ address: string; mint: string }>> {
  // Use any existing token to initialize the extension
  const mockMint = new PublicKey("So11111111111111111111111111111111111111112");
  const closeAccountExtension = new CloseAccountExtension(connection, mockMint);
  
  // Find zero balance accounts
  const accounts = await closeAccountExtension.findZeroBalanceAccounts(walletPublicKey);
  
  // Convert to string addresses
  return accounts.map(account => ({
    address: account.address.toBase58(),
    mint: account.mint.toBase58()
  }));
} 