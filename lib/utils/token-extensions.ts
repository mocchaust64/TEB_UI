import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { TokenItem as BaseTokenItem } from "../services/tokenList";

// Mở rộng interface TokenItem để bao gồm thuộc tính details
export interface TokenItemWithDetails extends BaseTokenItem {
  details?: string;
  mintAuthority?: boolean; // Có quyền mint hay không
}

/**
 * Thông tin về các extension của token
 */
export interface TokenExtensionInfo {
  isToken2022: boolean;
  
  // Transfer Fee Extension
  hasTransferFee: boolean;
  feePercentage?: number;
  feeDecimals?: number;
  feeBasisPoints?: number;
  maxFee?: string;
  
  // Non-Transferable Extension
  hasNonTransferable: boolean;
  
  // Permanent Delegate Extension
  hasPermanentDelegate: boolean;
  delegateAddress?: string;
  
  // Default Account Extension
  hasDefaultAccount: boolean;
  defaultAccountAddress?: string;
  
  // Metadata Extension
  hasMetadata: boolean;
  name?: string;
  symbol?: string;
  uri?: string;
}

// Định nghĩa kiểu cảnh báo
export type WarningType = 'warning' | 'error' | 'info';
export interface ExtensionWarning {
  type: WarningType;
  title: string;
  message: string;
}

/**
 * Kiểm tra extension của token từ details string
 * @param details Thông tin chi tiết của token
 * @returns Thông tin về extensions của token
 */
export function parseTokenExtensionsFromDetails(details?: string): Partial<TokenExtensionInfo> {
  if (!details) return {};
  
  let extensions: Partial<TokenExtensionInfo> = {
    isToken2022: true, // Nếu có details, giả định đây là token 2022
  };
  
  // Kiểm tra TransferFee
  if (details.includes("Fee:") && details.includes("%")) {
    extensions.hasTransferFee = true;
    
    // Phân tích chuỗi để lấy phần trăm phí
    const feeMatch = details.match(/Fee:\s*(\d+(\.\d+)?)%/);
    if (feeMatch && feeMatch[1]) {
      extensions.feePercentage = parseFloat(feeMatch[1]);
      extensions.feeBasisPoints = extensions.feePercentage * 100; // Chuyển % thành basis points
    }
    
    // Phân tích max fee nếu có
    const maxFeeMatch = details.match(/Max Fee:\s*(\d+(\.\d+)?)/);
    if (maxFeeMatch && maxFeeMatch[1]) {
      extensions.maxFee = maxFeeMatch[1];
    }
  }
  
  // Kiểm tra NonTransferable
  if (details.includes("Non-Transferable")) {
    extensions.hasNonTransferable = true;
  }
  
  // Kiểm tra PermanentDelegate
  if (details.includes("Permanent Delegate")) {
    extensions.hasPermanentDelegate = true;
    
    // Cố gắng lấy địa chỉ delegate nếu có
    const delegateMatch = details.match(/Delegate:\s*([1-9A-HJ-NP-Za-km-z]{32,44})/);
    if (delegateMatch && delegateMatch[1]) {
      extensions.delegateAddress = delegateMatch[1];
    }
  }
  
  return extensions;
}

/**
 * Tính toán phí chuyển token dựa trên số lượng và phần trăm phí
 * @param amount Số lượng token chuyển
 * @param feePercentage Phần trăm phí (ví dụ: 1.5 cho 1.5%)
 * @param decimals Số chữ số thập phân của token
 * @returns Thông tin về phí chuyển
 */
export function calculateTransferFee(amount: string, feePercentage: number = 0, decimals: number = 0) {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0 || feePercentage <= 0) {
    return {
      feeAmount: "0",
      receivedAmount: amount,
      feePercentage: feePercentage
    };
  }
  
  const feeAmount = numAmount * (feePercentage / 100);
  const receivedAmount = numAmount - feeAmount;
  
  return {
    feeAmount: feeAmount.toFixed(decimals),
    receivedAmount: receivedAmount.toFixed(decimals),
    feePercentage: feePercentage
  };
}

/**
 * Kiểm tra xem token có phải là Token-2022 không
 * @param connection Kết nối Solana
 * @param mintAddress Địa chỉ mint của token
 * @returns true nếu là Token-2022, false nếu không phải
 */
