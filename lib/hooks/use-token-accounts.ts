import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TokenAccountInfo } from '@/lib/types/token-types';
import { checkFreezeAuthority } from '@/lib/utils/token-extensions';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
import { TOKEN_2022_PROGRAM_ID, getAccount } from '@solana/spl-token';

interface UseTokenAccountsReturn {
  accounts: TokenAccountInfo[];
  isLoading: boolean;
  error: string | null;
  hasFreezeAuthority: boolean;
  refreshAccounts: (mintAddress: string, decimals: number) => Promise<void>;
}

/**
 * Hook để lấy danh sách tài khoản token của một mint
 * @param initialMintAddress - Địa chỉ mint ban đầu (có thể là null)
 * @param initialDecimals - Số thập phân của token
 * @returns Các giá trị và hàm liên quan đến tài khoản token
 */
export function useTokenAccounts(
  initialMintAddress: string | null = null,
  initialDecimals: number = 9
): UseTokenAccountsReturn {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [accounts, setAccounts] = useState<TokenAccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFreezeAuthority, setHasFreezeAuthority] = useState(false);

  // Hàm để tải danh sách tài khoản token
  const refreshAccounts = useCallback(async (mintAddress: string, decimals: number) => {
    if (!connection || !mintAddress) {
      setAccounts([]);
      setError('Invalid mint address or connection');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Kiểm tra xem người dùng có quyền đóng băng token không
      if (connected && publicKey) {
        const hasAuthority = await checkFreezeAuthority(
          connection,
          mintAddress,
          publicKey.toString()
        );
        setHasFreezeAuthority(hasAuthority);
      } else {
        setHasFreezeAuthority(false);
      }

      // Hiện tại không cần lấy danh sách tài khoản token vì UI đã được thay đổi
      // để người dùng nhập địa chỉ ví và tính toán token account
      setAccounts([]);
    } catch (err: any) {
      console.error('Error checking freeze authority:', err);
      setError(err.message || 'Failed to check freeze authority');
      toast.error('Failed to check freeze authority', {
        description: err.message || 'An error occurred while checking freeze authority'
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, connected, publicKey]);

  // Tải dữ liệu khi component mount hoặc khi các dependencies thay đổi
  useEffect(() => {
    if (initialMintAddress && connection && connected) {
      refreshAccounts(initialMintAddress, initialDecimals);
    }
  }, [initialMintAddress, initialDecimals, connection, connected, refreshAccounts]);

  return {
    accounts,
    isLoading,
    error,
    hasFreezeAuthority,
    refreshAccounts
  };
} 