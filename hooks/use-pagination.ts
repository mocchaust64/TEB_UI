import { useState, useEffect } from 'react';
import { getPageNumbers } from '@/components/pagination/pagination-utils';

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage: number;
  initialPage?: number;
}

interface UsePaginationResult<T> {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  paginatedItems: T[];
  totalPages: number;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  pageNumbers: number[];
}

/**
 * Hook for managing pagination
 * @param items List of items to paginate
 * @param itemsPerPage Number of items per page
 * @param initialPage Initial page (default is 1)
 * @returns Pagination values and handler functions
 */
export function usePagination<T>({ 
  items, 
  itemsPerPage, 
  initialPage = 1 
}: UsePaginationProps<T>): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [paginatedItems, setPaginatedItems] = useState<T[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumbers, setPageNumbers] = useState<number[]>([]);

  // Calculate total pages and update items for current page
  useEffect(() => {
    // Calculate number of pages
    const total = Math.ceil(items.length / itemsPerPage) || 1;
    setTotalPages(total);
    
    // Adjust current page if it exceeds total pages
    if (currentPage > total) {
      setCurrentPage(1);
    }
    
    // Get items for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedItems(items.slice(startIndex, endIndex));
    
    // Calculate page numbers to display
    setPageNumbers(getPageNumbers(currentPage, total));
  }, [items, currentPage, itemsPerPage]);

  // Move to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Move to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
    goToPreviousPage,
    goToNextPage,
    pageNumbers
  };
} 