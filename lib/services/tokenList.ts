import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getAccount, getMint, getTokenMetadata, TYPE_SIZE, ExtensionType, getExtensionData } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Interface for token data
export interface TokenItem {
  id: string;          // Mint address (public key)
  name: string;
  symbol: string;
  balance: string;
  image: string | null;
  decimals: number;
  price?: string;      // May be undefined if no price is available
  value?: string;      // Value = balance * price
  change?: string;     // Price change percentage
  positive?: boolean;  // Whether change is positive or negative
  metadata?: any;      // Additional metadata
}

// Interface for token details
export interface TokenDetails extends TokenItem {
  supply: string;
  description?: string;
  created?: string;
  transactions?: TokenTransaction[];
  extensions?: TokenExtension[];
  links?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  }
}

export interface TokenTransaction {
  id: string;
  type: 'receive' | 'send' | 'other';
  amount: string;
  from: string;
  to: string;
  date: string;
  value?: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface TokenExtension {
  name: string;
  status: 'active' | 'inactive';
  details?: string;
}

/**
 * Get list of user tokens from Solana blockchain
 * @param connection Solana connection
 * @param wallet Wallet context
 */
export async function getUserTokens(connection: Connection, wallet: WalletContextState): Promise<TokenItem[]> {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    // Get all token accounts for the user
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
    });

    // Return result
    const tokens: TokenItem[] = [];

    // Process each token account
    for (const tokenAccount of tokenAccounts.value) {
      const accountInfo = tokenAccount.account.data.parsed.info;
      const mintAddress = accountInfo.mint;
      const balance = accountInfo.tokenAmount.uiAmount;
      
      // Only get tokens with balance > 0
      if (balance <= 0) continue;

      try {
        // Get mint info
        const mintInfo = await getMint(
          connection,
          new PublicKey(mintAddress),
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        // Get metadata (if available)
        let name = 'Unknown Token';
        let symbol = 'UNKNOWN';
        let image = null;
        let metadata = null;

        try {
          // Get metadata from token extensions (if available)
          const tokenMetadata = await getTokenMetadata(
            connection,
            new PublicKey(mintAddress)
          );

          if (tokenMetadata) {
            name = tokenMetadata.name || name;
            symbol = tokenMetadata.symbol || symbol;
            
            // If URI exists, load metadata from URI
            if (tokenMetadata.uri) {
              try {
                const response = await fetch(tokenMetadata.uri);
                if (response.ok) {
                  const metadataJson = await response.json();
                  metadata = metadataJson;
                  
                  // Update information from metadata
                  name = metadataJson.name || name;
                  symbol = metadataJson.symbol || symbol;
                  image = metadataJson.image || null;
                }
              } catch (error) {
                
              }
            }
          }
        } catch (error) {
          console.error('Error getting token metadata:', error);
        }

        // Add token to list
        tokens.push({
          id: mintAddress,
          name,
          symbol,
          balance: balance.toString(),
          image,
          decimals: mintInfo.decimals,
          metadata
        });
      } catch (error) {
        console.error(`Error processing token ${mintAddress}:`, error);
      }
    }

    return tokens;
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    throw error;
  }
}

/**
 * Get details of a token
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param tokenId Mint address of the token
 */
