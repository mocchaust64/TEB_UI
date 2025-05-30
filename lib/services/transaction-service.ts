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

  const publicKey = wallet.publicKey; // Lưu tham chiếu để tránh null check lặp lại

  try {
    // Lấy danh sách chữ ký giao dịch gần đây của ví
    const signatures = await connection.getSignaturesForAddress(
      publicKey, 
      { limit }
    );

    // Mảng kết quả
    const transactions: TransactionItem[] = [];

    // Token symbols cache để tránh truy vấn lặp lại
    const tokenSymbolCache: { [mintAddress: string]: string } = {};
    
    // Danh sách các mint không hợp lệ đã báo lỗi để tránh in lặp lại cùng lỗi
    const reportedInvalidMints = new Set<string>();
    
    // Danh sách các giao dịch đã xử lý (tránh trùng lặp)
    const processedTxIds = new Set<string>();
    
    // Xử lý từng signature
    for (const signatureInfo of signatures) {
      const txId = signatureInfo.signature;
      
      // Bỏ qua nếu đã xử lý
      if (processedTxIds.has(txId)) continue;
      processedTxIds.add(txId);
      
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
        let isTokenTransaction = false;
        
        // Kiểm tra các hướng dẫn trong giao dịch
        if (txInfo.transaction.message.instructions) {
          for (const ix of txInfo.transaction.message.instructions) {
            const parsedIx = ix as any;
            
            // Kiểm tra nếu đây là giao dịch SPL Token
            if (
              ix.programId.toString() === TOKEN_2022_PROGRAM_ID.toString() || 
              ix.programId.toString() === TOKEN_PROGRAM_ID.toString()
            ) {
              isTokenTransaction = true;
              if (parsedIx.parsed && parsedIx.parsed.type) {
                // Lấy thông tin dựa trên loại hướng dẫn
                switch (parsedIx.parsed.type) {
                  case 'transferChecked':
                  case 'transfer':
                    // Xác định nếu gửi hoặc nhận dựa trên so sánh địa chỉ
                    if (parsedIx.parsed.info.destination === publicKey.toString()) {
                      type = 'receive';
                    } else if (parsedIx.parsed.info.authority === publicKey.toString() ||
                               parsedIx.parsed.info.source === publicKey.toString()) {
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
                    // Kiểm tra tính hợp lệ của mint address trước khi gọi API
                    let isValidMint = false;
                    try {
                      // Kiểm tra xem có phải là public key hợp lệ không
                      new PublicKey(tokenMint);
                      
                      // Kiểm tra mint có tồn tại không
                      const mintInfo = await connection.getAccountInfo(new PublicKey(tokenMint));
                      isValidMint = mintInfo !== null;
                    } catch (err) {
                      isValidMint = false;
                    }
                    
                    // Chỉ gọi API nếu mint hợp lệ
                    if (isValidMint) {
                      // Thử lấy metadata của token
                      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                        publicKey,
                        { mint: new PublicKey(tokenMint) }
                      );
                      
                      if (tokenAccounts.value.length > 0) {
                        const tokenInfo = tokenAccounts.value[0].account.data.parsed.info;
                        
                        if (tokenInfo.mint) {
                          // Cập nhật vào cache
                          tokenSymbolCache[tokenMint] = tokenInfo.symbol || 'UNKNOWN';
                        }
                      }
                    } else {
                      // Nếu mint không hợp lệ, sử dụng địa chỉ rút gọn làm symbol
                      if (tokenMint && tokenMint.length >= 8) {
                        const shortMint = `${tokenMint.slice(0, 4)}...${tokenMint.slice(-4)}`;
                        tokenSymbolCache[tokenMint] = shortMint;
                      } else {
                        tokenSymbolCache[tokenMint] = 'UNKNOWN';
                      }
                    }
                  } catch (error) {
                    // Giảm log mức độ lỗi nếu chỉ là không tìm thấy mint
                    if (error instanceof Error && error.message.includes('could not find mint')) {
                      // Chỉ báo lỗi nếu mint này chưa được báo trước đó
                      if (!reportedInvalidMints.has(tokenMint)) {
                        console.warn(`Warning: Token mint not found for ${tokenMint}, using placeholder symbol`);
                        reportedInvalidMints.add(tokenMint);
                      }
                    } else {
                      console.error('Error fetching token info:', error);
                    }
                    
                    // Nếu không thể lấy thông tin, sử dụng địa chỉ rút gọn làm symbol
                    if (tokenMint && tokenMint.length >= 8) {
                      // Rút gọn địa chỉ mint làm symbol (4 ký tự đầu + 4 ký tự cuối)
                      const shortMint = `${tokenMint.slice(0, 4)}...${tokenMint.slice(-4)}`;
                      tokenSymbolCache[tokenMint] = shortMint;
                    } else {
                      tokenSymbolCache[tokenMint] = 'UNKNOWN';
                    }
                  }
                }
                
                // Sử dụng symbol từ cache hoặc giá trị mặc định
                if (tokenMint && tokenSymbolCache[tokenMint]) {
                  symbol = tokenSymbolCache[tokenMint];
                }
              }
            }
            
            // Kiểm tra nếu là giao dịch SOL (System Program)
            if (ix.programId.toString() === '11111111111111111111111111111111' && !isTokenTransaction) {
              if (parsedIx.parsed && parsedIx.parsed.type === 'transfer') {
                // Kiểm tra nếu là giao dịch nhận SOL
                if (parsedIx.parsed.info.destination === publicKey.toString()) {
                  type = 'receive';
                  amount = (parsedIx.parsed.info.lamports / 1e9).toString(); // Chuyển đổi từ lamports sang SOL
                } 
                // Kiểm tra nếu là giao dịch gửi SOL
                else if (parsedIx.parsed.info.source === publicKey.toString()) {
                  type = 'send';
                  amount = (parsedIx.parsed.info.lamports / 1e9).toString(); // Chuyển đổi từ lamports sang SOL
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
          // Xác định địa chỉ đối tác
          let address = '';
          
          try {
            if (type === 'receive') {
              // Tìm địa chỉ của người gửi (thường là chữ ký đầu tiên)
              const sender = txInfo.transaction.message.accountKeys.find(
                account => account.signer && account.pubkey.toString() !== publicKey.toString()
              );
              address = sender ? sender.pubkey.toString() : txInfo.transaction.message.accountKeys[0].pubkey.toString();
            } else {
              // Tìm địa chỉ người nhận trong trường hợp gửi
              const receiver = txInfo.transaction.message.accountKeys.find(
                account => !account.signer && account.pubkey.toString() !== publicKey.toString()
              );
              address = receiver ? receiver.pubkey.toString() : txInfo.transaction.message.accountKeys[1].pubkey.toString();
            }
          } catch (e) {
            // Nếu có lỗi khi xác định địa chỉ, sử dụng cách xác định đơn giản hơn
            address = type === 'receive' ? 
              txInfo.transaction.message.accountKeys[0].pubkey.toString() : 
              txInfo.transaction.message.accountKeys[1].pubkey.toString();
          }
            
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