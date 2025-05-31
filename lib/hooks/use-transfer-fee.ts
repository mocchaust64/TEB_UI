import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { 
  TOKEN_2022_PROGRAM_ID, 
  getAccount, 
  getTransferFeeAmount,
  createHarvestWithheldTokensToMintInstruction,
  createWithdrawWithheldTokensFromAccountsInstruction,
  createWithdrawWithheldTokensFromMintInstruction
} from '@solana/spl-token';
import { toast } from 'sonner';

export interface TransferFeeInfo {
  feeBasisPoints: number;
  maxFee: bigint;
  transferFeeConfigAuthority: PublicKey | null;
  withdrawWithheldAuthority: PublicKey | null;
  withheldAmount: bigint;
  olderTransferFee: boolean;
}

interface UseTransferFeeReturn {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  hasTransferFeeExtension: boolean;
  canWithdrawFees: boolean;
  accountsWithFees: PublicKey[];
  totalWithheldAmount: bigint;
  transactionSignature: string | null;
  transferFeeInfo: TransferFeeInfo | null;
  
  // Các hàm chức năng
  findAccountsWithFees: (mintAddress: string) => Promise<void>;
  harvestFeesToMint: (mintAddress: string, accounts: PublicKey[]) => Promise<void>;
  withdrawFeesFromAccounts: (mintAddress: string, accounts: PublicKey[], destination: string) => Promise<void>;
  withdrawFeesFromMint: (mintAddress: string, destination: string) => Promise<void>;
  getTokenAccountFeeInfo: (tokenAccount: string) => Promise<{withheldAmount: bigint; olderTransferFee: boolean} | null>;
  resetState: () => void;
}

/**
 * Hook để quản lý các chức năng liên quan đến transfer fee
 * @returns Các trạng thái và hàm xử lý transfer fee
 */
