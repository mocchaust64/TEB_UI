import { useState, useEffect } from 'react';
import { TokenItem } from '@/lib/services/tokenList';

interface UseTokenSearchProps {
  tokens: TokenItem[];
  initialSearchTerm?: string;
}

interface UseTokenSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredTokens: TokenItem[];
  clearSearch: () => void;
}

/**
 * Hook tìm kiếm và lọc token
 * @param tokens Danh sách tokens gốc
 * @param initialSearchTerm Từ khóa tìm kiếm ban đầu (mặc định là '')
 * @returns Từ khóa tìm kiếm, hàm set từ khóa, danh sách tokens đã được lọc
 */
export const useTokenSearch = ({ 
  tokens, 
  initialSearchTerm = '' 
}: UseTokenSearchProps): UseTokenSearchResult => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filteredTokens, setFilteredTokens] = useState<TokenItem[]>(tokens);

  // Cập nhật kết quả tìm kiếm khi searchTerm hoặc tokens thay đổi
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTokens(tokens);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredTokens(tokens.filter(token => 
        token.name.toLowerCase().includes(term) || 
        token.symbol.toLowerCase().includes(term) ||
        token.id.toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, tokens]);

  // Hàm xóa tìm kiếm
  const clearSearch = () => {
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredTokens,
    clearSearch
  };
}; 