import { PublicKey } from '@solana/web3.js';

/**
 * Interface cho thông tin tài khoản token
 */
export interface TokenAccountInfo {
  address: string;
  owner: string;
  mint: string;
  balance: string;
  decimals: number;
  isFrozen: boolean;
  programId: string;
  displayBalance?: string;
}

/**
 * Interface cho token item trong danh sách token
 */
export interface TokenExtensionInfo {
  hasDefaultAccountState?: boolean;
  hasTransferFee?: boolean;
  hasTransferHook?: boolean;
  hasMetadata?: boolean;
  hasPermanentDelegate?: boolean;
  hasInterestBearing?: boolean;
  hasNonTransferable?: boolean;
  hasMintCloseAuthority?: boolean;
} 