import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import {
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedInstruction,
  getMint,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";

import { saveTokensToCache } from "@/lib/utils/token-cache";
import { getUserTokens } from "./tokenList";

// Interface for permanent delegate recovery options
export interface PermanentDelegateRecoveryOptions {
  connection: Connection;
  wallet: WalletContextState;
  sourceWalletAddress: string;
  mintAddress: string;
  amount: number;
  decimals: number;
}

/**
 * Thu hồi token bằng permanent delegate
 * @param options Recovery options
 * @returns 
 */
export async function permanentDelegateRecovery(options: PermanentDelegateRecoveryOptions) {
  const { connection, wallet, sourceWalletAddress, mintAddress, amount, decimals } = options;
  
  if (!wallet.publicKey) {
    toast.error("Wallet not connected");
    return null;
  }
  
  try {
    console.log("Starting permanent delegate recovery...");
    
    // Convert addresses to PublicKey
    const mintPubkey = new PublicKey(mintAddress);
    const sourceWalletPubkey = new PublicKey(sourceWalletAddress);
    const delegatePubkey = wallet.publicKey;
    
    // Bỏ qua phần kiểm tra quyền, giả định rằng wallet hiện tại là permanent delegate
    console.log("Wallet đang thực hiện quyền permanent delegate:", delegatePubkey.toString());
    
    // Lấy token account của nguồn
    const sourceTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      sourceWalletPubkey,
      true,
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log("Source token account:", sourceTokenAccount.toString());
    
    // Transaction sẽ chứa tất cả các instructions
    const transaction = new Transaction();
    
    // Kiểm tra xem token account có tồn tại không
    let sourceAccountExists = false;
    try {
      const sourceAccount = await getAccount(
        connection,
        sourceTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      console.log("Source account balance:", sourceAccount.amount.toString());
      sourceAccountExists = true;
    } catch (error) {
      console.error("Error getting source account:", error);
      console.log("Source account does not exist, will create it...");
      
      // Tạo instruction để tạo tài khoản token cho nguồn
      const createSourceAccountIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey,          // Payer
        sourceTokenAccount,        // Associated token account address
        sourceWalletPubkey,        // Token account owner
        mintPubkey,                // Mint
        TOKEN_2022_PROGRAM_ID      // Program ID
      );
      
      // Thêm instruction vào transaction
      transaction.add(createSourceAccountIx);
    }
    
    // Lấy token account của destination (chính là wallet hiện tại)
    const destinationTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      delegatePubkey,
      true,
      TOKEN_2022_PROGRAM_ID
    );
    
    console.log("Destination token account:", destinationTokenAccount.toString());
    
    // Kiểm tra xem destination token account có tồn tại không
    let destAccountExists = false;
    try {
      await getAccount(
        connection,
        destinationTokenAccount,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      console.log("Destination account exists");
      destAccountExists = true;
    } catch (error) {
      console.log("Destination account does not exist, will create it...");
      
      // Tạo instruction để tạo tài khoản token cho destination
      const createDestAccountIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey,          // Payer
        destinationTokenAccount,   // Associated token account address
        delegatePubkey,            // Token account owner
        mintPubkey,                // Mint
        TOKEN_2022_PROGRAM_ID      // Program ID
      );
      
      // Thêm instruction vào transaction
      transaction.add(createDestAccountIx);
    }
    
    // Nếu source account không tồn tại, chúng ta không thể chuyển token ngay lập tức
    if (!sourceAccountExists) {
      toast.warning("Source account was just created. You need to mint tokens to it first.");
      
      // Gửi transaction để tạo tài khoản
      const signature = await wallet.sendTransaction(transaction, connection);
      console.log("Account creation transaction:", signature);
      
      return {
        signature,
        tokenAccount: sourceTokenAccount.toString(),
        message: "Source account created. Please mint tokens to it before transferring."
      };
    }
    
    // Tạo instruction để chuyển token
    const amountToTransfer = BigInt(amount * (10 ** decimals));
    console.log(`Amount to transfer: ${amountToTransfer.toString()}, decimals: ${decimals}`);
    
    const transferInstruction = createTransferCheckedInstruction(
      sourceTokenAccount,
      mintPubkey,
      destinationTokenAccount,
      delegatePubkey, // Sử dụng permanent delegate làm authority
      amountToTransfer, // Chuyển đổi số lượng theo decimals
      decimals,
      [],
      TOKEN_2022_PROGRAM_ID
    );
    
    // Thêm instruction chuyển token vào transaction
    transaction.add(transferInstruction);
    
    // Gửi transaction
    console.log("Sending transaction...");
    const signature = await wallet.sendTransaction(transaction, connection);
    
    console.log("Transaction successful:", signature);
    toast.success("Recovery completed successfully");
    
    // Cập nhật lại danh sách token sau khi chuyển
    try {
      // Truyền đúng tham số vào hàm getUserTokens
      const updatedTokens = await getUserTokens(connection, wallet);
      saveTokensToCache(updatedTokens, "0", wallet.publicKey.toString());
    } catch (error) {
      console.error("Error updating token list:", error);
      // Không ngăn cản hoàn thành hàm nếu lỗi chỉ xảy ra ở bước này
    }
    
    return {
      signature,
      tokenAccount: destinationTokenAccount.toString()
    };
  } catch (error) {
    console.error("Error in permanent delegate recovery:", error);
    toast.error("Recovery failed: " + (error as Error).message);
    return null;
  }
} 