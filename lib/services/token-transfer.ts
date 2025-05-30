import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { 
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedInstruction
} from "@solana/spl-token";

// Import Token từ đường dẫn chính xác
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
 * Chuyển token từ ví người dùng đến một ví khác
 * @param connection Solana connection
 * @param wallet Wallet context của người gửi
 * @param params Các tham số cho việc chuyển token
 * @param options Các options cho callback
 * @returns Signature của transaction
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
    toast.error("Ví chưa được kết nối");
    return null;
  }
  
  try {
    if (onStart) onStart();
    
    // Convert amount to lamports (based on decimals)
    const amountToSend = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
    
    if (amountToSend <= BigInt(0)) {
      throw new Error("Số lượng token không hợp lệ");
    }
    
    // Parse addresses
    console.log("Mint address:", mintAddress);
    console.log("Recipient address:", recipientAddress);
    
    let mintPublicKey, recipientPublicKey;
    try {
      mintPublicKey = new PublicKey(mintAddress);
    } catch (err) {
      console.error("Lỗi khi chuyển đổi địa chỉ mint:", err);
      throw new Error("Địa chỉ mint token không hợp lệ");
    }
    
    try {
      recipientPublicKey = new PublicKey(recipientAddress);
    } catch (err) {
      console.error("Lỗi khi chuyển đổi địa chỉ người nhận:", err);
      throw new Error("Địa chỉ ví người nhận không hợp lệ");
    }
    
    // Xác định token program
    const tokenProgram = await determineTokenProgram(connection, mintPublicKey);
    
    // Khởi tạo token instance từ SDK của chúng ta
    const token = new Token(connection, mintPublicKey);
    
    // Debug: Kiểm tra các phương thức của Token class
    console.log("Token class methods:", Object.getOwnPropertyNames(Token.prototype));
    console.log("Token instance:", token);
    
    // Tạo hoặc lấy tài khoản token nguồn (người gửi)
    console.log("Đang lấy tài khoản token nguồn...");
    let sourceTokenAccount;
    
    try {
      // Lấy địa chỉ Associated Token Account cho người gửi - sử dụng phương thức từ Token class
      const sourceAssociatedAddress = await token.getAssociatedAddress(
        publicKey,
        false
      );
      
      // Kiểm tra xem tài khoản đã tồn tại chưa
      const sourceAccountInfo = await connection.getAccountInfo(sourceAssociatedAddress);
      
      if (!sourceAccountInfo) {
        throw new Error("Tài khoản token của bạn không tồn tại. Vui lòng tạo tài khoản token trước.");
      }
      
      console.log("Tài khoản token nguồn đã tồn tại:", sourceAssociatedAddress.toString());
      sourceTokenAccount = sourceAssociatedAddress;
    } catch (err) {
      console.error("Lỗi khi kiểm tra tài khoản token nguồn:", err);
      throw new Error("Không tìm thấy tài khoản token nguồn. Bạn cần có token trong ví trước khi chuyển.");
    }
    
    // Tạo hoặc lấy tài khoản token đích (người nhận)
    console.log("Đang lấy hoặc tạo tài khoản token đích...");
    let destinationTokenAccount;
    
    // Lấy địa chỉ Associated Token Account cho người nhận - sử dụng phương thức từ Token class
    const destinationAssociatedAddress = await token.getAssociatedAddress(
      recipientPublicKey,
      false
    );
    
    // Kiểm tra xem tài khoản đích đã tồn tại chưa
    const destinationAccountInfo = await connection.getAccountInfo(destinationAssociatedAddress);
    
    // Transaction để chứa các instructions
    const transaction = new Transaction();
    
    // Nếu tài khoản đích chưa tồn tại, thêm instruction để tạo nó - sử dụng phương thức từ Token class
    if (!destinationAccountInfo) {
      console.log("Tạo tài khoản token đích mới...");
      transaction.add(
        token.createAssociatedTokenAccountInstruction(
          publicKey,             // Payer
          destinationAssociatedAddress,  // Associated token account 
          recipientPublicKey     // Owner
        )
      );
    } else {
      console.log("Tài khoản token đích đã tồn tại:", destinationAssociatedAddress.toString());
    }
    
    destinationTokenAccount = destinationAssociatedAddress;
    
    // Tạo instruction chuyển token
    console.log("Tạo lệnh chuyển token...");
    
    // Thêm instruction chuyển token
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
    
    // Thêm memo nếu có
    if (memo) {
      const memoId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
      transaction.add({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
        programId: memoId,
        data: Buffer.from(memo, "utf-8")
      });
    }
    
    // Lấy blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;
    
    // Gửi transaction bằng wallet adapter
    console.log("Gửi transaction...");
    const signature = await sendTransaction(transaction, connection, {
      skipPreflight: false,
      preflightCommitment: "confirmed"
    });
    
    // Đợi xác nhận
    console.log("Đợi xác nhận...");
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, "confirmed");
    
    // Cập nhật token cache sau khi chuyển thành công
    await updateTokenCache(connection, wallet);
    
    if (onSuccess) onSuccess(signature);
    
    return signature;
  } catch (error: any) {
    console.error("Error transferring token:", error);
    
    // Provide more user-friendly error messages
    let errorMessage = "Có lỗi xảy ra khi chuyển token";
    
    if (error.message?.includes("NonTransferable")) {
      errorMessage = "Token này không thể chuyển (có extension NonTransferable)";
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Số dư không đủ để thực hiện giao dịch";
    } else if (error.message?.includes("invalid account owner")) {
      errorMessage = "Chủ tài khoản không hợp lệ";
    } else if (error.message?.includes("failed to send transaction")) {
      errorMessage = "Không thể gửi giao dịch, vui lòng thử lại";
    } else if (error instanceof Error && error.name === "TokenAccountNotFoundError") {
      errorMessage = "Không tìm thấy tài khoản token. Vui lòng đảm bảo bạn có đủ SOL để tạo tài khoản token";
    }
    
    toast.error(errorMessage);
    
    if (onError && error instanceof Error) onError(error);
    return null;
  } finally {
    if (onFinish) onFinish();
  }
};

/**
 * Xác định token program của token (Token Program hay Token-2022 Program)
 * @param connection Solana connection
 * @param mintAddress Địa chỉ mint của token
 * @returns Token program ID
 */
export async function determineTokenProgram(
  connection: Connection,
  mintAddress: PublicKey
): Promise<PublicKey> {
  try {
    // Kiểm tra account info
    const accountInfo = await connection.getAccountInfo(mintAddress);
    
    if (!accountInfo) {
      throw new Error("Token mint không tồn tại");
    }
    
    // Kiểm tra owner của account là Token Program hay Token-2022 Program
    if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      return TOKEN_2022_PROGRAM_ID;
    }
    
    return TOKEN_PROGRAM_ID;
  } catch (error) {
    console.error("Error determining token program:", error);
    // Mặc định sử dụng Token Program
    return TOKEN_PROGRAM_ID;
  }
}

/**
 * Cập nhật token cache sau khi chuyển token thành công
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