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
 * Hook quản lý phân trang
 * @param items Danh sách items cần phân trang
 * @param itemsPerPage Số items mỗi trang
 * @param initialPage Trang ban đầu (mặc định là 1)
 * @returns Các giá trị và hàm xử lý phân trang
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

  // Tính toán tổng số trang và cập nhật items cho trang hiện tại
  useEffect(() => {
    // Tính toán số trang
    const total = Math.ceil(items.length / itemsPerPage) || 1;
    setTotalPages(total);
    
    // Điều chỉnh trang hiện tại nếu vượt quá số trang
    if (currentPage > total) {
      setCurrentPage(1);
    }
    
    // Lấy items cho trang hiện tại
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedItems(items.slice(startIndex, endIndex));
    
    // Tính toán các số trang cần hiển thị
    setPageNumbers(getPageNumbers(currentPage, total));
  }, [items, currentPage, itemsPerPage]);

  // Di chuyển đến trang trước
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Di chuyển đến trang tiếp theo
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