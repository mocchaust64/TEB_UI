import { TokenBuilder ,TransferFeeToken, Token} from "solana-token-extension-boost";
import { Connection, PublicKey, Commitment, ConnectionConfig, Transaction } from "@solana/web3.js";
import { pinJSONToIPFS, pinFileToIPFS, ipfsToHTTP, pinImageFromBase64 } from "@/lib/utils/pinata";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { 
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { getUserTokens, TokenItem } from "./tokenList";
import { getUserTransactions, TransactionItem } from "./transaction-service";
import { saveTokensToCache } from "../utils/token-cache";
import { toast } from "sonner";


// Interface cho token data
export interface TokenData {
  name: string;
  symbol: string;
  decimals: string | number;
  supply: string | number;
  description?: string;
  imageBase64?: string | null;
  imageUrl?: string | null;
  extensionOptions?: Record<string, any>;
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
}

// Interface cho extension config
export interface ExtensionConfig {
  id: string;
  options?: Record<string, any>;
}

// Interface cho kết quả tạo token
export interface TokenCreationResult {
  mint: string;
  signature: string;
  metadataUri: string;
}

/**
 * Tạo token với metadata và các extensions
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param tokenData Token data
 * @param selectedExtensions Selected extensions
 * @returns Token creation result
 */
export async function createToken(
  connection: Connection,
  wallet: WalletContextState,
  tokenData: TokenData,
  selectedExtensions: string[]
): Promise<TokenCreationResult> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }
  
  // BƯỚC 1: Xử lý thông tin ảnh (đã có URL hoặc base64)
  let imageUri = "";
  let imageHttpUrl = "";

  // Ưu tiên sử dụng URL ảnh đã có sẵn
  if (tokenData.imageUrl) {
    imageHttpUrl = tokenData.imageUrl;
    
    // Kiểm tra xem URL đã có http(s):// chưa
    if (!imageHttpUrl.startsWith('http')) {
      // Nếu là ipfs:// URI, chuyển đổi thành HTTP URL
      if (imageHttpUrl.startsWith('ipfs://')) {
        imageHttpUrl = ipfsToHTTP(imageHttpUrl);
      } else {
        // Nếu chỉ là IPFS hash, thêm gateway prefix
        imageHttpUrl = `https://gateway.pinata.cloud/ipfs/${imageHttpUrl}`;
      }
    }
  } 
  // Xử lý tải lên ảnh base64 (hỗ trợ ngược)
  else if (tokenData.imageBase64) {
    try {
      // Kiểm tra và xử lý base64 image
      let base64Data = tokenData.imageBase64;
      
      // Đảm bảo dữ liệu base64 hợp lệ
      if (!base64Data.startsWith('data:image')) {
        base64Data = `data:image/png;base64,${base64Data}`;
      }
      
      try {
        imageUri = await pinImageFromBase64(base64Data);
        
        // Chuyển IPFS URI sang HTTP URL
        imageHttpUrl = ipfsToHTTP(imageUri);
        
        // Xác minh URL hợp lệ
        if (!imageUri || !imageHttpUrl || imageHttpUrl.trim() === '') {
          throw new Error("Failed to get valid image URI after upload");
        }
      } catch (uploadError) {
        // Thử tải lại với cách khác nếu thất bại
        // Xử lý dữ liệu base64 trực tiếp
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }
        
        imageUri = await pinFileToIPFS(base64Data, `${tokenData.name.toLowerCase()}-image`);
        
        // Chuyển từ IPFS URI sang HTTP URL
        imageHttpUrl = ipfsToHTTP(imageUri);
      }
    } catch (error) {
      imageHttpUrl = "";
    }
  }
  
  // BƯỚC 2: Tạo metadata đầy đủ (offchain) cho IPFS theo chuẩn Metaplex
  // Tạo metadata theo đúng chuẩn Metaplex Fungible Asset Standard
  const metadataBase: Record<string, any> = {
    name: tokenData.name,
    symbol: tokenData.symbol,
    description: tokenData.description || "",
    // Các trường bắt buộc theo chuẩn Metaplex
    seller_fee_basis_points: 0,
    attributes: [
      { trait_type: "Decimals", value: tokenData.decimals },
      { trait_type: "Supply", value: tokenData.supply }
    ]
  };

  // Chỉ thêm các trường hình ảnh nếu có URL hợp lệ
  if (imageHttpUrl && imageHttpUrl.trim() !== '') {
    // Trường image chính là URL HTTP đầy đủ
    metadataBase.image = imageHttpUrl;
    
    // Thêm files trong properties theo chuẩn Metaplex
    metadataBase.properties = {
      files: [
        {
          uri: imageHttpUrl,
          type: "image/png"
        }
      ],
      category: "image",
      creators: [
        {
          address: wallet.publicKey.toString(),
          share: 100
        }
      ]
    };
  } else {
    // Vẫn thêm properties với creators ngay cả khi không có ảnh
    metadataBase.properties = {
      category: "image",
      creators: [
        {
          address: wallet.publicKey.toString(),
          share: 100
        }
      ]
    };
  }

  // Thêm collection nếu token là một phần của collection
  metadataBase.collection = {
    name: tokenData.name,
    family: "Token-2022"
  };

  // Chỉ thêm external_url nếu có
  if (tokenData.websiteUrl && tokenData.websiteUrl.trim() !== '') {
    metadataBase.external_url = tokenData.websiteUrl;
  }

  // Sử dụng metadataBase trực tiếp
  const offchainMetadata = metadataBase;
  
  // BƯỚC 3: Tải metadata lên IPFS (tái sử dụng pinata.ts)
  let metadataUri: string;
  try {
    // Tải lên IPFS và nhận URI (thường là ipfs://)
    const ipfsUri = await pinJSONToIPFS(offchainMetadata);
    
    // Chuyển đổi từ ipfs:// sang URL HTTP đầy đủ
    metadataUri = ipfsToHTTP(ipfsUri);
  } catch (error) {
    // Đảm bảo sử dụng URL HTTP ngay cả với fallback
    metadataUri = `https://arweave.net/${tokenData.name.toLowerCase()}-${tokenData.symbol.toLowerCase()}`;
  }

  // BƯỚC 4: Tạo kết nối đã cấu hình
  const connectionConfig: ConnectionConfig = {
    commitment: 'confirmed' as Commitment,
    confirmTransactionInitialTimeout: 60000
  };
  
  const enhancedConnection = new Connection(
    connection.rpcEndpoint, 
    connectionConfig
  );
  
  // BƯỚC 5: Tạo metadata đơn giản (onchain) cho SDK
  // Tạo cấu trúc additionalMetadata đúng chuẩn (record key-value)
  const additionalMetadata: Record<string, string> = {};
  
  if (tokenData.description) additionalMetadata["description"] = tokenData.description;
  if (tokenData.websiteUrl) additionalMetadata["website"] = tokenData.websiteUrl;
  if (tokenData.twitterUrl) additionalMetadata["twitter"] = tokenData.twitterUrl;
  if (tokenData.telegramUrl) additionalMetadata["telegram"] = tokenData.telegramUrl;
  if (tokenData.discordUrl) additionalMetadata["discord"] = tokenData.discordUrl;
  
  // BƯỚC 6: Tính toán số lượng token để mint (chuẩn bị sẵn)
  const decimals = typeof tokenData.decimals === 'string' ? 
    parseInt(tokenData.decimals) : tokenData.decimals;
  
  const supplyAmount = typeof tokenData.supply === 'string' ? 
    parseFloat(tokenData.supply) : tokenData.supply;
    
  // Tính toán số lượng token với decimals
  const mintAmount = BigInt(Math.floor(supplyAmount * Math.pow(10, decimals)));
  
  // BƯỚC 7: Sử dụng TokenBuilder với metadata đúng chuẩn
  const tokenBuilder = new TokenBuilder(enhancedConnection)
    .setTokenInfo(
      decimals,
      wallet.publicKey  // Mint authority
    )
    .addTokenMetadata(
      tokenData.name,
      tokenData.symbol,
      metadataUri,
      additionalMetadata
    );
  
  // BƯỚC 8: Thêm các extensions theo cấu hình
  for (const extensionId of selectedExtensions) {
    // Bỏ qua metadata vì đã được thêm
    if (extensionId === "metadata" || extensionId === "metadata-pointer") continue;
    
    if (extensionId === "transfer-fees" && tokenData.extensionOptions?.["transfer-fees"]) {
      const feePercentage = parseFloat(tokenData.extensionOptions["transfer-fees"]["fee-percentage"] || "1");
      const feeBasisPoints = feePercentage * 100; // Chuyển đổi % thành basis points
      
      // Lấy maxFee từ input người dùng hoặc sử dụng giá trị mặc định
      let maxFeeValue: bigint;
      
      if (tokenData.extensionOptions["transfer-fees"]["max-fee"]) {
        // Lấy giá trị từ input
        const maxFeeInput = tokenData.extensionOptions["transfer-fees"]["max-fee"];
        
        // Chuyển đổi thành số thực
        const maxFeeAmount = parseFloat(maxFeeInput);
        
        // Chuyển đổi thành lamports dựa trên decimals
        maxFeeValue = BigInt(Math.floor(maxFeeAmount * Math.pow(10, decimals)));
      } else {
        // Giá trị mặc định: 1 token
        maxFeeValue = BigInt(Math.pow(10, decimals));
      }
      
      tokenBuilder.addTransferFee(
        feeBasisPoints,
        maxFeeValue,
        wallet.publicKey,
        wallet.publicKey
      );
    } 
    else if (extensionId === "non-transferable") {
      tokenBuilder.addNonTransferable();
    }
    else if (extensionId === "permanent-delegate" && tokenData.extensionOptions?.["permanent-delegate"]) {
      const delegateAddress = new PublicKey(tokenData.extensionOptions["permanent-delegate"]["delegate-address"] || wallet.publicKey.toString());
      tokenBuilder.addPermanentDelegate(delegateAddress);
    }
    else if (extensionId === "interest-bearing" && tokenData.extensionOptions?.["interest-bearing"]) {
      const rate = parseFloat(tokenData.extensionOptions["interest-bearing"]["interest-rate"] || "5");
      tokenBuilder.addInterestBearing(rate * 100, wallet.publicKey);
    }
    else if (extensionId === "mint-close-authority" && tokenData.extensionOptions?.["mint-close-authority"]) {
      const closeAuthorityAddress = new PublicKey(tokenData.extensionOptions["mint-close-authority"]["close-authority"] || wallet.publicKey.toString());
      tokenBuilder.addMintCloseAuthority(closeAuthorityAddress);
    }
    else if (extensionId === "default-account-state") {
      // Thêm xử lý cho DefaultAccountState extension
      // Lấy giá trị từ options nếu có, mặc định là Initialized (0)
      const defaultState = tokenData.extensionOptions?.["default-account-state"]?.["state"] === "frozen" ? 1 : 0;
      
      // Lấy freeze authority nếu có, mặc định là ví người dùng
      const freezeAuthority = tokenData.extensionOptions?.["default-account-state"]?.["freeze-authority"] 
        ? new PublicKey(tokenData.extensionOptions["default-account-state"]["freeze-authority"])
        : wallet.publicKey;
      
      // Truyền cả state và freezeAuthority vào addDefaultAccountState
      tokenBuilder.addDefaultAccountState(defaultState, freezeAuthority);
    }
    // Có thể thêm các extension khác ở đây
  }
  
  // BƯỚC 8.1: Lấy token creation instructions
  const { instructions: createInstructions, signers, mint } = 
    await tokenBuilder.createTokenInstructions(wallet.publicKey);
  
  // BƯỚC 8.2: Xác định token program dựa trên extensions
  const realExtensions = selectedExtensions.filter(ext => 
    ext !== "metadata" && ext !== "metadata-pointer"
  );
  
  const useToken2022 = realExtensions.length > 0;
  const tokenProgramId = useToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  
  // BƯỚC 8.3: Tạo mintTo instructions
  // Khởi tạo đối tượng TransferFeeToken để tạo instructions cho mint
  
  // Tính toán feeBasisPoints và maxFeeValue
  let feeBasisPoints = 0;
  let maxFeeValue = BigInt(0);
  
  if (selectedExtensions.includes("transfer-fees") && tokenData.extensionOptions?.["transfer-fees"]) {
    // Lấy feeBasisPoints
    const feePercentage = parseFloat(tokenData.extensionOptions["transfer-fees"]["fee-percentage"] || "1");
    feeBasisPoints = feePercentage * 100;
    
    // Lấy maxFee
    if (tokenData.extensionOptions["transfer-fees"]["max-fee"]) {
      const maxFeeInput = tokenData.extensionOptions["transfer-fees"]["max-fee"];
      const maxFeeAmount = parseFloat(maxFeeInput);
      maxFeeValue = BigInt(Math.floor(maxFeeAmount * Math.pow(10, decimals)));
    } else {
      maxFeeValue = BigInt(Math.pow(10, decimals)); // Mặc định: 1 token
    }
  }
  
  const token = new TransferFeeToken(
    connection, 
    mint,
    {
      feeBasisPoints: feeBasisPoints,
      maxFee: maxFeeValue,
      transferFeeConfigAuthority: wallet.publicKey,
      withdrawWithheldAuthority: wallet.publicKey
    }
  );
  
  // Lấy instructions để tạo account và mint
  const { instructions: mintInstructions, address: tokenAccount } = 
    await token.createAccountAndMintToInstructions(
      wallet.publicKey, // owner
      wallet.publicKey, // payer
      mintAmount,       // amount
      wallet.publicKey  // mintAuthority
    );
  
  // BƯỚC 9: Tạo và gửi transaction tổng hợp
  const combinedTransaction = new Transaction();
  
  // Lấy blockhash mới
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  combinedTransaction.recentBlockhash = blockhash;
  combinedTransaction.feePayer = wallet.publicKey;
  
  // Thêm tất cả các instructions theo thứ tự
  // 1. Đầu tiên là các instructions để tạo token
  createInstructions.forEach(ix => combinedTransaction.add(ix));
  
  // 2. Tiếp theo là các instructions để tạo account và mint
  mintInstructions.forEach(ix => combinedTransaction.add(ix));
  
  // Thêm các signers (nếu có)
  if (signers.length > 0) {
    combinedTransaction.partialSign(...signers);
  }
  
  // Kiểm tra kích thước transaction để đảm bảo không vượt quá giới hạn
  const serializedTx = combinedTransaction.serialize({requireAllSignatures: false});
  const txSize = serializedTx.length;
  
  // Giới hạn kích thước của transaction Solana là khoảng 1232 bytes
  const TX_SIZE_LIMIT = 1232;
  
  if (txSize > TX_SIZE_LIMIT) {
    // BƯỚC 9.1: Gửi transaction tạo token
    const createTransaction = new Transaction();
    createTransaction.recentBlockhash = blockhash;
    createTransaction.feePayer = wallet.publicKey;
    createInstructions.forEach(ix => createTransaction.add(ix));
    
    if (signers.length > 0) {
      createTransaction.partialSign(...signers);
    }
    
    try {
      const transactionSignature = await wallet.sendTransaction(
        createTransaction,
        connection,
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );
      
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: transactionSignature
      });
      
      // BƯỚC 9.2: Đợi một chút rồi gửi transaction mintTo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Tạo và gửi mintTo transaction như đã làm trước đó
      const mintTransaction = new Transaction();
      mintTransaction.recentBlockhash = blockhash;
      mintTransaction.feePayer = wallet.publicKey;
      mintInstructions.forEach(ix => mintTransaction.add(ix));
      
      const mintToSignature = await wallet.sendTransaction(
        mintTransaction,
        connection,
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );
      
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: mintToSignature
      }, 'confirmed');
      
      return {
        mint: mint.toString(),
        signature: transactionSignature,
        metadataUri: metadataUri
      };
    } catch (error: any) {
      console.error("Error during token creation or minting:", error);
      if (error.logs) {
        console.error("Error logs:", error.logs);
      }
      throw error;
    }
  } else {
    // Kích thước transaction không vượt quá giới hạn, gửi transaction tổng hợp
    try {
      const signature = await wallet.sendTransaction(
        combinedTransaction,
        connection,
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );
      
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature
      }, 'confirmed');
      
      return {
        mint: mint.toString(),
        signature: signature,
        metadataUri: metadataUri
      };
    } catch (error: any) {
      console.error("Error during transaction:", error);
      
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
      
      try {
        const retrySignature = await wallet.sendTransaction(
          combinedTransaction,
          connection,
          { skipPreflight: true, preflightCommitment: 'confirmed' }
        );
        
        await connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature: retrySignature
        }, 'confirmed');
        
        return {
          mint: mint.toString(),
          signature: retrySignature,
          metadataUri: metadataUri
        };
      } catch (retryError: any) {
        console.error("Retry also failed:", retryError);
        
        // Nếu giao dịch kết hợp thất bại, thử lại với 2 giao dịch riêng biệt
        throw new Error("Combined transaction failed. Please try again with separate transactions.");
      }
    }
  }
}

