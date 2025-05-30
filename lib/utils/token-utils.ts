import { Connection } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { TokenItem } from "@/lib/services/tokenList";

/**
 * Định dạng địa chỉ ví thành dạng rút gọn
 * @param address Địa chỉ ví đầy đủ
 * @returns Địa chỉ rút gọn dạng xxxx...xxxx
 */
export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

/**
 * Lọc danh sách token dựa trên từ khóa tìm kiếm
 * @param tokens Danh sách token gốc
 * @param searchTerm Từ khóa tìm kiếm
 * @returns Danh sách token đã lọc
 */
export const filterTokensBySearchTerm = (tokens: TokenItem[], searchTerm: string): TokenItem[] => {
  if (!searchTerm || searchTerm.trim() === '') {
    return tokens;
  }
  
  const term = searchTerm.toLowerCase();
  return tokens.filter(token => 
    token.name.toLowerCase().includes(term) || 
    token.symbol.toLowerCase().includes(term) ||
    token.id.toLowerCase().includes(term)
  );
};

/**
 * Sắp xếp token theo số dư (giảm dần)
 * @param tokens Danh sách token cần sắp xếp
 * @returns Danh sách token đã sắp xếp
 */
export const sortTokensByBalance = (tokens: TokenItem[]): TokenItem[] => {
  return [...tokens].sort((a, b) => {
    const balanceA = parseFloat(a.balance) || 0;
    const balanceB = parseFloat(b.balance) || 0;
    return balanceB - balanceA;
  });
};

/**
 * Lưu trữ danh sách token vào localStorage
 * @param tokenData Danh sách token cần lưu
 * @param publicKey Khóa công khai của ví
 * @param totalValue Tổng giá trị (nếu có)
 * @param storageKey Khóa lưu trữ trong localStorage
 */
export const saveTokensToCache = (
  tokenData: TokenItem[], 
  publicKey: string, 
  totalValue: string = "0",
  storageKey: string = 'tokenui-cached-tokens'
): void => {
  if (!publicKey) return;

  const cacheData = {
    tokens: tokenData,
    publicKey: publicKey,
    timestamp: Date.now(),
    totalValue
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error saving tokens to cache:", error);
  }
};

/**
 * Lấy danh sách token từ localStorage
 * @param publicKey Khóa công khai của ví
 * @param storageKey Khóa lưu trữ trong localStorage
 * @param expiryTime Thời gian hết hạn (mili-giây)
 * @returns Dữ liệu token đã cache hoặc null nếu không có/đã hết hạn
 */
export const getTokensFromCache = (
  publicKey: string, 
  storageKey: string = 'tokenui-cached-tokens',
  expiryTime: number = 5 * 60 * 1000 // 5 phút mặc định
) => {
  if (!publicKey) return null;

  try {
    const cachedData = localStorage.getItem(storageKey);
    if (!cachedData) return null;

    const parsedData = JSON.parse(cachedData);
    
    // Kiểm tra xem dữ liệu có thuộc về ví hiện tại không
    if (parsedData.publicKey !== publicKey) return null;
    
    // Kiểm tra xem dữ liệu có hết hạn không
    if (Date.now() - parsedData.timestamp > expiryTime) return null;
    
    return parsedData;
  } catch (error) {
    console.error("Error reading tokens from cache:", error);
    return null;
  }
}; 