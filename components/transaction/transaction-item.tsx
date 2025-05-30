import React from 'react';
import { Badge } from "@/components/ui/badge";
import { TransactionIcon, TransactionType } from './transaction-icons';
import { formatAddress, formatTimestamp } from '@/lib/utils/format-utils';

export interface TransactionItemProps {
  id: string;
  type: TransactionType;
  amount: string;
  symbol: string;
  address: string;
  timestamp: Date;
  status: 'confirmed' | 'processing' | 'failed';
  tokenIcon?: string;
}

/**
 * Component hiển thị thông tin một giao dịch
 */
export const TransactionItem: React.FC<TransactionItemProps> = ({
  id,
  type,
  amount,
  symbol,
  address,
  timestamp,
  status,
  tokenIcon
}) => {
  // Xác định màu sắc dựa trên loại giao dịch
  const getTextColor = () => {
    switch (type) {
      case 'receive':
      case 'mint':
        return 'text-green-400';
      case 'send':
      case 'burn':
        return 'text-red-400';
      case 'swap':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  // Thêm ký hiệu + hoặc - trước số lượng dựa vào loại giao dịch
  const getAmountPrefix = () => {
    switch (type) {
      case 'receive':
      case 'mint':
        return '+';
      case 'send':
      case 'burn':
        return '-';
      default:
        return '';
    }
  };

  return (
    <div className="p-4 hover:bg-gray-800/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 mr-3">
            <TransactionIcon type={type} />
          </div>
          <div>
            <div className="flex items-center">
              <span className="text-white font-medium mr-2 capitalize">
                {type}
              </span>
              <Badge variant="outline" className="text-xs px-1.5 border-gray-700 text-gray-400">
                {status}
              </Badge>
            </div>
            <div className="text-sm text-gray-400 mt-0.5">
              {formatAddress(address)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-medium ${getTextColor()}`}>
            {getAmountPrefix()}{amount} {symbol}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {formatTimestamp(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}; 