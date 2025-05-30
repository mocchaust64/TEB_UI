import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, Plus } from 'lucide-react';


export type TransactionType = 'receive' | 'send' | 'swap' | 'mint' | 'burn';

interface TransactionIconProps {
  type: TransactionType;
  size?: number;
  className?: string;
}


export const TransactionIcon: React.FC<TransactionIconProps> = ({ 
  type, 
  size = 16,
  className = "" 
}) => {
  const iconSize = { width: size, height: size };

  switch (type) {
    case 'receive':
      return <ArrowDownLeft className={`text-green-500 ${className}`} {...iconSize} />;
    
    case 'send':
      return <ArrowUpRight className={`text-red-500 ${className}`} {...iconSize} />;
    
    case 'swap':
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`text-blue-500 ${className}`}
          {...iconSize}
        >
          <path d="M17 3v10" />
          <path d="m21 7-4-4-4 4" />
          <path d="M7 21v-10" />
          <path d="m3 17 4 4 4-4" />
        </svg>
      );
    
    case 'mint':
      return <Plus className={`text-purple-500 ${className}`} {...iconSize} />;
    
    case 'burn':
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`text-orange-500 ${className}`}
          {...iconSize}
        >
          <path d="M12 2v8" />
          <path d="m4.93 10.93 1.41 1.41" />
          <path d="M2 18h2" />
          <path d="M20 18h2" />
          <path d="m19.07 10.93-1.41 1.41" />
          <path d="M22 22H2" />
          <path d="m16 6-4 4-4-4" />
          <path d="M16 18a4 4 0 0 0-8 0" />
        </svg>
      );
    
    default:
      return <Clock className={`text-gray-500 ${className}`} {...iconSize} />;
  }
};


export const getTransactionIcon = (type: TransactionType, size: number = 16, className: string = "") => {
  return <TransactionIcon type={type} size={size} className={className} />;
}; 