interface FetchTokensOptions {
  forceRefresh?: boolean;
  onStart?: () => void;
  onSuccess?: (tokens: TokenItem[], totalValue: string) => void;
  onError?: (error: Error) => void;
  onFinish?: () => void;
}

/**
 * Hàm fetch token từ blockchain
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param options Các tùy chọn
 * @returns Danh sách tokens hoặc null nếu có lỗi
 */
export const fetchTokensFromBlockchain = async (
  connection: Connection, 
  wallet: WalletContextState,
  options: FetchTokensOptions = {}
): Promise<TokenItem[] | null> => {
  const { forceRefresh = false, onStart, onSuccess, onError, onFinish } = options;
  const { publicKey } = wallet;
  
  if (!publicKey || !connection) return null;
  
  try {
    if (onStart) onStart();
    
    // Fetch tokens from blockchain
    const userTokens = await getUserTokens(connection, wallet);
    
    // Sort tokens by balance (largest first)
    userTokens.sort((a, b) => {
      const balanceA = parseFloat(a.balance) || 0;
      const balanceB = parseFloat(b.balance) || 0;
      return balanceB - balanceA;
    });
    
    // Calculate total value (if price data is available)
    const total = userTokens.reduce((acc, token) => {
      if (token.price) {
        const price = parseFloat(token.price.replace('$', '')) || 0;
        const balance = parseFloat(token.balance) || 0;
        return acc + (price * balance);
      }
      return acc;
    }, 0);
    
    const formattedTotal = total.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 2
    });
    
    // Cache the fetched data
    saveTokensToCache(userTokens, formattedTotal, publicKey.toString());
    
    if (onSuccess) onSuccess(userTokens, formattedTotal);
    
    return userTokens;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    if (onError && error instanceof Error) onError(error);
    toast.error("Failed to fetch token data");
    return null;
  } finally {
    if (onFinish) onFinish();
  }
};

