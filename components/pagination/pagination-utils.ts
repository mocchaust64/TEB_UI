/**
 * Hàm tính toán số trang và trả về một mảng các số trang để hiển thị
 * @param currentPage Trang hiện tại
 * @param totalPages Tổng số trang
 * @param maxPagesToShow Số trang tối đa hiển thị (mặc định là 5)
 * @returns Mảng các số trang để hiển thị
 */
export const getPageNumbers = (
  currentPage: number, 
  totalPages: number, 
  maxPagesToShow: number = 5
): number[] => {
  const pageNumbers: number[] = [];
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;
  
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  return pageNumbers;
};

/**
 * Hook cho phân trang
 * @param totalItems Tổng số items
 * @param itemsPerPage Số items mỗi trang
 * @param initialPage Trang bắt đầu (mặc định là 1)
 * @returns Các giá trị và hàm xử lý phân trang
 */
export const usePagination = (
  totalItems: number,
  itemsPerPage: number,
  initialPage: number = 1
) => {
  // Tính toán tổng số trang
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Đảm bảo initialPage nằm trong khoảng hợp lệ
  const validInitialPage = Math.min(Math.max(1, initialPage), totalPages);
  
  // Tính toán các chỉ số bắt đầu và kết thúc
  const startIndex = (validInitialPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // Các hàm di chuyển trang
  const goToPage = (page: number) => Math.min(Math.max(1, page), totalPages);
  const goToPreviousPage = (currentPage: number) => goToPage(currentPage - 1);
  const goToNextPage = (currentPage: number) => goToPage(currentPage + 1);
  
  return {
    totalPages,
    validInitialPage,
    startIndex,
    endIndex,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    getPageNumbers: (currentPage: number, maxPagesToShow: number = 5) => 
      getPageNumbers(currentPage, totalPages, maxPagesToShow)
  };
}; 