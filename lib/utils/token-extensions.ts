import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { TokenItem as BaseTokenItem } from "../services/tokenList";

// Extend TokenItem interface to include details property
export interface TokenItemWithDetails extends BaseTokenItem {
  details?: string;
  mintAuthority?: boolean; // Whether user has mint authority
}

/**
 * Information about token extensions
 */
export interface TokenExtensionInfo {
  isToken2022: boolean;
  
  // Transfer Fee Extension
  hasTransferFee: boolean;
  feePercentage?: number;
  feeDecimals?: number;
  feeBasisPoints?: number;
  maxFee?: string;
  
  // Non-Transferable Extension
  hasNonTransferable: boolean;
  
  // Permanent Delegate Extension
  hasPermanentDelegate: boolean;
  delegateAddress?: string;
  
  // Default Account Extension
  hasDefaultAccount: boolean;
  defaultAccountAddress?: string;
  
  // Metadata Extension
  hasMetadata: boolean;
  name?: string;
  symbol?: string;
  uri?: string;
}

// Define warning types
export type WarningType = 'warning' | 'error' | 'info';
export interface ExtensionWarning {
  type: WarningType;
  title: string;
  message: string;
}

/**
 * Check token extensions from details string
 * @param details Token details information
 * @returns Information about token extensions
 */
export function parseTokenExtensionsFromDetails(details?: string): Partial<TokenExtensionInfo> {
  if (!details) return {};
  
  let extensions: Partial<TokenExtensionInfo> = {
    isToken2022: true, // If details exists, assume this is a token 2022
  };
  
  // Check TransferFee
  if (details.includes("Fee:") && details.includes("%")) {
    extensions.hasTransferFee = true;
    
    // Parse string to get fee percentage
    const feeMatch = details.match(/Fee:\s*(\d+(\.\d+)?)%/);
    if (feeMatch && feeMatch[1]) {
      extensions.feePercentage = parseFloat(feeMatch[1]);
      extensions.feeBasisPoints = extensions.feePercentage * 100; // Convert % to basis points
    }
    
    // Parse max fee if available
    const maxFeeMatch = details.match(/Max Fee:\s*(\d+(\.\d+)?)/);
    if (maxFeeMatch && maxFeeMatch[1]) {
      extensions.maxFee = maxFeeMatch[1];
    }
  }
  
  // Check NonTransferable
  if (details.includes("Non-Transferable")) {
    extensions.hasNonTransferable = true;
  }
  
  // Check PermanentDelegate
  if (details.includes("Permanent Delegate")) {
    extensions.hasPermanentDelegate = true;
    
    // Try to get delegate address if available
    const delegateMatch = details.match(/Delegate:\s*([1-9A-HJ-NP-Za-km-z]{32,44})/);
    if (delegateMatch && delegateMatch[1]) {
      extensions.delegateAddress = delegateMatch[1];
    }
  }
  
  return extensions;
}

/**
 * Calculate token transfer fee based on amount and fee percentage
 * @param amount Token transfer amount
 * @param feePercentage Fee percentage (e.g. 1.5 for 1.5%)
 * @param decimals Token decimal places
 * @returns Transfer fee information
 */
export function calculateTransferFee(amount: string, feePercentage: number = 0, decimals: number = 0) {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0 || feePercentage <= 0) {
    return {
      feeAmount: "0",
      receivedAmount: amount,
      feePercentage: feePercentage
    };
  }
  
  const feeAmount = numAmount * (feePercentage / 100);
  const receivedAmount = numAmount - feeAmount;
  
  return {
    feeAmount: feeAmount.toFixed(decimals),
    receivedAmount: receivedAmount.toFixed(decimals),
    feePercentage: feePercentage
  };
}

/**
 * Check if token is a Token-2022
 * @param connection Solana connection
 * @param mintAddress Token mint address
 * @returns true if it's Token-2022, false otherwise
 */