interface FetchTransactionsOptions {
  limit?: number;
  onStart?: () => void;
  onSuccess?: (transactions: TransactionItem[]) => void;
  onError?: (error: Error) => void;
  onFinish?: () => void;
}

/**
 * Hàm lấy dữ liệu giao dịch gần đây từ blockchain
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param options Các tùy chọn
 * @returns Danh sách giao dịch hoặc mảng rỗng nếu có lỗi
 */
export const fetchRecentTransactions = async (
  connection: Connection,
  wallet: WalletContextState,
  options: FetchTransactionsOptions = {}
): Promise<TransactionItem[]> => {
  const { limit = 15, onStart, onSuccess, onError, onFinish } = options;
  const { publicKey } = wallet;
  
  if (!publicKey || !connection) return [];
  
  try {
    if (onStart) onStart();
    
    // Gọi service để lấy dữ liệu giao dịch thật từ blockchain
    const transactionData = await getUserTransactions(connection, wallet, limit);
    
    if (onSuccess) onSuccess(transactionData);
    
    return transactionData;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    if (onError && error instanceof Error) onError(error);
    toast.error("Failed to load recent transactions");
    return [];
  } finally {
    if (onFinish) onFinish();
  }
};

/**
 * Mint thêm token vào lượng cung lưu hành
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param mintAddress Địa chỉ mint của token
 * @param amount Số lượng token muốn mint (số thực)
 * @param decimals Số chữ số thập phân của token
 * @returns Chữ ký giao dịch
 */
