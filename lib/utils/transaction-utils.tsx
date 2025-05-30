import React from 'react'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Clock
} from 'lucide-react'

export type TransactionType = 'receive' | 'send' | 'swap' | 'mint' | 'burn'

export interface Transaction {
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
 * Trả về icon dựa trên loại giao dịch
 */
export function getTransactionIcon(type: TransactionType): React.ReactNode {
  switch (type) {
    case 'receive':
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    case 'send':
      return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    case 'swap':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
          <path d="M17 3v10" />
          <path d="m21 7-4-4-4 4" />
          <path d="M7 21v-10" />
          <path d="m3 17 4 4 4-4" />
        </svg>
      );
    case 'mint':
      return <Plus className="w-4 h-4 text-purple-500" />;
    case 'burn':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
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
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
}

/**
 * Rút gọn địa chỉ ví thành dạng 4 ký tự đầu...4 ký tự cuối
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Định dạng timestamp thành dạng thân thiện với người dùng
 * Ví dụ: "Just now", "5m ago", "2h ago", "3d ago"
 */
export function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  
  return timestamp.toLocaleDateString();
}

/**
 * Tạo màu chữ dựa trên loại giao dịch
 */
export function getTransactionTextColor(type: TransactionType): string {
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
}

/**
 * Định dạng số lượng token dựa trên loại giao dịch
 * Thêm '+' hoặc '-' trước số lượng
 */
export function formatAmount(type: TransactionType, amount: string, symbol: string): string {
  const prefix = 
    type === 'receive' || type === 'mint' ? '+' : 
    type === 'send' || type === 'burn' ? '-' : '';
  
  return `${prefix}${amount} ${symbol}`;
}


