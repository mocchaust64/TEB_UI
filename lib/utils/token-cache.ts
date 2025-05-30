import { TokenItem } from "@/lib/services/tokenList";

// Đặt key cho localStorage và thời gian cache (5 phút)
const TOKENS_STORAGE_KEY = 'tokenui-cached-tokens';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 phút tính bằng mili-giây

// Interface cho dữ liệu được cache
export interface CachedTokenData {
  tokens: TokenItem[];
  publicKey: string;
  timestamp: number;
  totalValue: string;
}

// Hàm lưu dữ liệu token vào localStorage
export const saveTokensToCache = (tokenData: TokenItem[], totalValue: string, publicKey: string) => {
  if (!publicKey) return;

  const cacheData: CachedTokenData = {
    tokens: tokenData,
    publicKey: publicKey.toString(),
    timestamp: Date.now(),
    totalValue
  };

  try {
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error saving tokens to cache:", error);
  }
};

// Hàm đọc dữ liệu token từ localStorage
export const getTokensFromCache = (publicKey: string): CachedTokenData | null => {
  if (!publicKey) return null;

  try {
    const cachedData = localStorage.getItem(TOKENS_STORAGE_KEY);
    if (!cachedData) return null;

    const parsedData: CachedTokenData = JSON.parse(cachedData);
    
    // Kiểm tra xem dữ liệu có thuộc về ví hiện tại không
    if (parsedData.publicKey !== publicKey.toString()) return null;
    
    // Kiểm tra xem dữ liệu có hết hạn không
    if (Date.now() - parsedData.timestamp > CACHE_EXPIRY_TIME) return null;
    
    return parsedData;
  } catch (error) {
    console.error("Error reading tokens from cache:", error);
    return null;
  }
}; 