export async function getTokenDetails(connection: Connection, wallet: WalletContextState, tokenId: string): Promise<TokenDetails> {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const mintAddress = new PublicKey(tokenId);
    
    // Get mint info
    const mintInfo = await getMint(
      connection,
      mintAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Get account info
    const userTokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      mint: mintAddress,
    });

    // Get balance
    let balance = '0';
    if (userTokenAccounts.value.length > 0) {
      balance = userTokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount.toString();
    }
    
    // Get metadata
    let name = 'Unknown Token';
    let symbol = 'UNKNOWN';
    let image: string | null = null;
    let description = '';
    let website = '';
    let twitter = '';
    let telegram = '';
    let discord = '';
    let extensions: TokenExtension[] = [];

    try {
      // Get metadata from token
      const tokenMetadata = await getTokenMetadata(
        connection,
        mintAddress
      );

      if (tokenMetadata) {
        name = tokenMetadata.name || name;
        symbol = tokenMetadata.symbol || symbol;
        
        // If URI exists, load metadata from URI
        if (tokenMetadata.uri) {
          try {
            const response = await fetch(tokenMetadata.uri);
            if (response.ok) {
              const metadataJson = await response.json();
              
              // Update information from metadata
              name = metadataJson.name || name;
              symbol = metadataJson.symbol || symbol;
              image = metadataJson.image || null;
              description = metadataJson.description || '';
              
              // Links
              website = metadataJson.external_url || '';
              
              // Social links (if available)
              if (metadataJson.properties && metadataJson.properties.links) {
                twitter = metadataJson.properties.links.twitter || '';
                telegram = metadataJson.properties.links.telegram || '';
                discord = metadataJson.properties.links.discord || '';
              }
            }
          } catch (error) {
            console.error('Error fetching metadata:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error getting token metadata:', error);
    }

    // Get total supply
    const supply = (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toString();

    // List of token extensions
    extensions = await getTokenExtensions(connection, mintAddress);

    // Create token detail
    const tokenDetail: TokenDetails = {
      id: tokenId,
      name,
      symbol,
      balance,
      image,
      decimals: mintInfo.decimals,
      supply,
      description,
      created: new Date().toLocaleDateString(), // Use current date since mintInfo doesn't have createTime
      extensions,
      links: {
        website,
        twitter,
        telegram,
        discord
      },
      // Recent transactions will be added later
      transactions: []
    };

    // Get transaction history
    tokenDetail.transactions = await getTokenTransactions(connection, wallet.publicKey, mintAddress);

    return tokenDetail;
  } catch (error) {
    console.error(`Error fetching token details for ${tokenId}:`, error);
    throw error;
  }
}

/**
 * Get list of extensions in a token
 */
async function getTokenExtensions(connection: Connection, mintAddress: PublicKey): Promise<TokenExtension[]> {
  try {
    const extensions: TokenExtension[] = [];
    
    // Get account info directly to check extensions
    const mintAccountInfo = await connection.getAccountInfo(mintAddress);
    
    if (!mintAccountInfo) {
      return extensions;
    }
    
    // Check if it's a token-2022 by checking the owner
    const isToken2022 = mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
    
    // Check metadata extension
    try {
      const metadata = await getTokenMetadata(connection, mintAddress);
      if (metadata) {
        extensions.push({
          name: 'Metadata',
          status: 'active',
          details: `Name: ${metadata.name}, Symbol: ${metadata.symbol}`
        });
      }
    } catch (e) {
      // No metadata extension
    }

    // If not token-2022, can only have metadata extension
    if (!isToken2022) {
      return extensions;
    }
    
    // Get mint info for other extensions
    try {
      // Parse extensions from mint account data
      const mintData = mintAccountInfo.data;
      
      // Manually identify extensions from TLV data
      const mintDataExtensions: number[] = [];
      
      // TLV data starts at offset 82 in mint account data
      if (mintData.length > 82) {
        let offset = 82;
        
        while (offset < mintData.length) {
          // Extension Type is 1 byte
          const extensionType = mintData[offset];
          
          // If type is invalid, exit loop
          if (extensionType === 0) break;
          
          // Add extension type to list
          mintDataExtensions.push(extensionType);
          
          // Extension Length is 4 bytes, read as little-endian
          const lengthBytes = mintData.slice(offset + 1, offset + 5);
          const lengthView = new DataView(lengthBytes.buffer, lengthBytes.byteOffset, lengthBytes.byteLength);
          const extensionLength = lengthView.getUint32(0, true);
          
          // Move offset: 1 byte for type, 4 bytes for length, and extensionLength bytes for value
          offset += 1 + 4 + extensionLength;
          
          // If exceeded data length, exit loop
          if (offset >= mintData.length) break;
        }
      }
      
      console.log('Detected extensions:', mintDataExtensions);
      
      // Get mint info for additional details
      const mintInfo = await getMint(connection, mintAddress, undefined, TOKEN_2022_PROGRAM_ID);
      
      // Map extension types to names and detail functions
      interface ExtensionDetailInfo {
        name: string;
        getDetails: (mintInfo: any) => string;
      }
      
      const extensionDetailsMap: { [key: number]: ExtensionDetailInfo } = {
        1: { // TransferFeeConfig
          name: 'Transfer Fee',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.transferFeeConfig) {
              const feeBasisPoints = mintInfoAny.transferFeeConfig.transferFeeBasisPoints || 0;
              const feePercentage = feeBasisPoints / 100;
              const maxFee = mintInfoAny.transferFeeConfig.maximumFee 
                ? mintInfoAny.transferFeeConfig.maximumFee.toString() 
                : '0';
              return `Fee: ${feePercentage}%, Max Fee: ${Number(maxFee) / Math.pow(10, mintInfo.decimals)}`;
            }
            return 'Transfer fee is enabled';
          }
        },
        2: { // NonTransferable
          name: 'Non-Transferable',
          getDetails: () => 'Token cannot be transferred between wallets'
        },
        3: { // InterestBearingConfig
          name: 'Interest Bearing',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.interestRate) {
              return `Interest Rate: ${Number(mintInfoAny.interestRate) / 100}%`;
            }
            return 'Interest bearing is enabled';
          }
        },
        4: { // CpiGuard
          name: 'CPI Guard',
          getDetails: () => 'Protects token from CPI attacks'
        },
        5: { // MintCloseAuthority
          name: 'Mint Close Authority',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.mintCloseAuthority) {
              return `Authority: ${mintInfoAny.mintCloseAuthority.toString()}`;
            }
            return 'Mint close authority is enabled';
          }
        },
        6: { // DefaultAccountState
          name: 'Default Account State',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.defaultAccountState !== undefined) {
              const state = mintInfoAny.defaultAccountState === 1 ? 'Frozen' : 'Unfrozen';
              return `State: ${state}`;
            }
            return 'Default account state is enabled';
          }
        },
        7: { // TransferHook
          name: 'Transfer Hook',
          getDetails: () => 'Hook called when transferring tokens'
        },
        8: { // ConfidentialTransferMint
          name: 'Confidential Transfer',
          getDetails: () => 'Supports confidential token transfers'
        },
        9: { // ConfidentialTransferFee
          name: 'Confidential Transfer Fee',
          getDetails: () => 'Fee for confidential transactions'
        },
        10: { // MetadataPointer
          name: 'Metadata Pointer',
          getDetails: () => 'Points to metadata resource'
        },
        11: { // TokenMetadata
          name: 'Token Metadata',
          getDetails: () => 'On-chain metadata for token'
        },
        12: { // GroupPointer
          name: 'Group Pointer',
          getDetails: () => 'Points to token group'
        },
        13: { // GroupMemberPointer
          name: 'Group Member Pointer',
          getDetails: () => 'Points to token group member'
        },
        14: { // PermanentDelegate
          name: 'Permanent Delegate',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.permanentDelegate) {
              return `Delegate: ${mintInfoAny.permanentDelegate.toString()}`;
            }
            return 'Permanent delegate is enabled';
          }
        },
        15: { // TransferFeeAmount
          name: 'Transfer Fee Amount',
          getDetails: () => 'Information about transfer fee amount'
        },
        16: { // MintPermanentDelegate
          name: 'Mint Permanent Delegate',
          getDetails: () => 'Fixed delegate that can mint new tokens'
        },
        17: { // MemoTransfer
          name: 'Memo Transfer',
          getDetails: () => 'Requires memo for each transfer transaction'
        }
      };
      
      // Process detected extensions
      const mintInfoAny = mintInfo as any;
      
      for (const extType of mintDataExtensions) {
        // Add extension if information about it exists
        if (extType in extensionDetailsMap) {
          const { name, getDetails } = extensionDetailsMap[extType];
          
          // Check if extension already added
          if (!extensions.some(ext => ext.name === name)) {
            extensions.push({
              name,
              status: 'active',
              details: getDetails(mintInfoAny)
            });
          }
        } else {
          // Unknown extension
          extensions.push({
            name: `Extension ${extType}`,
            status: 'active',
            details: 'No detailed information available'
          });
        }
      }
      
      // Check common extensions if not already detected
      if (!extensions.some(ext => ext.name === 'Transfer Fee') && mintInfoAny.transferFeeConfig) {
        const feeBasisPoints = mintInfoAny.transferFeeConfig.transferFeeBasisPoints || 0;
        const feePercentage = feeBasisPoints / 100;
        const maxFee = mintInfoAny.transferFeeConfig.maximumFee ? mintInfoAny.transferFeeConfig.maximumFee.toString() : '0';
        extensions.push({
          name: 'Transfer Fee',
          status: 'active',
          details: `Fee: ${feePercentage}%, Max Fee: ${Number(maxFee) / Math.pow(10, mintInfo.decimals)}`
        });
      }
      
      if (!extensions.some(ext => ext.name === 'Non-Transferable') && mintInfoAny.nonTransferable) {
        extensions.push({
          name: 'Non-Transferable',
          status: 'active',
          details: 'Token cannot be transferred between wallets'
        });
      }
      
      if (!extensions.some(ext => ext.name === 'Permanent Delegate') && mintInfoAny.permanentDelegate) {
        extensions.push({
          name: 'Permanent Delegate',
          status: 'active',
          details: `Delegate: ${mintInfoAny.permanentDelegate.toString()}`
        });
      }
      
    } catch (e) {
      console.error('Error detecting token extensions:', e);
      
      // Fallback: Use simplest method to detect extensions
      try {
        const mintInfo = await getMint(connection, mintAddress, undefined, TOKEN_2022_PROGRAM_ID);
        const mintInfoAny = mintInfo as any;
        
        // Check common extensions
        if (mintInfoAny.transferFeeConfig) {
          const feeBasisPoints = mintInfoAny.transferFeeConfig.transferFeeBasisPoints || 0;
          const feePercentage = feeBasisPoints / 100;
          const maxFee = mintInfoAny.transferFeeConfig.maximumFee ? mintInfoAny.transferFeeConfig.maximumFee.toString() : '0';
          extensions.push({
            name: 'Transfer Fee',
            status: 'active',
            details: `Fee: ${feePercentage}%, Max Fee: ${Number(maxFee) / Math.pow(10, mintInfo.decimals)}`
          });
        }
        
        if (mintInfoAny.nonTransferable) {
          extensions.push({
            name: 'Non-Transferable',
            status: 'active',
            details: 'Token cannot be transferred between wallets'
          });
        }
        
        if (mintInfoAny.permanentDelegate) {
          extensions.push({
            name: 'Permanent Delegate',
            status: 'active',
            details: `Delegate: ${mintInfoAny.permanentDelegate.toString()}`
          });
        }
      } catch (fallbackError) {
        console.error('Fallback extension detection also failed:', fallbackError);
      }
    }

    return extensions;
  } catch (error) {
    console.error('Error getting token extensions:', error);
    return [];
  }
}

