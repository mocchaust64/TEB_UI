import { TokenItem } from "@/lib/services/tokenList";

// Set key for localStorage and cache time (5 minutes)
const TOKENS_STORAGE_KEY = 'tokenui-cached-tokens';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Interface for cached data
export interface CachedTokenData {
  tokens: TokenItem[];
  publicKey: string;
  timestamp: number;
  totalValue: string;
}

// Function to save token data to localStorage
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

// Function to read token data from localStorage
export const getTokensFromCache = (publicKey: string): CachedTokenData | null => {
  if (!publicKey) return null;

  try {
    const cachedData = localStorage.getItem(TOKENS_STORAGE_KEY);
    if (!cachedData) return null;

    const parsedData: CachedTokenData = JSON.parse(cachedData);
    
    // Check if data belongs to the current wallet
    if (parsedData.publicKey !== publicKey.toString()) return null;
    
    // Check if data is expired
    if (Date.now() - parsedData.timestamp > CACHE_EXPIRY_TIME) return null;
    
    return parsedData;
  } catch (error) {
    console.error("Error reading tokens from cache:", error);
    return null;
  }
}; 