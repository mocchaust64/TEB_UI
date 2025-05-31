import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { updateDefaultAccountState } from '@/lib/services/token-service';
import { toast } from 'sonner';
import { 
  getMint, 
  TOKEN_2022_PROGRAM_ID, 
  getExtensionData, 
  ExtensionType, 
  AccountState 
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { hasTokenExtension } from '@/lib/utils/token-extensions';

interface UseDefaultAccountStateReturn {
  isProcessing: boolean;
  error: string | null;
  transactionSignature: string | null;
  defaultState: number | null;
  isLoading: boolean;
  hasDefaultAccountStateExtension: boolean;
  canUpdateState: boolean;
  updateState: (mintAddress: string, state: number) => Promise<void>;
  fetchDefaultState: (mintAddress: string) => Promise<void>;
  resetState: () => void;
}

/**
 * Hook để quản lý trạng thái mặc định của token (DefaultAccountState)
 * @returns Các trạng thái và hàm xử lý
 */
export function useDefaultAccountState(): UseDefaultAccountStateReturn {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [defaultState, setDefaultState] = useState<number | null>(null);
  const [hasDefaultAccountStateExtension, setHasDefaultAccountStateExtension] = useState(false);
  const [canUpdateState, setCanUpdateState] = useState(false);

  // Reset state
  const resetState = useCallback(() => {
    setError(null);
    setTransactionSignature(null);
  }, []);

  // Lấy trạng thái mặc định hiện tại của token
  const fetchDefaultState = useCallback(async (mintAddress: string) => {
    if (!connection) {
      setError('Connection not available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setHasDefaultAccountStateExtension(false);
      setCanUpdateState(false);

      const mintPubkey = new PublicKey(mintAddress);
      
      // Kiểm tra xem token có phải là Token-2022 không
      const accountInfo = await connection.getAccountInfo(mintPubkey);
      if (!accountInfo || !accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        // Không phải token-2022, không thể có DefaultAccountState
        setDefaultState(null);
        setIsLoading(false);
        return;
      }

      // Lấy thông tin mint từ Token-2022 program
      const mintInfo = await getMint(
        connection,
        mintPubkey,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );

      // Kiểm tra quyền freeze
      const hasAuthority = wallet.publicKey && 
        mintInfo.freezeAuthority && 
        mintInfo.freezeAuthority.equals(wallet.publicKey);
      
      setCanUpdateState(!!hasAuthority);

      // Kiểm tra DefaultAccountState extension bằng cách sử dụng hàm tiện ích
      const hasDefaultStateExtension = await hasTokenExtension(
        connection,
        mintAddress,
        ExtensionType.DefaultAccountState
      );

      setHasDefaultAccountStateExtension(hasDefaultStateExtension);

      if (hasDefaultStateExtension) {
        try {
          // Lấy dữ liệu của extension
          const extensionData = getExtensionData(
            ExtensionType.DefaultAccountState, 
            mintInfo.tlvData
          );
          
          if (extensionData) {
            // Lấy byte đầu tiên từ extensionData là trạng thái mặc định
            // 0 = Initialized, 1 = Frozen
            const state = extensionData[0];
            setDefaultState(state);
            console.log("Found DefaultAccountState extension:", state);
          } else {
            setDefaultState(null);
            console.log("DefaultAccountState extension data not available");
          }
        } catch (extErr) {
          console.error("Error parsing DefaultAccountState extension data:", extErr);
          setDefaultState(null);
        }
      } else {
        console.log("No DefaultAccountState extension found for this token");
        setDefaultState(null);
      }
    } catch (err: any) {
      console.error('Error fetching default account state:', err);
      setError(err.message || 'Failed to fetch default account state');
      setDefaultState(null);
      setHasDefaultAccountStateExtension(false);
      setCanUpdateState(false);
    } finally {
      setIsLoading(false);
    }
  }, [connection, wallet.publicKey]);

  // Cập nhật trạng thái mặc định của token
  const updateState = useCallback(async (mintAddress: string, state: number) => {
    if (!connection || !wallet.connected) {
      setError('Wallet not connected');
      return;
    }

    if (!canUpdateState) {
      setError('You do not have permission to update the default account state');
      toast.error('Permission denied', {
        description: 'You do not have the authority to update the default account state'
      });
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setTransactionSignature(null);

      // Hiển thị thông báo đang xử lý
      toast.loading(`${state === 1 ? 'Enabling' : 'Disabling'} default freeze state...`);

      // Gọi hàm cập nhật trạng thái mặc định
      const signature = await updateDefaultAccountState(
        connection,
        wallet,
        mintAddress,
        state
      );

      // Cập nhật state
      setTransactionSignature(signature);
      setDefaultState(state);
      setIsProcessing(false);

      // Hiển thị thông báo thành công
      toast.success(`Default account state ${state === 1 ? 'enabled' : 'disabled'} successfully`, {
        description: state === 1 
          ? 'New token accounts will be created in frozen state by default'
          : 'New token accounts will be created in initialized state by default',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      });
    } catch (err: any) {
      console.error('Error updating default account state:', err);
      setError(err.message || 'Failed to update default account state');
      setIsProcessing(false);

      // Hiển thị thông báo lỗi
      toast.error('Failed to update default account state', {
        description: err.message || 'An error occurred when updating the default account state'
      });
    }
  }, [connection, wallet, canUpdateState]);

  return {
    isProcessing,
    error,
    transactionSignature,
    defaultState,
    isLoading,
    hasDefaultAccountStateExtension,
    canUpdateState,
    updateState,
    fetchDefaultState,
    resetState
  };
} 