export async function mintToken(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: string,
  amount: string | number,
  decimals: number,
  recipientAddress?: string
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }
  
  // Chuyển đổi địa chỉ mint thành PublicKey
  const mintPublicKey = new PublicKey(mintAddress);
  
  // Tính toán số lượng token để mint với decimals
  const amountValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  const mintAmount = BigInt(Math.floor(amountValue * Math.pow(10, decimals)));
  
  // Kiểm tra xem token có phải là token-2022 không
  const mintInfo = await connection.getAccountInfo(mintPublicKey);
  if (!mintInfo) {
    throw new Error("Token mint not found");
  }
  
  const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
  
  // Xác định địa chỉ người nhận
  const recipient = recipientAddress 
    ? new PublicKey(recipientAddress)
    : wallet.publicKey;
  
  // Kiểm tra các extension của token và khởi tạo đúng loại token
  try {
    // Nếu là token-2022 với TransferFee
    // Sử dụng TransferFeeToken để tạo instructions
    const transferFeeConfig = {
      feeBasisPoints: 0, // Giá trị mặc định, sẽ không ảnh hưởng nếu token không có transfer fee
      maxFee: BigInt(0),
      transferFeeConfigAuthority: wallet.publicKey,
      withdrawWithheldAuthority: wallet.publicKey
    };
    
    const token = new TransferFeeToken(
      connection,
      mintPublicKey,
      transferFeeConfig
    );
    
    // Tạo instructions để mint token
    const { instructions, address: tokenAccount } = await token.createAccountAndMintToInstructions(
      recipient,            // owner của token account (người nhận)
      wallet.publicKey,     // payer (người trả phí)
      mintAmount,           // số lượng token
      wallet.publicKey      // mint authority
    );
    
    // Tạo và gửi transaction
    const transaction = new Transaction();
    
    // Lấy blockhash mới
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Thêm các instructions
    instructions.forEach(ix => transaction.add(ix));
    
    // Gửi transaction
    const signature = await wallet.sendTransaction(
      transaction,
      connection,
      { skipPreflight: false, preflightCommitment: 'confirmed' }
    );
    
    // Chờ transaction hoàn thành
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error("Error minting token:", error);
    throw error;
  }
}

