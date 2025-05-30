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
 * Hook for searching and filtering tokens
 * @param tokens Original token list
 * @param initialSearchTerm Initial search term (default is '')
 * @returns Search term, set term function, filtered token list
 */
export const useTokenSearch = ({ 
  tokens, 
  initialSearchTerm = '' 
}: UseTokenSearchProps): UseTokenSearchResult => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filteredTokens, setFilteredTokens] = useState<TokenItem[]>(tokens);

  // Update search results when searchTerm or tokens change
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

  // Function to clear search
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