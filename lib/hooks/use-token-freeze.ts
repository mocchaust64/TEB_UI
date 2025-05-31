import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { freezeTokenAccount, thawTokenAccount } from '@/lib/services/token-service';
import { toast } from 'sonner';
import { checkFreezeAuthority } from '@/lib/utils/token-extensions';

interface UseTokenFreezeReturn {
  isProcessing: boolean;
  error: string | null;
  transactionSignature: string | null;
  freezeAccount: (tokenAccount: string, mintAddress: string) => Promise<void>;
  thawAccount: (tokenAccount: string, mintAddress: string) => Promise<void>;
  resetState: () => void;
}

/**
 * Hook để xử lý đóng băng và mở đóng băng tài khoản token
 * @returns Các trạng thái và hàm xử lý
 */
export function useTokenFreeze(): UseTokenFreezeReturn {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);

  // Reset state
  const resetState = useCallback(() => {
    setError(null);
    setTransactionSignature(null);
  }, []);

  // Hàm đóng băng tài khoản token
  const freezeAccount = useCallback(async (tokenAccount: string, mintAddress: string) => {
    if (!connection || !wallet.connected) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setTransactionSignature(null);

      // Show loading toast
      toast.loading('Freezing token account...');

      // Gọi hàm đóng băng tài khoản
      const signature = await freezeTokenAccount(
        connection,
        wallet,
        tokenAccount,
        mintAddress
      );

      // Cập nhật state
      setTransactionSignature(signature);
      setIsProcessing(false);

      // Show success toast
      toast.success('Token account frozen successfully', {
        description: 'The token account has been frozen and can no longer be used for transfers.',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      });
    } catch (err: any) {
      console.error('Error freezing token account:', err);
      setError(err.message || 'Failed to freeze token account');
      setIsProcessing(false);

      // Show error toast
      toast.error('Failed to freeze token account', {
        description: err.message || 'An error occurred when freezing the token account'
      });
    }
  }, [connection, wallet]);

  // Hàm mở đóng băng tài khoản token
  const thawAccount = useCallback(async (tokenAccount: string, mintAddress: string) => {
    if (!connection || !wallet.connected) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setTransactionSignature(null);

      // Show loading toast
      toast.loading('Thawing token account...');

      // Gọi hàm mở đóng băng tài khoản
      const signature = await thawTokenAccount(
        connection,
        wallet,
        tokenAccount,
        mintAddress
      );

      // Cập nhật state
      setTransactionSignature(signature);
      setIsProcessing(false);

      // Show success toast
      toast.success('Token account thawed successfully', {
        description: 'The token account has been thawed and can now be used for transfers.',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      });
    } catch (err: any) {
      console.error('Error thawing token account:', err);
      setError(err.message || 'Failed to thaw token account');
      setIsProcessing(false);

      // Show error toast
      toast.error('Failed to thaw token account', {
        description: err.message || 'An error occurred when thawing the token account'
      });
    }
  }, [connection, wallet]);

  return {
    isProcessing,
    error,
    transactionSignature,
    freezeAccount,
    thawAccount,
    resetState
  };
} 