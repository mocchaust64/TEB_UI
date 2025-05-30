/**
 * Định dạng địa chỉ mint để hiển thị
 * @param address Địa chỉ mint
 * @param length Số ký tự hiển thị ở mỗi đầu (mặc định là 4)
 * @returns Địa chỉ đã được định dạng
 */
export function formatMintAddress(address: string, length: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Định dạng số dư token
 * @param balance Số dư token
 * @param decimals Số chữ số thập phân
 * @returns Số dư đã được định dạng
 */
export function formatTokenBalance(balance: string | number, decimals: number = 0): string {
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  return numBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

/**
 * Định dạng địa chỉ rút gọn
 * @param address Địa chỉ cần định dạng
 * @param length Số ký tự hiển thị ở mỗi đầu (mặc định là 4)
 * @returns Địa chỉ đã được định dạng
 */
export function formatAddress(address: string, length: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Định dạng thời gian giao dịch thành dạng tương đối
 * @param timestamp Thời gian cần định dạng
 * @returns Chuỗi thời gian tương đối
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