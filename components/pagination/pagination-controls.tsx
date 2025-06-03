import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageNumbers } from './pagination-utils';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  itemName?: string;
}

/**
 * Component điều khiển phân trang
 */
export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemName = 'items'
}) => {
  
  const startIndex = Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1);
  const endIndex = Math.min(totalItems, currentPage * itemsPerPage);


  const pageNumbers = getPageNumbers(currentPage, totalPages);


  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };


  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 sm:mt-6 text-xs sm:text-sm">
      <div className="text-gray-400 order-2 sm:order-1 text-center sm:text-left">
        Showing {startIndex}-{endIndex} of {totalItems} {itemName}
      </div>
      <div className="flex items-center space-x-1 order-1 sm:order-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="w-7 h-7 sm:w-8 sm:h-8 p-0 border-gray-700"
          onClick={goToPreviousPage} 
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
        
        {pageNumbers.map(pageNumber => (
          <Button 
            key={pageNumber}
            variant={pageNumber === currentPage ? "default" : "outline"} 
            size="icon" 
            className={`w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${pageNumber === currentPage ? 'bg-purple-600 border-purple-600' : 'border-gray-700'}`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
        
        <Button 
          variant="outline" 
          size="icon" 
          className="w-7 h-7 sm:w-8 sm:h-8 p-0 border-gray-700"
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
}; 