/**
 * Đốt token (burn)
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param mintAddress Địa chỉ mint của token
 * @param amount Số lượng token muốn đốt (số thực)
 * @param decimals Số chữ số thập phân của token
 * @returns Chữ ký giao dịch
 */
export async function burnToken(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: string,
  amount: string | number,
  decimals: number
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }
  
  // Chuyển đổi địa chỉ mint thành PublicKey
  const mintPublicKey = new PublicKey(mintAddress);
  
  // Tính toán số lượng token để burn với decimals
  const amountValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  const burnAmount = BigInt(Math.floor(amountValue * Math.pow(10, decimals)));
  
  // Kiểm tra xem token có phải là token-2022 không
  const mintInfo = await connection.getAccountInfo(mintPublicKey);
  if (!mintInfo) {
    throw new Error("Token mint not found");
  }
  
  const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
  const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  
  try {
    // Lấy token account của người dùng
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      wallet.publicKey,
      { mint: mintPublicKey }
    );
    
    // Kiểm tra xem có token account không
    if (tokenAccounts.value.length === 0) {
      throw new Error("Không tìm thấy token account cho token này");
    }
    
    // Chọn token account đầu tiên
    const tokenAccount = tokenAccounts.value[0].pubkey;
    
    // Sử dụng Token để tạo instructions burn
    const token = new Token(connection, mintPublicKey);
    
    // Tạo instruction để burn token
    const { instructions } = token.createBurnInstructions(
      tokenAccount,         // token account để burn
      wallet.publicKey,     // authority
      burnAmount,           // số lượng token
      decimals              // số chữ số thập phân
    );
    
    // Tạo và gửi transaction
    const transaction = new Transaction();
    
    // Lấy blockhash mới
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Thêm các instructions
    instructions.forEach(ix => transaction.add(ix));
    
    // Gửi transaction
    const signature = await wallet.sendTransaction(
      transaction,
      connection,
      { skipPreflight: false, preflightCommitment: 'confirmed' }
    );
    
    // Chờ transaction hoàn thành
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error("Error burning token:", error);
    throw error;
  }
}

