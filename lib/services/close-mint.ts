import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
  getTokenMetadata
} from "@solana/spl-token";
import { MintCloseAuthorityExtension } from "solana-token-extension-boost";

// Interface for close mint options
export interface CloseMintOptions {
  connection: Connection;
  wallet: WalletContextState;
  mintAddress: string;
}

export interface MintInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  programId: string;
  image?: string | null;
}

/**
 * Get all mint accounts with zero supply that the user might be able to close
 * @param connection Solana connection
 * @param wallet User wallet
 * @returns Array of mint addresses with zero supply
 */
export async function getCloseableMints(connection: Connection, wallet: WalletContextState): Promise<MintInfo[]> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    console.log("Finding closeable mints...");
    const result: MintInfo[] = [];
    const processedMints = new Set<string>();
    
    // Lấy tất cả token accounts của người dùng
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      wallet.publicKey,
      {
        programId: TOKEN_PROGRAM_ID
      }
    );
    
    // Cũng lấy token 2022 accounts
    const token2022Accounts = await connection.getTokenAccountsByOwner(
      wallet.publicKey,
      {
        programId: TOKEN_2022_PROGRAM_ID
      }
    );
    
    // Kết hợp cả hai kết quả
    const allTokenAccounts = [...tokenAccounts.value, ...token2022Accounts.value];
    
    // Kiểm tra từng token account
    for (const tokenAccount of allTokenAccounts) {
      try {
        const accountInfo = tokenAccount.account.data;
        if (!accountInfo) continue;
        
        // Parse data để lấy mint address từ token account
        const accountData = TOKEN_PROGRAM_ID.equals(tokenAccount.account.owner) 
          ? tokenAccount.account.data
          : tokenAccount.account.data;

        // Lấy mint address từ token account (ở offset 0)
        const mintAddress = new PublicKey(accountData.slice(0, 32));
        const mintAddressString = mintAddress.toString();
        
        // Kiểm tra xem đã xử lý mint này chưa
        if (processedMints.has(mintAddressString)) {
          continue;
        }
        
        processedMints.add(mintAddressString);
        
        // Lấy thông tin mint
        const mintInfo = await getMint(
          connection,
          mintAddress,
          'confirmed',
          tokenAccount.account.owner.equals(TOKEN_PROGRAM_ID) ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID
        );

        // Chỉ xem xét các mint có mintAuthority là wallet hiện tại và supply = 0
        if (
          mintInfo.mintAuthority && 
          mintInfo.mintAuthority.equals(wallet.publicKey) && 
          mintInfo.supply === BigInt(0)
        ) {
          // Tạo thông tin mint cơ bản
          const programId = tokenAccount.account.owner.toString();
          let name = `Mint ${mintAddressString.substring(0, 4)}...${mintAddressString.substring(mintAddressString.length - 4)}`;
          let symbol = "MINT";
          let image = null;
          
          // Cố gắng lấy metadata của token (nếu có)
          try {
            const tokenMetadata = await getTokenMetadata(
              connection,
              mintAddress
            );
            
            if (tokenMetadata) {
              name = tokenMetadata.name || name;
              symbol = tokenMetadata.symbol || symbol;
              
              // Nếu có URI, tải metadata từ URI
              if (tokenMetadata.uri) {
                try {
                  const response = await fetch(tokenMetadata.uri);
                  if (response.ok) {
                    const metadataJson = await response.json();
                    
                    // Cập nhật thông tin từ metadata
                    name = metadataJson.name || name;
                    symbol = metadataJson.symbol || symbol;
                    image = metadataJson.image || null;
                  }
                } catch (error) {
                  console.log("Error fetching token metadata URI:", error);
                }
              }
            }
          } catch (error) {
            console.log("No metadata found for token:", mintAddressString);
          }
          
          result.push({
            address: mintAddressString,
            name: name,
            symbol: symbol,
            decimals: mintInfo.decimals,
            programId: programId,
            image: image
          });
        }
      } catch (error) {
        console.error("Error processing token account:", error);
      }
    }

    console.log(`Found ${result.length} closeable mints`);
    return result;
  } catch (error) {
    console.error("Error getting closeable mints:", error);
    throw error;
  }
}

/**
 * Close a mint account
 * @param options Close mint options
 * @returns 
 */
export async function closeMint(options: CloseMintOptions) {
  const { connection, wallet, mintAddress } = options;
  
  if (!wallet.publicKey) {
    toast.error("Wallet not connected");
    return null;
  }
  
  try {
    console.log("Starting close mint process...");
    
    // Convert address to PublicKey
    const mintPubkey = new PublicKey(mintAddress);
    const authority = wallet.publicKey;
    
    console.log("Mint address:", mintPubkey.toString());
    console.log("Close authority:", authority.toString());
    
    // Get mint info to verify it can be closed
    const mintInfo = await getMint(
      connection,
      mintPubkey,
      'confirmed',
      TOKEN_2022_PROGRAM_ID
    );
    
    // Check if the mint can be closed
    if (mintInfo.supply > BigInt(0)) {
      toast.error("Cannot close mint: Token supply is not zero");
      return null;
    }
    
    // Create a transaction
    const transaction = new Transaction();
    
    // Create close account instruction using MintCloseAuthorityExtension
    const closeInstruction = MintCloseAuthorityExtension.createCloseAccountInstruction(
      mintPubkey,           // Account to close (mint)
      authority,            // Destination for lamports
      authority,            // Authority that can close the account
      []                    // Multisig signers
    );
    
    // Add instruction to transaction
    transaction.add(closeInstruction);
    
    // Send transaction
    console.log("Sending transaction...");
    const signature = await wallet.sendTransaction(transaction, connection);
    
    console.log("Transaction successful:", signature);
    toast.success("Mint account closed successfully");
    
    return {
      signature,
      mintAddress: mintPubkey.toString()
    };
  } catch (error) {
    console.error("Error in close mint:", error);
    toast.error("Close mint failed: " + (error as Error).message);
    return null;
  }
} 