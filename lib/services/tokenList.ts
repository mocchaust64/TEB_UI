import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getMint, getTokenMetadata } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

export interface TokenItem {
  id: string;
  name: string;
  symbol: string;
  balance: string;
  image: string | null;
  decimals: number;
  price?: string;
  value?: string;
  change?: string;
  positive?: boolean;
  metadata?: any;
}

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
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
    });

    const tokens: TokenItem[] = [];

    for (const tokenAccount of tokenAccounts.value) {
      const accountInfo = tokenAccount.account.data.parsed.info;
      const mintAddress = accountInfo.mint;
      const balance = accountInfo.tokenAmount.uiAmount;
      
      if (balance <= 0) continue;

      try {
        const mintInfo = await getMint(
          connection,
          new PublicKey(mintAddress),
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        let name = 'Unknown Token';
        let symbol = 'UNKNOWN';
        let image = null;
        let metadata = null;

        try {
          const tokenMetadata = await getTokenMetadata(
            connection,
            new PublicKey(mintAddress)
          );

          if (tokenMetadata) {
            name = tokenMetadata.name || name;
            symbol = tokenMetadata.symbol || symbol;
            
            if (tokenMetadata.uri) {
              try {
                const response = await fetch(tokenMetadata.uri);
                if (response.ok) {
                  const metadataJson = await response.json();
                  metadata = metadataJson;
                  
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
    
    const mintInfo = await getMint(
      connection,
      mintAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const userTokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      mint: mintAddress,
    });

    let balance = '0';
    if (userTokenAccounts.value.length > 0) {
      balance = userTokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount.toString();
    }
    
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
      const tokenMetadata = await getTokenMetadata(
        connection,
        mintAddress
      );

      if (tokenMetadata) {
        name = tokenMetadata.name || name;
        symbol = tokenMetadata.symbol || symbol;
        
        if (tokenMetadata.uri) {
          try {
            const response = await fetch(tokenMetadata.uri);
            if (response.ok) {
              const metadataJson = await response.json();
              
              name = metadataJson.name || name;
              symbol = metadataJson.symbol || symbol;
              image = metadataJson.image || null;
              description = metadataJson.description || '';
              
              website = metadataJson.external_url || '';
              
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

    const supply = (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toString();

    extensions = await getTokenExtensions(connection, mintAddress);

    const tokenDetail: TokenDetails = {
      id: tokenId,
      name,
      symbol,
      balance,
      image,
      decimals: mintInfo.decimals,
      supply,
      description,
      created: new Date().toLocaleDateString(),
      extensions,
      links: {
        website,
        twitter,
        telegram,
        discord
      },
      transactions: []
    };

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

    const mintAccountInfo = await connection.getAccountInfo(mintAddress);
    
    if (!mintAccountInfo) {
      return extensions;
    }
    
    const isToken2022 = mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
    
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
    }

    if (!isToken2022) {
      return extensions;
    }
    
    try {
      const mintData = mintAccountInfo.data;
      
      const mintDataExtensions: number[] = [];
      
      if (mintData.length > 82) {
        let offset = 82;
        
        while (offset < mintData.length) {
          const extensionType = mintData[offset];
          
          if (extensionType === 0) break;
          
          mintDataExtensions.push(extensionType);
          
          const lengthBytes = mintData.slice(offset + 1, offset + 5);
          const lengthView = new DataView(lengthBytes.buffer, lengthBytes.byteOffset, lengthBytes.byteLength);
          const extensionLength = lengthView.getUint32(0, true);
          
          offset += 1 + 4 + extensionLength;
          
          if (offset >= mintData.length) break;
        }
      }
      
      console.log('Detected extensions:', mintDataExtensions);
      
        const mintInfo = await getMint(connection, mintAddress, undefined, TOKEN_2022_PROGRAM_ID);
      
      interface ExtensionDetailInfo {
        name: string;
        getDetails: (mintInfo: any) => string;
      }
      
      const extensionDetailsMap: { [key: number]: ExtensionDetailInfo } = {
        1: {
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
        2: {
          name: 'Non-Transferable',
          getDetails: () => 'Token cannot be transferred between wallets'
        },
        3: {
          name: 'Interest Bearing',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.interestRate) {
              return `Interest Rate: ${Number(mintInfoAny.interestRate) / 100}%`;
            }
            return 'Interest bearing is enabled';
          }
        },
        4: {
          name: 'CPI Guard',
          getDetails: () => 'Protects token from CPI attacks'
        },
        5: {
          name: 'Mint Close Authority',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.mintCloseAuthority) {
              return `Authority: ${mintInfoAny.mintCloseAuthority.toString()}`;
            }
            return 'Mint close authority is enabled';
          }
        },
        6: {
          name: 'Default Account State',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.defaultAccountState !== undefined) {
              const state = mintInfoAny.defaultAccountState === 1 ? 'Frozen' : 'Unfrozen';
              return `State: ${state}`;
            }
            return 'Default account state is enabled';
          }
        },
        7: {
          name: 'Transfer Hook',
          getDetails: () => 'Hook called when transferring tokens'
        },
        8: {
          name: 'Confidential Transfer',
          getDetails: () => 'Supports confidential token transfers'
        },
        9: {
          name: 'Confidential Transfer Fee',
          getDetails: () => 'Fee for confidential transactions'
        },
        10: {
          name: 'Metadata Pointer',
          getDetails: () => 'Points to metadata resource'
        },
              11: {
          name: 'Token Metadata',
          getDetails: () => 'On-chain metadata for token'
        },
        12: {
          name: 'Group Pointer',
          getDetails: () => 'Points to token group'
        },
        13: {
          name: 'Group Member Pointer',
          getDetails: () => 'Points to token group member'
        },
        14: {
          name: 'Permanent Delegate',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.permanentDelegate) {
              return `Delegate: ${mintInfoAny.permanentDelegate.toString()}`;
            }
            return 'Permanent delegate is enabled';
          }
        },
        15: {
          name: 'Transfer Fee Amount',
          getDetails: () => 'Information about transfer fee amount'
        },
        16: {
          name: 'Mint Permanent Delegate',
          getDetails: () => 'Fixed delegate that can mint new tokens'
        },
        17: {
          name: 'Memo Transfer',
          getDetails: () => 'Requires memo for each transfer transaction'
        }
      };
      
      const mintInfoAny = mintInfo as any;
      
      for (const extType of mintDataExtensions) {      
        if (extType in extensionDetailsMap) {
          const { name, getDetails } = extensionDetailsMap[extType];
          
          if (!extensions.some(ext => ext.name === name)) {
            extensions.push({
              name,
              status: 'active',
              details: getDetails(mintInfoAny)
            });
          }
        } else {
          extensions.push({
            name: `Extension ${extType}`,
            status: 'active',
            details: 'No detailed information available'
          });
        }
      }
      
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

      try {
        const mintInfo = await getMint(connection, mintAddress, undefined, TOKEN_2022_PROGRAM_ID);
        const mintInfoAny = mintInfo as any;
        
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
    const signatures = await connection.getSignaturesForAddress(mintAddress, { limit: 5 });
    
    if (signatures.length === 0) {
      return [];
    }
    
    console.log(`Found ${signatures.length} signatures for token ${mintAddress.toString()}`);
    
    const transactions: TokenTransaction[] = [];
    
    const txInfos: Array<ParsedTransactionWithMeta | null> = [];
    
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
        
        let type: 'receive' | 'send' = 'receive';
        let amount = '0';
        let fromAddress = 'Unknown';
        let toAddress = 'Unknown';
        let found = false;
        
        const txId = signatureInfo.signature;
        
        console.log(`Examining transaction ${txId.substring(0, 8)}...`);
        
        if (txInfo.transaction.message.instructions) {
          for (const ix of txInfo.transaction.message.instructions) {
            const programId = ix.programId.toString();
            console.log(`  Instruction program: ${programId.substring(0, 8)}...`);
            
            if (programId === TOKEN_2022_PROGRAM_ID.toString() || 
                programId === TOKEN_PROGRAM_ID.toString()) {
              const parsedIx = ix as any;
              
              if (parsedIx.parsed && parsedIx.parsed.type) {
                console.log(`  Instruction type: ${parsedIx.parsed.type}`);
                
                if (parsedIx.parsed.type === 'transferChecked' || parsedIx.parsed.type === 'transfer') {
                  fromAddress = parsedIx.parsed.info.source || fromAddress;
                  toAddress = parsedIx.parsed.info.destination || toAddress;
                  
                  console.log(`  From: ${fromAddress.substring(0, 8)}... To: ${toAddress.substring(0, 8)}...`);
                  console.log(`  Connected wallet: ${walletAddress.toString().substring(0, 8)}...`);
                  
                  if (parsedIx.parsed.info.tokenAmount) {
                    amount = parsedIx.parsed.info.tokenAmount.uiAmount.toString();
                    console.log(`  Amount: ${amount}`);
                  } else if (parsedIx.parsed.info.amount) {
                    amount = parsedIx.parsed.info.amount;
                    console.log(`  Amount: ${amount}`);
                  }
                  
                    found = true;
                  
                  if (toAddress === walletAddress.toString()) {
                    type = 'receive';
                    console.log(`  Transaction type: receive`);
                  } else if (fromAddress === walletAddress.toString()) {
                    type = 'send';
                    console.log(`  Transaction type: send`);
                  } else {
                    found = false;
                    console.log(`  Transaction type: skipped (not directly related to connected wallet)`);
                  }
                }
              }
            }
          }
        }
        
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