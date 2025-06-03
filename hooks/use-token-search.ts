import { useState, useEffect, useCallback } from 'react';
import { getTokensFromCache } from '@/lib/utils/token-cache';
import { TokenItem } from '@/lib/services/tokenList';

export interface TokenSearchProps {
  tokens: TokenItem[];
  initialSearchTerm?: string;
}

export interface UseTokenSearchResult {
  searchTerm: string;
  setSearchTerm: (query: string) => void;
  filteredTokens: TokenItem[];
}

export function useTokenSearch({ tokens, initialSearchTerm = '' }: TokenSearchProps): UseTokenSearchResult {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filteredTokens, setFilteredTokens] = useState<TokenItem[]>(tokens);

  // Lọc tokens dựa trên searchTerm
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTokens(tokens);
      return;
    }

    const queryLower = searchTerm.toLowerCase();
    const filtered = tokens.filter((token: TokenItem) => {
      return (
        (token.name && token.name.toLowerCase().includes(queryLower)) ||
        (token.symbol && token.symbol.toLowerCase().includes(queryLower)) ||
        (token.id && token.id.toLowerCase().includes(queryLower))
      );
    });

    setFilteredTokens(filtered);
  }, [searchTerm, tokens]);

  return {
    searchTerm,
    setSearchTerm,
    filteredTokens
  };
}

// Hook tìm kiếm token từ cache - có thể sử dụng trong tương lai
export function useTokenSearchFromCache(): {
  tokens: TokenItem[];
  searchTokens: (query: string, publicKey?: string) => Promise<TokenItem[]>;
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
} {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchTokens = useCallback(async (query: string, publicKey?: string): Promise<TokenItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Lấy danh sách token từ cache và tìm kiếm
      if (!publicKey) return [];
      
      const cachedData = getTokensFromCache(publicKey);
      
      // Nếu không có dữ liệu cache
      if (!cachedData || !cachedData.tokens) {
        setTokens([]);
        return [];
      }
      
      const cachedTokens = cachedData.tokens;
      
      if (!query) {
        const firstTokens = cachedTokens.slice(0, 20); // Chỉ hiển thị 20 token đầu tiên nếu không có query
        setTokens(firstTokens);
        return firstTokens;
      }

      // Tìm kiếm dựa trên query (tên token, symbol hoặc id - mint address)
      const queryLower = query.toLowerCase();
      const filteredTokens = cachedTokens.filter((token: TokenItem) => {
        return (
          (token.name && token.name.toLowerCase().includes(queryLower)) ||
          (token.symbol && token.symbol.toLowerCase().includes(queryLower)) ||
          (token.id && token.id.toLowerCase().includes(queryLower))
        );
      });

      setTokens(filteredTokens);
      return filteredTokens;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setTokens([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tự động tìm kiếm khi searchQuery thay đổi
  useEffect(() => {
    if (searchQuery) {
      searchTokens(searchQuery);
    }
  }, [searchQuery, searchTokens]);

  return {
    tokens,
    searchTokens,
    isLoading,
    error,
    searchQuery,
    setSearchQuery
  };
} 