/**
 * Get token transaction history
 */
async function getTokenTransactions(connection: Connection, walletAddress: PublicKey, mintAddress: PublicKey): Promise<TokenTransaction[]> {
  try {
    // Get recent signatures for the token mint, limit to only 5 transactions
    const signatures = await connection.getSignaturesForAddress(mintAddress, { limit: 5 });
    
    if (signatures.length === 0) {
      return [];
    }
    
    console.log(`Found ${signatures.length} signatures for token ${mintAddress.toString()}`);
    
    const transactions: TokenTransaction[] = [];
    
    // Use Promise.all to fetch transactions in parallel, but limit to 5
    const txInfos: Array<ParsedTransactionWithMeta | null> = [];
    
    // Only process the first 5 signatures to reduce RPC load
    const signaturesLimit = signatures.slice(0, 5);
    
    for (const signatureInfo of signaturesLimit) {
      try {
        console.log(`Processing signature: ${signatureInfo.signature}`);
        
        const txInfo = await connection.getParsedTransaction(
          signatureInfo.signature,
          { maxSupportedTransactionVersion: 0 }
        );
        
        if (!txInfo || !txInfo.meta) {
          console.log(`No transaction info found for ${signatureInfo.signature}`);
          continue;
        }
        
        // Check if transaction relates to this token and current wallet
        let type: 'receive' | 'send' = 'receive';
        let amount = '0';
        let fromAddress = 'Unknown';
        let toAddress = 'Unknown';
        let found = false;
        
        // Check if this transaction involves the connected wallet
        const txId = signatureInfo.signature;
        
        console.log(`Examining transaction ${txId.substring(0, 8)}...`);
        
        // Check in transaction instructions
        if (txInfo.transaction.message.instructions) {
          for (const ix of txInfo.transaction.message.instructions) {
            // Check program IDs
            const programId = ix.programId.toString();
            console.log(`  Instruction program: ${programId.substring(0, 8)}...`);
            
            // Check if this is an SPL Token instruction
            if (programId === TOKEN_2022_PROGRAM_ID.toString() || 
                programId === TOKEN_PROGRAM_ID.toString()) {
              // Use type assertion to resolve type issue
              const parsedIx = ix as any;
              
              // Log parsed instruction type if available
              if (parsedIx.parsed && parsedIx.parsed.type) {
                console.log(`  Instruction type: ${parsedIx.parsed.type}`);
                
                // Search for addresses in instruction
                if (parsedIx.parsed.type === 'transferChecked' || parsedIx.parsed.type === 'transfer') {
                  fromAddress = parsedIx.parsed.info.source || fromAddress;
                  toAddress = parsedIx.parsed.info.destination || toAddress;
                  
                  console.log(`  From: ${fromAddress.substring(0, 8)}... To: ${toAddress.substring(0, 8)}...`);
                  console.log(`  Connected wallet: ${walletAddress.toString().substring(0, 8)}...`);
                  
                  // Get token amount
                  if (parsedIx.parsed.info.tokenAmount) {
                    amount = parsedIx.parsed.info.tokenAmount.uiAmount.toString();
                    console.log(`  Amount: ${amount}`);
                  } else if (parsedIx.parsed.info.amount) {
                    amount = parsedIx.parsed.info.amount;
                    console.log(`  Amount: ${amount}`);
                  }
                  
                  // For debug: always consider token transactions as relevant to show history
                  // Later we can add proper filtering
                  found = true;
                  
                  // Determine if receiving or sending
                  if (toAddress === walletAddress.toString()) {
                    type = 'receive';
                    console.log(`  Transaction type: receive`);
                  } else if (fromAddress === walletAddress.toString()) {
                    type = 'send';
                    console.log(`  Transaction type: send`);
                  } else {
                    // Skip transactions not directly related to wallet
                    found = false;
                    console.log(`  Transaction type: skipped (not directly related to connected wallet)`);
                  }
                }
              }
            }
          }
        }
        
        // If there is information about token transaction
        if (found && amount !== '0') {
          console.log(`Adding transaction ${txId.substring(0, 8)}... to display list`);
          transactions.push({
            id: txId,
            type,
            amount: `${amount}`,
            from: fromAddress,
            to: toAddress,
            date: new Date(signatureInfo.blockTime ? signatureInfo.blockTime * 1000 : Date.now()).toLocaleDateString(),
            status: txInfo.meta.err ? 'failed' : 'completed'
          });
        } else {
          console.log(`Transaction ${txId.substring(0, 8)}... skipped - found: ${found}, amount: ${amount}`);
        }
      } catch (error) {
        console.error(`Error processing transaction ${signatureInfo.signature}:`, error);
      }
    }

    console.log(`Processed ${transactions.length} transactions for display`);
    return transactions;
  } catch (error) {
    console.error('Error getting token transactions:', error);
    return [];
  }
} 