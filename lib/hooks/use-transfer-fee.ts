import { useState, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAccount } from '@solana/spl-token';
import { TransferFeeToken } from 'solana-token-extension-boost';
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
  
  // Kiểm tra điều kiện wallet đã kết nối
  const checkWalletConnected = useCallback(() => {
    if (!connection || !connected || !publicKey) {
      setError('Wallet not connected');
      return false;
    }
    return true;
  }, [connection, connected, publicKey]);
  
  // Tạo instance của TransferFeeToken
  const getTransferFeeToken = useCallback((mintAddress: string) => {
    const mintPubkey = new PublicKey(mintAddress);
    // Khởi tạo với thông tin cơ bản, các thông tin chi tiết sẽ được cập nhật sau
    return new TransferFeeToken(connection, mintPubkey, {
      feeBasisPoints: 0,
      maxFee: BigInt(0),
      transferFeeConfigAuthority: publicKey || new PublicKey(0),
      withdrawWithheldAuthority: publicKey || new PublicKey(0)
    });
  }, [connection, publicKey]);
  
  // Helper để gửi transaction với các instructions
  const sendInstructionWithWallet = useCallback(async (
    instruction: TransactionInstruction,
    loadingMessage: string,
    successMessage: string,
    errorMessage: string,
    afterSuccess?: () => Promise<void>
  ): Promise<string | null> => {
    if (!checkWalletConnected()) return null;
    
    // Kiểm tra publicKey một lần nữa để đảm bảo không phải null
    if (!publicKey) {
      setError('Wallet public key not available');
      return null;
    }
    
    setIsProcessing(true);
    setError(null);
    setTransactionSignature(null);
    
    try {
      toast.loading(loadingMessage);
      
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
      
      // Thực hiện hành động sau khi thành công (nếu có)
      if (afterSuccess) await afterSuccess();
      
      toast.success(successMessage, {
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      });
      
      return signature;
    } catch (error: any) {
      console.error(`Error: ${errorMessage}:`, error);
      setError(error.message || errorMessage);
      
      toast.error('Transaction failed', {
        description: error.message || errorMessage
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [connection, publicKey, wallet, checkWalletConnected]);
  
  // Tìm tất cả tài khoản có phí đã giữ lại
  const findAccountsWithFees = useCallback(async (mintAddress: string) => {
    if (!checkWalletConnected()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Sử dụng SDK để tìm tài khoản có phí
      const transferFeeToken = getTransferFeeToken(mintAddress);
      
      // Tìm tài khoản có phí
      const accountsWithWithheldFees = await transferFeeToken.findAccountsWithWithheldFees();
      
      // Tính tổng số phí đã giữ lại
      const totalAmount = await transferFeeToken.getTotalWithheldAmount(accountsWithWithheldFees);
      
      // Lấy thông tin cấu hình phí
      const feeConfig = transferFeeToken.getTransferFeeConfig();
      
      setAccountsWithFees(accountsWithWithheldFees);
      setTotalWithheldAmount(totalAmount);
      
      // Chuyển đổi feeConfig thành TransferFeeInfo
      setTransferFeeInfo({
        feeBasisPoints: feeConfig.feeBasisPoints,
        maxFee: feeConfig.maxFee,
        transferFeeConfigAuthority: feeConfig.transferFeeConfigAuthority instanceof PublicKey ? feeConfig.transferFeeConfigAuthority : null,
        withdrawWithheldAuthority: feeConfig.withdrawWithheldAuthority instanceof PublicKey ? feeConfig.withdrawWithheldAuthority : null,
        withheldAmount: totalAmount,
        olderTransferFee: false
      });
      
      // Kiểm tra quyền rút phí
      if (publicKey) {
        const canWithdraw = await transferFeeToken.isWithdrawWithheldAuthority(publicKey);
        setCanWithdrawFees(canWithdraw);
      }
      
      // Đánh dấu token có extension
      setHasTransferFeeExtension(true);
      
    } catch (error: any) {
      console.error('Error finding accounts with fees:', error);
      setError(error.message || 'Failed to find accounts with fees');
      setAccountsWithFees([]);
      setTotalWithheldAmount(BigInt(0));
      setHasTransferFeeExtension(false);
    } finally {
      setIsLoading(false);
    }
  }, [connection, connected, publicKey, getTransferFeeToken, checkWalletConnected]);
  
  // Thu hoạch phí từ các tài khoản vào mint
  const harvestFeesToMint = useCallback(async (mintAddress: string, accounts: PublicKey[]) => {
    if (!checkWalletConnected()) return;
    
    if (accounts.length === 0) {
      setError('No accounts with fees to harvest');
      return;
    }
    
    // Sử dụng SDK để thu hoạch phí
    const transferFeeToken = getTransferFeeToken(mintAddress);
    
    // Tạo instruction harvest fees
    const instruction = transferFeeToken.createHarvestWithheldTokensToMintInstruction(accounts);
    
    // Gửi transaction
    await sendInstructionWithWallet(
      instruction,
      'Harvesting fees to mint...',
      'Fees harvested to mint successfully',
      'Failed to harvest fees to mint',
      async () => await findAccountsWithFees(mintAddress) // Cập nhật danh sách tài khoản sau khi thành công
    );
    
  }, [checkWalletConnected, getTransferFeeToken, sendInstructionWithWallet, findAccountsWithFees]);
  
  // Rút phí từ các tài khoản token
  const withdrawFeesFromAccounts = useCallback(async (
    mintAddress: string, 
    accounts: PublicKey[], 
    destination: string
  ) => {
    if (!checkWalletConnected()) return;
    
    if (accounts.length === 0) {
      setError('No accounts with fees to withdraw');
      return;
    }
    
    // Sử dụng SDK để rút phí
    const transferFeeToken = getTransferFeeToken(mintAddress);
    const destinationPubkey = new PublicKey(destination);
    
    // Tạo instruction rút phí
    const instruction = transferFeeToken.createWithdrawFeesFromAccountsInstruction(
      accounts,
      destinationPubkey,
      publicKey!
    );
    
    // Mô tả thành công
    const successDescription = `The withheld fees have been transferred to ${destinationPubkey.toString().slice(0, 8)}...`;
    
    // Gửi transaction
    await sendInstructionWithWallet(
      instruction,
      'Withdrawing fees from accounts...',
      'Fees withdrawn from accounts successfully',
      'Failed to withdraw fees from accounts',
      async () => await findAccountsWithFees(mintAddress) // Cập nhật danh sách tài khoản sau khi thành công
    );
    
  }, [checkWalletConnected, getTransferFeeToken, sendInstructionWithWallet, findAccountsWithFees, publicKey]);
  
  // Rút phí từ mint
  const withdrawFeesFromMint = useCallback(async (
    mintAddress: string, 
    destination: string
  ) => {
    if (!checkWalletConnected()) return;
    
    // Sử dụng SDK để rút phí
    const transferFeeToken = getTransferFeeToken(mintAddress);
    const destinationPubkey = new PublicKey(destination);
    
    // Tạo instruction rút phí
    const instruction = transferFeeToken.createWithdrawFeesFromMintInstruction(
      destinationPubkey,
      publicKey!
    );
    
    // Mô tả thành công
    const successDescription = `The withheld fees have been transferred to ${destinationPubkey.toString().slice(0, 8)}...`;
    
    // Gửi transaction
    await sendInstructionWithWallet(
      instruction,
      'Withdrawing fees from mint...',
      'Fees withdrawn from mint successfully',
      'Failed to withdraw fees from mint',
      async () => await findAccountsWithFees(mintAddress) // Cập nhật danh sách tài khoản sau khi thành công
    );
    
  }, [checkWalletConnected, getTransferFeeToken, sendInstructionWithWallet, findAccountsWithFees, publicKey]);
  
  // Lấy thông tin phí của tài khoản token
  const getTokenAccountFeeInfo = useCallback(async (
    tokenAccount: string
  ): Promise<{withheldAmount: bigint; olderTransferFee: boolean} | null> => {
    if (!connection) return null;
    
    try {
      const tokenAccountPubkey = new PublicKey(tokenAccount);
      
      // Lấy thông tin mint từ tài khoản token
      const account = await getAccount(
        connection,
        tokenAccountPubkey,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );
      
      // Nếu không có mint, trả về null
      if (!account.mint) return null;
      
      // Sử dụng SDK để lấy thông tin phí
      const transferFeeToken = getTransferFeeToken(account.mint.toString());
      const feeInfo = await transferFeeToken.getAccountTransferFeeInfo(tokenAccountPubkey);
      
      return {
        withheldAmount: feeInfo.withheldAmount,
        olderTransferFee: feeInfo.hasOlderTransferFee
      };
    } catch (error) {
      console.error('Error getting token account fee info:', error);
      return null;
    }
  }, [connection, getTransferFeeToken]);
  
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