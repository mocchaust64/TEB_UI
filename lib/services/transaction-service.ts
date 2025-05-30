import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Interface cho dữ liệu giao dịch
export interface TransactionItem {
  id: string;
  type: 'receive' | 'send' | 'swap' | 'mint' | 'burn';
  amount: string;
  symbol: string;
  address: string;
  timestamp: Date;
  status: 'confirmed' | 'processing' | 'failed';
  tokenIcon?: string;
  signature: string;
}

/**
 * Lấy danh sách giao dịch gần đây của wallet từ blockchain Solana
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param limit Số lượng giao dịch tối đa cần lấy
 */
export async function getUserTransactions(
  connection: Connection, 
  wallet: WalletContextState,
  limit: number = 20
): Promise<TransactionItem[]> {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    // Lấy danh sách chữ ký giao dịch gần đây của ví
    const signatures = await connection.getSignaturesForAddress(
      wallet.publicKey, 
      { limit }
    );

    // Mảng kết quả
    const transactions: TransactionItem[] = [];

    // Token symbols cache để tránh truy vấn lặp lại
    const tokenSymbolCache: { [mintAddress: string]: string } = {};
    
    // Xử lý từng signature
    for (const signatureInfo of signatures) {
      const txId = signatureInfo.signature;
      
      try {
        // Lấy thông tin chi tiết của giao dịch
        const txInfo = await connection.getParsedTransaction(txId, {
          maxSupportedTransactionVersion: 0
        });

        // Nếu không có thông tin giao dịch, bỏ qua
        if (!txInfo || !txInfo.meta) continue;

        // Mặc định loại giao dịch
        let type: TransactionItem['type'] = 'send';
        let amount = '0';
        let symbol = 'SOL';
        let tokenMint = '';
        
        // Kiểm tra các hướng dẫn trong giao dịch
        if (txInfo.transaction.message.instructions) {
          for (const ix of txInfo.transaction.message.instructions) {
            const parsedIx = ix as any;
            
            // Kiểm tra nếu đây là giao dịch SPL Token
            if (
              ix.programId.toString() === TOKEN_2022_PROGRAM_ID.toString() || 
              ix.programId.toString() === TOKEN_PROGRAM_ID.toString()
            ) {
              if (parsedIx.parsed && parsedIx.parsed.type) {
                // Lấy thông tin dựa trên loại hướng dẫn
                switch (parsedIx.parsed.type) {
                  case 'transferChecked':
                  case 'transfer':
                    // Xác định nếu gửi hoặc nhận dựa trên so sánh địa chỉ
                    if (parsedIx.parsed.info.destination === wallet.publicKey.toString()) {
                      type = 'receive';
                    } else if (parsedIx.parsed.info.authority === wallet.publicKey.toString() ||
                               parsedIx.parsed.info.source === wallet.publicKey.toString()) {
                      type = 'send';
                    }
                    
                    // Lấy số lượng token
                    if (parsedIx.parsed.info.tokenAmount) {
                      amount = parsedIx.parsed.info.tokenAmount.uiAmount.toString();
                    } else if (parsedIx.parsed.info.amount) {
                      const decimals = parsedIx.parsed.info.decimals || 0;
                      amount = (Number(parsedIx.parsed.info.amount) / Math.pow(10, decimals)).toString();
                    }
                    
                    // Lấy địa chỉ mint của token
                    tokenMint = parsedIx.parsed.info.mint;
                    break;
                    
                  case 'mintTo':
                    type = 'mint';
                    tokenMint = parsedIx.parsed.info.mint;
                    
                    // Lấy số lượng
                    if (parsedIx.parsed.info.tokenAmount) {
                      amount = parsedIx.parsed.info.tokenAmount.uiAmount.toString();
                    } else if (parsedIx.parsed.info.amount) {
                      const decimals = parsedIx.parsed.info.decimals || 0;
                      amount = (Number(parsedIx.parsed.info.amount) / Math.pow(10, decimals)).toString();
                    }
                    break;
                    
                  case 'burn':
                    type = 'burn';
                    tokenMint = parsedIx.parsed.info.mint;
                    
                    // Lấy số lượng
                    if (parsedIx.parsed.info.tokenAmount) {
                      amount = parsedIx.parsed.info.tokenAmount.uiAmount.toString();
                    } else if (parsedIx.parsed.info.amount) {
                      const decimals = parsedIx.parsed.info.decimals || 0;
                      amount = (Number(parsedIx.parsed.info.amount) / Math.pow(10, decimals)).toString();
                    }
                    break;
                }
                
                // Nếu có mint address, lấy thông tin về symbol
                if (tokenMint && !tokenSymbolCache[tokenMint]) {
                  try {
                    // Thử lấy metadata của token
                    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                      wallet.publicKey,
                      { mint: new PublicKey(tokenMint) }
                    );
                    
                    if (tokenAccounts.value.length > 0) {
                      const tokenInfo = tokenAccounts.value[0].account.data.parsed.info;
                      
                      if (tokenInfo.mint) {
                        // Cập nhật vào cache
                        tokenSymbolCache[tokenMint] = tokenInfo.symbol || 'UNKNOWN';
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching token info:', error);
                    tokenSymbolCache[tokenMint] = 'UNKNOWN';
                  }
                }
                
                // Sử dụng symbol từ cache hoặc giá trị mặc định
                if (tokenMint) {
                  symbol = tokenSymbolCache[tokenMint] || 'UNKNOWN';
                }
              }
            }
            
            // Kiểm tra nếu là swap (ví dụ: Jupiter, Raydium, v.v.)
            if (
              // Ví dụ: Jupiter program ID
              ix.programId.toString() === 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB' ||
              // Các DEX phổ biến khác
              // Raydium
              ix.programId.toString() === 'RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr' ||
              // Orca
              ix.programId.toString() === 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1'
            ) {
              type = 'swap';
              // Ghi chú: Xác định chính xác chi tiết swap có thể phức tạp
              // và đòi hỏi phân tích sâu hơn về dữ liệu giao dịch
              symbol = 'SWAP'; // Placeholder
            }
          }
        }

        // Thêm vào danh sách giao dịch
        if (amount !== '0' || type === 'swap') {
          const address = type === 'receive' ? 
            txInfo.transaction.message.accountKeys[0].pubkey.toString() : 
            txInfo.transaction.message.accountKeys[1].pubkey.toString();
            
          transactions.push({
            id: txId,
            type,
            amount,
            symbol,
            address,
            timestamp: new Date(signatureInfo.blockTime ? signatureInfo.blockTime * 1000 : Date.now()),
            status: txInfo.meta.err ? 'failed' : 'confirmed',
            signature: txId
          });
        }
      } catch (error) {
        console.error(`Error processing transaction ${txId}:`, error);
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    throw error;
  }
} 