export async function isToken2022(connection: Connection, mintAddress: string | PublicKey): Promise<boolean> {
  try {
    const mintPublicKey = typeof mintAddress === 'string' ? new PublicKey(mintAddress) : mintAddress;
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    
    if (!mintInfo) return false;
    
    return mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
  } catch (error) {
    console.error("Error checking if token is Token-2022:", error);
    return false;
  }
}

/**
 * Check token extensions
 * @param connection Solana connection
 * @param token Token information
 * @returns Information about token extensions
 */
export async function getTokenExtensions(
  connection: Connection,
  token: TokenItemWithDetails
): Promise<TokenExtensionInfo> {
  // Initialize default extension information
  const extensionInfo: TokenExtensionInfo = {
    isToken2022: false,
    hasTransferFee: false,
    hasNonTransferable: false,
    hasPermanentDelegate: false,
    hasDefaultAccount: false,
    hasMetadata: false
  };
  
  try {
    const mintPublicKey = new PublicKey(token.id);
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    
    if (!mintInfo) return extensionInfo;
    
    // Check program ID to determine if it's token-2022
    extensionInfo.isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
    
    if (!extensionInfo.isToken2022) {
      return extensionInfo; // If not Token-2022, no need to check further
    }
    
    // Parse extension information from details
    const detailsExtensions = parseTokenExtensionsFromDetails(token.details);
    
    // Update extension information
    return {
      ...extensionInfo,
      ...detailsExtensions
    };
  } catch (error) {
    console.error("Error checking token extensions:", error);
    return extensionInfo;
  }
}

/**
 * Create warning messages based on token extensions
 * @param extensionInfo Information about token extensions
 * @param amount Amount of tokens to transfer
 * @param symbol Token symbol
 * @param decimals Token decimal places
 * @returns Array of warning messages
 */
export function generateExtensionWarnings(
  extensionInfo: TokenExtensionInfo,
  amount: string,
  symbol: string,
  decimals: number
): ExtensionWarning[] {
  const warnings: ExtensionWarning[] = [];
  
  // Check Non-Transferable
  if (extensionInfo.hasNonTransferable) {
    warnings.push({
      type: 'error',
      title: 'Token Non-Transferable',
      message: 'This token cannot be transferred to others due to the Non-Transferable extension.'
    });
  }
  
  // Check Transfer Fee
  if (extensionInfo.hasTransferFee && extensionInfo.feePercentage) {
    const { feeAmount, receivedAmount } = calculateTransferFee(
      amount,
      extensionInfo.feePercentage,
      decimals
    );
    
    warnings.push({
      type: 'warning',
      title: `Token has transfer fee ${extensionInfo.feePercentage}%`,
      message: `When transferring ${amount} ${symbol}, the recipient will be charged ${feeAmount} ${symbol} fee and receive ${receivedAmount} ${symbol}.`
    });
  }
  
  // Check Permanent Delegate
  if (extensionInfo.hasPermanentDelegate) {
    warnings.push({
      type: 'info',
      title: 'Token has Permanent Delegate',
      message: 'This token has a permanent delegate address that can perform actions on your tokens.'
    });
  }
  
  return warnings;
}

/**
 * Create a brief description of token extensions
 * @param extensionInfo Information about token extensions
 * @returns Brief description of extensions
 */
export function getExtensionSummary(extensionInfo: TokenExtensionInfo): string {
  const extensions = [];
  
  if (extensionInfo.hasTransferFee) {
    extensions.push(`Transfer Fee: ${extensionInfo.feePercentage}%`);
  }
  
  if (extensionInfo.hasNonTransferable) {
    extensions.push('Non-Transferable');
  }
  
  if (extensionInfo.hasPermanentDelegate) {
    extensions.push('Permanent Delegate');
  }
  
  if (extensionInfo.hasDefaultAccount) {
    extensions.push('Default Account');
  }
  
  if (extensionInfo.hasMetadata) {
    extensions.push('Metadata');
  }
  
  if (extensions.length === 0) return 'No extensions';
  
  return extensions.join(', ');
} 