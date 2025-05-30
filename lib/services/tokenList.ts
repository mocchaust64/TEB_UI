import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAccount, getMint, getTokenMetadata, TYPE_SIZE, ExtensionType, getExtensionData } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Interface cho dữ liệu token
export interface TokenItem {
  id: string;          // Mint address (public key)
  name: string;
  symbol: string;
  balance: string;
  image: string | null;
  decimals: number;
  price?: string;      // Có thể undefined nếu không có giá
  value?: string;      // Giá trị = balance * price
  change?: string;     // % thay đổi giá
  positive?: boolean;  // Thay đổi tích cực hay tiêu cực
  metadata?: any;      // Metadata bổ sung
}

// Interface cho token details
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
  type: 'receive' | 'send';
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
 * Lấy danh sách token của người dùng từ blockchain Solana
 * @param connection Solana connection
 * @param wallet Wallet context
 */
export async function getUserTokens(connection: Connection, wallet: WalletContextState): Promise<TokenItem[]> {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    // Lấy danh sách tất cả token accounts của người dùng
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      programId: TOKEN_2022_PROGRAM_ID,
    });

    // Kết quả trả về
    const tokens: TokenItem[] = [];

    // Xử lý mỗi token account
    for (const tokenAccount of tokenAccounts.value) {
      const accountInfo = tokenAccount.account.data.parsed.info;
      const mintAddress = accountInfo.mint;
      const balance = accountInfo.tokenAmount.uiAmount;
      
      // Chỉ lấy các token có số dư > 0
      if (balance <= 0) continue;

      try {
        // Lấy thông tin mint
        const mintInfo = await getMint(
          connection,
          new PublicKey(mintAddress),
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        // Lấy metadata (nếu có)
        let name = 'Unknown Token';
        let symbol = 'UNKNOWN';
        let image = null;
        let metadata = null;

        try {
          // Lấy metadata từ token extensions (nếu có)
          const tokenMetadata = await getTokenMetadata(
            connection,
            new PublicKey(mintAddress)
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
                  metadata = metadataJson;
                  
                  // Cập nhật thông tin từ metadata
                  name = metadataJson.name || name;
                  symbol = metadataJson.symbol || symbol;
                  image = metadataJson.image || null;
                }
              } catch (error) {
                console.error('Error fetching metadata:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error getting token metadata:', error);
        }

        // Thêm token vào danh sách
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
 * Lấy chi tiết của một token
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
    
    // Lấy thông tin mint
    const mintInfo = await getMint(
      connection,
      mintAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Lấy thông tin account
    const userTokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
      mint: mintAddress,
    });

    // Lấy số dư
    let balance = '0';
    if (userTokenAccounts.value.length > 0) {
      balance = userTokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount.toString();
    }
    
    // Lấy metadata
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
      // Lấy metadata từ token
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
              description = metadataJson.description || '';
              
              // Links
              website = metadataJson.external_url || '';
              
              // Social links (nếu có)
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

    // Lấy tổng cung
    const supply = (Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toString();

    // Danh sách các extension của token
    extensions = await getTokenExtensions(connection, mintAddress);

    // Tạo token detail
    const tokenDetail: TokenDetails = {
      id: tokenId,
      name,
      symbol,
      balance,
      image,
      decimals: mintInfo.decimals,
      supply,
      description,
      created: new Date().toLocaleDateString(), // Sử dụng ngày hiện tại vì mintInfo không có createTime
      extensions,
      links: {
        website,
        twitter,
        telegram,
        discord
      },
      // Các giao dịch gần đây sẽ được thêm sau
      transactions: []
    };

    // Lấy lịch sử giao dịch
    tokenDetail.transactions = await getTokenTransactions(connection, wallet.publicKey, mintAddress);

    return tokenDetail;
  } catch (error) {
    console.error(`Error fetching token details for ${tokenId}:`, error);
    throw error;
  }
}

/**
 * Lấy danh sách các extension có trong token
 */
async function getTokenExtensions(connection: Connection, mintAddress: PublicKey): Promise<TokenExtension[]> {
  try {
    const extensions: TokenExtension[] = [];
    
    // Lấy account info trực tiếp để kiểm tra extensions
    const mintAccountInfo = await connection.getAccountInfo(mintAddress);
    
    if (!mintAccountInfo) {
      return extensions;
    }
    
    // Kiểm tra xem có phải là token-2022 không bằng cách kiểm tra owner
    const isToken2022 = mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
    
    // Kiểm tra metadata extension
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
      // Không có metadata extension
    }

    // Nếu không phải token-2022, chỉ có thể có metadata extension
    if (!isToken2022) {
      return extensions;
    }
    
    // Lấy mint info cho các extension khác
    try {
      // Phân tích các extension từ dữ liệu mint account
      const mintData = mintAccountInfo.data;
      
      // Sử dụng cách thủ công để xác định extensions từ TLV data
      const mintDataExtensions: number[] = [];
      
      // TLV data bắt đầu từ offset 82 trong mint account data
      if (mintData.length > 82) {
        let offset = 82;
        
        while (offset < mintData.length) {
          // Extension Type là 1 byte
          const extensionType = mintData[offset];
          
          // Nếu loại không hợp lệ, thoát vòng lặp
          if (extensionType === 0) break;
          
          // Thêm loại extension vào danh sách
          mintDataExtensions.push(extensionType);
          
          // Extension Length là 4 bytes, đọc dưới dạng little-endian
          const lengthBytes = mintData.slice(offset + 1, offset + 5);
          const lengthView = new DataView(lengthBytes.buffer, lengthBytes.byteOffset, lengthBytes.byteLength);
          const extensionLength = lengthView.getUint32(0, true);
          
          // Di chuyển offset: 1 byte cho type, 4 bytes cho length, và extensionLength bytes cho value
          offset += 1 + 4 + extensionLength;
          
          // Nếu đã vượt quá độ dài data, thoát vòng lặp
          if (offset >= mintData.length) break;
        }
      }
      
      console.log('Các extension được phát hiện:', mintDataExtensions);
      
      // Lấy thông tin mint để có được các chi tiết bổ sung
      const mintInfo = await getMint(connection, mintAddress, undefined, TOKEN_2022_PROGRAM_ID);
      
      // Map các loại extension với tên và hàm lấy chi tiết
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
            return 'Transfer fee được kích hoạt';
          }
        },
        2: { // NonTransferable
          name: 'Non-Transferable',
          getDetails: () => 'Token không thể chuyển nhượng giữa các ví'
        },
        3: { // InterestBearingConfig
          name: 'Interest Bearing',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.interestRate) {
              return `Interest Rate: ${Number(mintInfoAny.interestRate) / 100}%`;
            }
            return 'Tính lãi được kích hoạt';
          }
        },
        4: { // CpiGuard
          name: 'CPI Guard',
          getDetails: () => 'Bảo vệ token khỏi các cuộc tấn công CPI'
        },
        5: { // MintCloseAuthority
          name: 'Mint Close Authority',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.mintCloseAuthority) {
              return `Authority: ${mintInfoAny.mintCloseAuthority.toString()}`;
            }
            return 'Mint close authority được kích hoạt';
          }
        },
        6: { // DefaultAccountState
          name: 'Default Account State',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.defaultAccountState !== undefined) {
              const state = mintInfoAny.defaultAccountState === 1 ? 'Frozen' : 'Unfrozen';
              return `State: ${state}`;
            }
            return 'Default account state được kích hoạt';
          }
        },
        7: { // TransferHook
          name: 'Transfer Hook',
          getDetails: () => 'Hook được gọi khi chuyển token'
        },
        8: { // ConfidentialTransferMint
          name: 'Confidential Transfer',
          getDetails: () => 'Hỗ trợ chuyển token bảo mật'
        },
        9: { // ConfidentialTransferFee
          name: 'Confidential Transfer Fee',
          getDetails: () => 'Phí cho giao dịch bảo mật'
        },
        10: { // MetadataPointer
          name: 'Metadata Pointer',
          getDetails: () => 'Trỏ đến tài nguyên metadata'
        },
        11: { // TokenMetadata
          name: 'Token Metadata',
          getDetails: () => 'Metadata on-chain cho token'
        },
        12: { // GroupPointer
          name: 'Group Pointer',
          getDetails: () => 'Trỏ đến nhóm token'
        },
        13: { // GroupMemberPointer
          name: 'Group Member Pointer',
          getDetails: () => 'Trỏ đến thành viên nhóm token'
        },
        14: { // PermanentDelegate
          name: 'Permanent Delegate',
          getDetails: (mintInfoAny) => {
            if (mintInfoAny.permanentDelegate) {
              return `Delegate: ${mintInfoAny.permanentDelegate.toString()}`;
            }
            return 'Permanent delegate được kích hoạt';
          }
        },
        15: { // TransferFeeAmount
          name: 'Transfer Fee Amount',
          getDetails: () => 'Thông tin về số lượng phí chuyển khoản'
        },
        16: { // MintPermanentDelegate
          name: 'Mint Permanent Delegate',
          getDetails: () => 'Delegate cố định có thể tạo token mới'
        },
        17: { // MemoTransfer
          name: 'Memo Transfer',
          getDetails: () => 'Yêu cầu memo cho mỗi giao dịch chuyển'
        }
      };
      
      // Xử lý các extension đã phát hiện
      const mintInfoAny = mintInfo as any;
      
      for (const extType of mintDataExtensions) {
        // Thêm extension nếu có thông tin về nó
        if (extType in extensionDetailsMap) {
          const { name, getDetails } = extensionDetailsMap[extType];
          
          // Kiểm tra xem extension đã được thêm vào chưa
          if (!extensions.some(ext => ext.name === name)) {
            extensions.push({
              name,
              status: 'active',
              details: getDetails(mintInfoAny)
            });
          }
        } else {
          // Extension chưa biết
          extensions.push({
            name: `Extension ${extType}`,
            status: 'active',
            details: 'Không có thông tin chi tiết'
          });
        }
      }
      
      // Kiểm tra các extension phổ biến nếu chưa được phát hiện
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
          details: 'Token không thể chuyển nhượng giữa các ví'
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
      
      // Fallback: Sử dụng phương pháp đơn giản nhất để phát hiện extensions
      try {
        const mintInfo = await getMint(connection, mintAddress, undefined, TOKEN_2022_PROGRAM_ID);
        const mintInfoAny = mintInfo as any;
        
        // Kiểm tra các extension phổ biến
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
            details: 'Token không thể chuyển nhượng giữa các ví'
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
 * Lấy lịch sử giao dịch của token
 */
async function getTokenTransactions(connection: Connection, walletAddress: PublicKey, mintAddress: PublicKey): Promise<TokenTransaction[]> {
  try {
    // Lấy các signature gần đây của ví
    const signatures = await connection.getSignaturesForAddress(mintAddress, { limit: 20 });
    
    const transactions: TokenTransaction[] = [];
    
    // Xử lý từng signature
    for (const signatureInfo of signatures) {
      const txId = signatureInfo.signature;
      
      try {
      // Lấy chi tiết giao dịch
      const txInfo = await connection.getParsedTransaction(txId, {
        maxSupportedTransactionVersion: 0
      });
      
        // Nếu không có thông tin giao dịch hoặc có lỗi, bỏ qua
        if (!txInfo || !txInfo.meta) continue;
        
        // Kiểm tra xem giao dịch có liên quan đến token này và ví hiện tại không
        let type: 'receive' | 'send' = 'receive';
        let amount = '0';
        let fromAddress = 'Unknown';
        let toAddress = 'Unknown';
        let found = false;
        
        // Kiểm tra trong các hướng dẫn của giao dịch
        if (txInfo.transaction.message.instructions) {
          for (const ix of txInfo.transaction.message.instructions) {
            // Kiểm tra nếu đây là hướng dẫn SPL Token
            if (ix.programId.toString() === TOKEN_2022_PROGRAM_ID.toString()) {
              // Sử dụng type assertion để giải quyết vấn đề kiểu dữ liệu
              const parsedIx = ix as any;
              
              // Tìm kiếm các địa chỉ trong instruction
              if (parsedIx.parsed && parsedIx.parsed.type) {
                if (parsedIx.parsed.type === 'transferChecked' || parsedIx.parsed.type === 'transfer') {
                  fromAddress = parsedIx.parsed.info.source || fromAddress;
                  toAddress = parsedIx.parsed.info.destination || toAddress;
                  
                  // Lấy số lượng token
                  if (parsedIx.parsed.info.tokenAmount) {
                    amount = parsedIx.parsed.info.tokenAmount.uiAmount.toString();
                  } else if (parsedIx.parsed.info.amount) {
                    amount = parsedIx.parsed.info.amount;
                  }
                  
                  // Xác định loại giao dịch (gửi hoặc nhận)
                  if (toAddress === walletAddress.toString()) {
                    type = 'receive';
                    found = true;
                  } else if (fromAddress === walletAddress.toString()) {
                    type = 'send';
                    found = true;
                  }
                }
              }
            }
          }
        }
        
        // Nếu có thông tin về giao dịch token
        if (found && amount !== '0') {
        transactions.push({
          id: txId,
            type,
            amount: `${amount}`,
            from: fromAddress,
            to: toAddress,
          date: new Date(signatureInfo.blockTime ? signatureInfo.blockTime * 1000 : Date.now()).toLocaleDateString(),
            status: txInfo.meta.err ? 'failed' : 'completed'
        });
        }
      } catch (error) {
        console.error(`Error processing transaction ${txId}:`, error);
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error getting token transactions:', error);
    return [];
  }
} 