export async function isToken2022(connection: Connection, mintAddress: string | PublicKey): Promise<boolean> {
  try {
    const mintPublicKey = typeof mintAddress === 'string' ? new PublicKey(mintAddress) : mintAddress;
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    
    if (!mintInfo) return false;
    
    return mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
  } catch (error) {
    console.error("Error checking if token is Token-2022:", error);
    return false;
  }
}

/**
 * Kiểm tra các extension của token
 * @param connection Kết nối Solana
 * @param token Thông tin token
 * @returns Thông tin về extensions của token
 */
export async function getTokenExtensions(
  connection: Connection,
  token: TokenItemWithDetails
): Promise<TokenExtensionInfo> {
  // Khởi tạo thông tin extension mặc định
  const extensionInfo: TokenExtensionInfo = {
    isToken2022: false,
    hasTransferFee: false,
    hasNonTransferable: false,
    hasPermanentDelegate: false,
    hasDefaultAccount: false,
    hasMetadata: false
  };
  
  try {
    const mintPublicKey = new PublicKey(token.id);
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    
    if (!mintInfo) return extensionInfo;
    
    // Kiểm tra program ID để xác định có phải token-2022 không
    extensionInfo.isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
    
    if (!extensionInfo.isToken2022) {
      return extensionInfo; // Nếu không phải Token-2022, không cần kiểm tra thêm
    }
    
    // Phân tích thông tin extension từ details
    const detailsExtensions = parseTokenExtensionsFromDetails(token.details);
    
    // Cập nhật thông tin extension
    return {
      ...extensionInfo,
      ...detailsExtensions
    };
  } catch (error) {
    console.error("Error checking token extensions:", error);
    return extensionInfo;
  }
}

/**
 * Tạo thông báo cảnh báo dựa trên các extension của token
 * @param extensionInfo Thông tin về extensions của token
 * @param amount Số lượng token muốn chuyển
 * @param symbol Ký hiệu của token
 * @param decimals Số chữ số thập phân của token
 * @returns Mảng các thông báo cảnh báo
 */
export function generateExtensionWarnings(
  extensionInfo: TokenExtensionInfo,
  amount: string,
  symbol: string,
  decimals: number
): ExtensionWarning[] {
  const warnings: ExtensionWarning[] = [];
  
  // Kiểm tra Non-Transferable
  if (extensionInfo.hasNonTransferable) {
    warnings.push({
      type: 'error',
      title: 'Token Non-Transferable',
      message: 'Token này không thể chuyển cho người khác do có extension Non-Transferable.'
    });
  }
  
  // Kiểm tra Transfer Fee
  if (extensionInfo.hasTransferFee && extensionInfo.feePercentage) {
    const { feeAmount, receivedAmount } = calculateTransferFee(
      amount,
      extensionInfo.feePercentage,
      decimals
    );
    
    warnings.push({
      type: 'warning',
      title: `Token có phí chuyển ${extensionInfo.feePercentage}%`,
      message: `Khi chuyển ${amount} ${symbol}, người nhận sẽ bị trừ ${feeAmount} ${symbol} phí và thực nhận ${receivedAmount} ${symbol}.`
    });
  }
  
  // Kiểm tra Permanent Delegate
  if (extensionInfo.hasPermanentDelegate) {
    warnings.push({
      type: 'info',
      title: 'Token có Permanent Delegate',
      message: 'Token này có một địa chỉ delegate vĩnh viễn có thể thực hiện các hành động trên token của bạn.'
    });
  }
  
  return warnings;
}

/**
 * Tạo đoạn mô tả ngắn gọn về các extension của token
 * @param extensionInfo Thông tin về extensions của token
 * @returns Mô tả ngắn gọn về các extension
 */
export function getExtensionSummary(extensionInfo: TokenExtensionInfo): string {
  const extensions = [];
  
  if (extensionInfo.hasTransferFee) {
    extensions.push(`Transfer Fee: ${extensionInfo.feePercentage}%`);
  }
  
  if (extensionInfo.hasNonTransferable) {
    extensions.push('Non-Transferable');
  }
  
  if (extensionInfo.hasPermanentDelegate) {
    extensions.push('Permanent Delegate');
  }
  
  if (extensionInfo.hasDefaultAccount) {
    extensions.push('Default Account');
  }
  
  if (extensionInfo.hasMetadata) {
    extensions.push('Metadata');
  }
  
  if (extensions.length === 0) return 'Không có extension';
  
  return extensions.join(', ');
} 