export function useTransferFee(): UseTransferFeeReturn {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTransferFeeExtension, setHasTransferFeeExtension] = useState(false);
  const [canWithdrawFees, setCanWithdrawFees] = useState(false);
  const [accountsWithFees, setAccountsWithFees] = useState<PublicKey[]>([]);
  const [totalWithheldAmount, setTotalWithheldAmount] = useState<bigint>(BigInt(0));
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [transferFeeInfo, setTransferFeeInfo] = useState<TransferFeeInfo | null>(null);
  
  // Reset state
  const resetState = useCallback(() => {
    setError(null);
    setTransactionSignature(null);
  }, []);
  
  // Tìm tất cả tài khoản có phí đã giữ lại
  const findAccountsWithFees = useCallback(async (mintAddress: string) => {
    if (!connection || !connected) {
      setError('Wallet not connected');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Khởi tạo mint public key
      const mintPubkey = new PublicKey(mintAddress);
      
      // Tìm tất cả các tài khoản token của mint này
      const accounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
        commitment: 'confirmed',
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: mintPubkey.toString(),
            },
          },
        ],
      });

      // Lọc các tài khoản có phí đã giữ lại
      const accountsWithWithheldFees: PublicKey[] = [];
      let totalAmount = BigInt(0);
      
      for (const { pubkey, account } of accounts) {
        try {
          const tokenAccount = await getAccount(
            connection,
            pubkey,
            'confirmed',
            TOKEN_2022_PROGRAM_ID
          );
          
          const feeInfo = getTransferFeeAmount(tokenAccount);
          if (feeInfo !== null && feeInfo.withheldAmount > 0) {
            accountsWithWithheldFees.push(pubkey);
            totalAmount += feeInfo.withheldAmount;
          }
        } catch (error) {
          // Bỏ qua tài khoản lỗi
        }
      }
      
      setAccountsWithFees(accountsWithWithheldFees);
      setTotalWithheldAmount(totalAmount);
      
      // Kiểm tra quyền rút phí (kiểm tra đơn giản - trong thực tế cần kiểm tra từ mint)
      if (publicKey && accountsWithWithheldFees.length > 0) {
        // Giả định người dùng có quyền rút phí nếu họ có thể tìm thấy tài khoản có phí
        // Trong thực tế, cần kiểm tra withdrawWithheldAuthority từ mint account
        setCanWithdrawFees(true);
      }
      
      // Đánh dấu token có extension
      setHasTransferFeeExtension(accountsWithWithheldFees.length > 0);
      
    } catch (error: any) {
      console.error('Error finding accounts with fees:', error);
      setError(error.message || 'Failed to find accounts with fees');
      setAccountsWithFees([]);
      setTotalWithheldAmount(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, [connection, connected, publicKey]);
  
  // Thu hoạch phí từ các tài khoản vào mint
  const harvestFeesToMint = useCallback(async (mintAddress: string, accounts: PublicKey[]) => {
    if (!connection || !connected || !publicKey) {
      setError('Wallet not connected');
      return;
    }
    
    if (accounts.length === 0) {
      setError('No accounts with fees to harvest');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setTransactionSignature(null);
    
    try {
      toast.loading('Harvesting fees to mint...');
      
      // Khởi tạo mint public key
      const mintPubkey = new PublicKey(mintAddress);
      
      // Tạo instruction harvest fees
      const instruction = createHarvestWithheldTokensToMintInstruction(
        mintPubkey,
        accounts,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Tạo và gửi transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction();
      transaction.add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Gửi transaction
      const signature = await wallet.sendTransaction(transaction, connection);
      
      // Chờ transaction hoàn thành
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature
      }, 'confirmed');
      
      setTransactionSignature(signature);
      
      // Cập nhật danh sách tài khoản có phí
      await findAccountsWithFees(mintAddress);
      
      toast.success('Fees harvested to mint successfully', {
        description: 'The withheld fees have been transferred to the mint account.',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      });
      
    } catch (error: any) {
      console.error('Error harvesting fees to mint:', error);
      setError(error.message || 'Failed to harvest fees to mint');
      
      toast.error('Failed to harvest fees', {
        description: error.message || 'An error occurred when harvesting fees to mint'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [connection, connected, publicKey, wallet, findAccountsWithFees]);
  
  // Rút phí từ các tài khoản token
  const withdrawFeesFromAccounts = useCallback(async (
    mintAddress: string, 
    accounts: PublicKey[], 
    destination: string
  ) => {
    if (!connection || !connected || !publicKey) {
      setError('Wallet not connected');
      return;
    }
    
    if (accounts.length === 0) {
      setError('No accounts with fees to withdraw');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setTransactionSignature(null);
    
    try {
      toast.loading('Withdrawing fees from accounts...');
      
      // Khởi tạo mint public key
      const mintPubkey = new PublicKey(mintAddress);
      const destinationPubkey = new PublicKey(destination);
      
      // Tạo instruction rút phí
      const instruction = createWithdrawWithheldTokensFromAccountsInstruction(
        mintPubkey,
        destinationPubkey,
        publicKey,
        [],
        accounts,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Tạo và gửi transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction();
      transaction.add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Gửi transaction
      const signature = await wallet.sendTransaction(transaction, connection);
      
      // Chờ transaction hoàn thành
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature
      }, 'confirmed');
      
      setTransactionSignature(signature);
      
      // Cập nhật danh sách tài khoản có phí
      await findAccountsWithFees(mintAddress);
      
      toast.success('Fees withdrawn successfully', {
        description: 'The withheld fees have been transferred to your account.',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      });
      
    } catch (error: any) {
      console.error('Error withdrawing fees from accounts:', error);
      setError(error.message || 'Failed to withdraw fees from accounts');
      
      toast.error('Failed to withdraw fees', {
        description: error.message || 'An error occurred when withdrawing fees from accounts'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [connection, connected, publicKey, wallet, findAccountsWithFees]);
  
  // Rút phí từ mint account
  const withdrawFeesFromMint = useCallback(async (mintAddress: string, destination: string) => {
    if (!connection || !connected || !publicKey) {
      setError('Wallet not connected');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setTransactionSignature(null);
    
    try {
      toast.loading('Withdrawing fees from mint...');
      
      // Khởi tạo mint public key
      const mintPubkey = new PublicKey(mintAddress);
      const destinationPubkey = new PublicKey(destination);
      
      // Tạo instruction rút phí từ mint
      const instruction = createWithdrawWithheldTokensFromMintInstruction(
        mintPubkey,
        destinationPubkey,
        publicKey,
        [],
        TOKEN_2022_PROGRAM_ID
      );
      
      // Tạo và gửi transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction();
      transaction.add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Gửi transaction
      const signature = await wallet.sendTransaction(transaction, connection);
      
      // Chờ transaction hoàn thành
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature
      }, 'confirmed');
      
      setTransactionSignature(signature);
      
      toast.success('Fees withdrawn from mint successfully', {
        description: 'The withheld fees have been transferred from the mint to your account.',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      });
      
    } catch (error: any) {
      console.error('Error withdrawing fees from mint:', error);
      setError(error.message || 'Failed to withdraw fees from mint');
      
      toast.error('Failed to withdraw fees from mint', {
        description: error.message || 'An error occurred when withdrawing fees from mint'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [connection, connected, publicKey, wallet]);
  
  // Lấy thông tin fee của một tài khoản token
  const getTokenAccountFeeInfo = useCallback(async (tokenAccount: string) => {
    if (!connection) {
      return null;
    }
    
    try {
      const accountInfo = await getAccount(
        connection,
        new PublicKey(tokenAccount),
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );
      
      const feeInfo = getTransferFeeAmount(accountInfo);
      if (!feeInfo) {
        return {
          withheldAmount: BigInt(0),
          olderTransferFee: false
        };
      }
      
      return {
        withheldAmount: feeInfo.withheldAmount,
        olderTransferFee: feeInfo.withheldAmount > BigInt(0)
      };
    } catch (error) {
      console.error('Error getting token account fee info:', error);
      return null;
    }
  }, [connection]);
  
  return {
    isLoading,
    isProcessing,
    error,
    hasTransferFeeExtension,
    canWithdrawFees,
    accountsWithFees,
    totalWithheldAmount,
    transactionSignature,
    transferFeeInfo,
    findAccountsWithFees,
    harvestFeesToMint,
    withdrawFeesFromAccounts,
    withdrawFeesFromMint,
    getTokenAccountFeeInfo,
    resetState
  };
} 