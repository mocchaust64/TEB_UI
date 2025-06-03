import { Connection, PublicKey, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { TokenMetadataToken } from "solana-token-extension-boost";
import { getTokenMetadata } from "@solana/spl-token";

// Priority level types for transaction fees
export type PriorityLevel = "low" | "medium" | "high";

export interface MetadataUpdateOptions {
  priorityLevel?: PriorityLevel;
  skipPreflight?: boolean;
  allocateStorage?: boolean;
}

export interface BatchUpdateOptions extends MetadataUpdateOptions {
  maxFieldsPerTransaction?: number;
}

export interface MetadataUpdateResult {
  signature?: string;
  error?: string;
}

export interface BatchMetadataUpdateResult {
  signatures?: string[];
  error?: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
  additionalMetadata: Array<[string, string]>;
  updateAuthority?: string;
}

/**
 * Fetches token metadata from the blockchain
 * @param connection Solana connection
 * @param mintAddress Token mint address
 * @returns Token metadata object or null if not found
 */
export async function getTokenMetadataInfo(
  connection: Connection,
  mintAddress: string
): Promise<TokenMetadata | null> {
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const metadata = await getTokenMetadata(connection, mintPublicKey);
    
    if (!metadata) {
      return null;
    }
    
    return {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      additionalMetadata: metadata.additionalMetadata ? 
        [...metadata.additionalMetadata] as Array<[string, string]> : [],
      updateAuthority: metadata.updateAuthority?.toString()
    };
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    return null;
  }
}

/**
 * Checks if a token has metadata extension
 * @param connection Solana connection
 * @param mintAddress Token mint address
 * @returns Boolean indicating if token has metadata
 */