/**
 * Đóng băng tài khoản token
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param tokenAccount Địa chỉ tài khoản token cần đóng băng
 * @param mintAddress Địa chỉ mint của token
 * @returns Signature của giao dịch
 */
export async function freezeTokenAccount(
  connection: Connection,
  wallet: WalletContextState,
  tokenAccount: string,
  mintAddress: string
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    // Sử dụng TokenFreezeExtension từ solana-token-extension-boost
    const { TokenFreezeExtension } = await import("solana-token-extension-boost");
    
    // Tạo transaction đóng băng tài khoản token
    const transaction = TokenFreezeExtension.prepareFreezeAccountTransaction(
      new PublicKey(tokenAccount),
      new PublicKey(mintAddress),
      wallet.publicKey,
      wallet.publicKey
    );
    
    // Lấy blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    
    // Gửi và xác nhận transaction
    const signature = await wallet.sendTransaction(
      transaction,
      connection,
      { skipPreflight: false }
    );
    
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error("Error freezing token account:", error);
    throw error;
  }
}

/**
 * Mở đóng băng tài khoản token
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param tokenAccount Địa chỉ tài khoản token cần mở đóng băng
 * @param mintAddress Địa chỉ mint của token
 * @returns Signature của giao dịch
 */
export async function thawTokenAccount(
  connection: Connection,
  wallet: WalletContextState,
  tokenAccount: string,
  mintAddress: string
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    // Sử dụng TokenFreezeExtension từ solana-token-extension-boost
    const { TokenFreezeExtension } = await import("solana-token-extension-boost");
    
    // Tạo transaction mở đóng băng tài khoản token
    const transaction = TokenFreezeExtension.prepareThawAccountTransaction(
      new PublicKey(tokenAccount),
      new PublicKey(mintAddress),
      wallet.publicKey,
      wallet.publicKey
    );
    
    // Lấy blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    
    // Gửi và xác nhận transaction
    const signature = await wallet.sendTransaction(
      transaction,
      connection,
      { skipPreflight: false }
    );
    
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error("Error thawing token account:", error);
    throw error;
  }
}

