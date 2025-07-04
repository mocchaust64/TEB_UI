import { Connection, PublicKey } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { initializeTransferHookWhitelist as initializeWhitelist } from "../services/token-service";

/**
 * Khởi tạo Transfer Hook Whitelist và ExtraAccountMetaList
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param mintAddress Địa chỉ mint của token
 * @param programId Địa chỉ program transfer hook
 * @returns Signature hoặc mã trạng thái
 */
export async function initializeTransferHookWhitelist(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: PublicKey | string,
  programId: PublicKey | string
): Promise<string> {
  // Chuyển đổi các tham số thành PublicKey nếu cần
  const mint = typeof mintAddress === 'string' ? new PublicKey(mintAddress) : mintAddress;
  const hookProgramId = typeof programId === 'string' ? new PublicKey(programId) : programId;
  
  // Gọi hàm từ token-service
  return initializeWhitelist(connection, wallet, mint, hookProgramId);
} 