export async function hasTokenMetadata(
  connection: Connection,
  mintAddress: string
): Promise<boolean> {
  try {
    const metadata = await getTokenMetadataInfo(connection, mintAddress);
    return metadata !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Updates a single metadata field for a token
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param mintAddress Token mint address
 * @param field Metadata field to update
 * @param value New value for the field
 * @param options Update options
 * @returns Result object with signature or error
 */
export async function updateTokenMetadataField(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: string,
  field: string,
  value: string,
  options: MetadataUpdateOptions = {
    priorityLevel: 'medium',
    skipPreflight: true,
    allocateStorage: true
  }
): Promise<MetadataUpdateResult> {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { error: "Wallet not connected or does not support signing" };
    }

    // Convert mint address string to PublicKey
    const mintPublicKey = new PublicKey(mintAddress);

    // Load token with metadata extension
    const tokenWithMetadata = await TokenMetadataToken.fromMint(
      connection, 
      mintPublicKey
    );

    if (!tokenWithMetadata) {
      return { error: "Token not found or does not have metadata extension" };
    }

    // Use optimized method to update metadata
    const result = await tokenWithMetadata.updateMetadataOptimized(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction
      },
      field,
      value,
      {
        priorityLevel: options.priorityLevel as any,
        skipPreflight: options.skipPreflight,
        allocateStorage: options.allocateStorage
      }
    );

    // Return successful result with signature
    return { signature: result.signature };
  } catch (error) {
    console.error("Error updating token metadata field:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Updates multiple metadata fields in batches
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param mintAddress Token mint address
 * @param fields Object with field-value pairs to update
 * @param options Batch update options
 * @returns Result object with signatures or error
 */
export async function updateTokenMetadataFields(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: string,
  fields: Record<string, string>,
  options: BatchUpdateOptions = {
    maxFieldsPerTransaction: 3,
    priorityLevel: 'medium',
    skipPreflight: true,
    allocateStorage: true
  }
): Promise<BatchMetadataUpdateResult> {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { error: "Wallet not connected or does not support signing" };
    }

    // Convert mint address string to PublicKey
    const mintPublicKey = new PublicKey(mintAddress);

    // Load token with metadata extension
    const tokenWithMetadata = await TokenMetadataToken.fromMint(
      connection, 
      mintPublicKey
    );

    if (!tokenWithMetadata) {
      return { error: "Token not found or does not have metadata extension" };
    }

    // Use optimized method for batch updates
    const result = await tokenWithMetadata.updateMetadataBatchOptimized(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction
      },
      fields,
      {
        maxFieldsPerTransaction: options.maxFieldsPerTransaction,
        priorityLevel: options.priorityLevel as any,
        skipPreflight: options.skipPreflight,
        allocateStorage: options.allocateStorage
      }
    );

    // Return successful result with signature list
    return { signatures: result.signatures };
  } catch (error) {
    console.error("Error updating token metadata batch:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Removes a metadata field from a token
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param mintAddress Token mint address
 * @param fieldName Field name to remove
 * @param options Update options
 * @returns Result object with signature or error
 */
export async function removeTokenMetadataField(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: string,
  fieldName: string,
  options: MetadataUpdateOptions = {
    priorityLevel: 'medium',
    skipPreflight: true
  }
): Promise<MetadataUpdateResult> {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { error: "Wallet not connected or does not support signing" };
    }

    // Convert mint address string to PublicKey
    const mintPublicKey = new PublicKey(mintAddress);

    // Load token with metadata extension
    const tokenWithMetadata = await TokenMetadataToken.fromMint(
      connection, 
      mintPublicKey
    );

    if (!tokenWithMetadata) {
      return { error: "Token not found or does not have metadata extension" };
    }

    // Create instruction to remove field
    const instruction = tokenWithMetadata.createRemoveMetadataFieldInstruction(
      wallet.publicKey,
      fieldName
    );
    
    // Create priority fee instruction
    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: getPriorityFeeAmount(options.priorityLevel || 'medium'),
    });
    
    // Create transaction
    const transaction = new Transaction().add(priorityFeeInstruction, instruction);
    
    // Set recent blockhash and fee payer
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction with wallet
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: options.skipPreflight }
    );

    // Wait for confirmation
    await connection.confirmTransaction(signature);

    // Return successful result with signature
    return { signature };
  } catch (error) {
    console.error("Error removing token metadata field:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Updates the metadata authority for a token
 * @param connection Solana connection
 * @param wallet User's wallet
 * @param mintAddress Token mint address
 * @param newAuthority New authority address or null to revoke
 * @param options Update options
 * @returns Result object with signature or error
 */
export async function updateTokenMetadataAuthority(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: string,
  newAuthority: string | null,
  options: MetadataUpdateOptions = {
    priorityLevel: 'medium',
    skipPreflight: true
  }
): Promise<MetadataUpdateResult> {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { error: "Wallet not connected or does not support signing" };
    }

    // Convert mint address string to PublicKey
    const mintPublicKey = new PublicKey(mintAddress);
    
    // Convert new authority if provided
    const newAuthorityPubkey = newAuthority ? new PublicKey(newAuthority) : null;

    // Load token with metadata extension
    const tokenWithMetadata = await TokenMetadataToken.fromMint(
      connection, 
      mintPublicKey
    );

    if (!tokenWithMetadata) {
      return { error: "Token not found or does not have metadata extension" };
    }

    // Create instruction to update authority
    const instruction = tokenWithMetadata.createUpdateMetadataAuthorityInstruction(
      wallet.publicKey,
      newAuthorityPubkey
    );
    
    // Create priority fee instruction
    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: getPriorityFeeAmount(options.priorityLevel || 'medium'),
    });
    
    // Create transaction
    const transaction = new Transaction().add(priorityFeeInstruction, instruction);
    
    // Set recent blockhash and fee payer
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction with wallet
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: options.skipPreflight }
    );

    // Wait for confirmation
    await connection.confirmTransaction(signature);

    // Return successful result with signature
    return { signature };
  } catch (error) {
    console.error("Error updating token metadata authority:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Helper function to get priority fee amount based on priority level
 */
function getPriorityFeeAmount(priorityLevel: PriorityLevel): number {
  switch (priorityLevel) {
    case 'low':
      return 5_000;
    case 'medium':
      return 10_000;
    case 'high':
      return 50_000;
    default:
      return 10_000; // Default to medium
  }
} 