/**
 * Cập nhật trạng thái mặc định của token (DefaultAccountState)
 * @param connection Solana connection
 * @param wallet Wallet context
 * @param mintAddress Địa chỉ mint của token
 * @param state Trạng thái mặc định mới (0: Initialized, 1: Frozen)
 * @returns Signature của giao dịch
 */
export async function updateDefaultAccountState(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: string,
  state: number // 0: Initialized, 1: Frozen
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    // Sử dụng TokenFreezeExtension từ solana-token-extension-boost
    const { TokenFreezeExtension } = await import("solana-token-extension-boost");
    const { AccountState } = await import("@solana/spl-token");
    
    // Chuyển đổi state thành AccountState
    const accountState = state === 1 ? AccountState.Frozen : AccountState.Initialized;
    
    // Tạo transaction cập nhật trạng thái mặc định
    const transaction = TokenFreezeExtension.prepareUpdateDefaultAccountStateTransaction(
      new PublicKey(mintAddress),
      accountState,
      wallet.publicKey,
      wallet.publicKey
    );
    
    // Lấy blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    
    // Gửi và xác nhận transaction
    const signature = await wallet.sendTransaction(
      transaction,
      connection,
      { skipPreflight: false }
    );
    
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error("Error updating default account state:", error);
    throw error;
  }
}