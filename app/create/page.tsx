"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CommonLayout } from "@/components/common-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  Coins, 
  Percent, 
  Eye, 
  Key, 
  Lock, 
  Zap, 
  Shield, 
  FileText, 
  Upload,
  Info,
  Webhook,
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Image as ImageIcon
} from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { uploadImageAndGetUrl } from "@/lib/utils/pinata"
import { toast } from "sonner"
import { PublicKey } from "@solana/web3.js"
import { initializeTransferHookWhitelist, createToken, createTokenWithTransferHookAndWhitelist, TokenCreationResult } from "@/lib/services/token-service"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"

// Định nghĩa các kiểu dữ liệu cho token extensions
type TextOptionType = {
  id: string
  label: string
  type: "text"
  placeholder: string
  required?: boolean
  validator?: (value: string) => { valid: boolean, message?: string }
}

type SliderOptionType = {
  id: string
  label: string
  type: "slider"
  min: number
  max: number
  step: number
  defaultValue: number
}

type SelectOptionType = {
  id: string
  label: string
  type: "select"
  options: Array<{value: string, label: string}>
  defaultValue: string
}

type OptionType = TextOptionType | SliderOptionType | SelectOptionType

type TokenExtensionType = {
  id: string
  icon: React.ElementType
  name: string
  description: string
  color: string
  bgColor: string
  options: OptionType[]
  isRequired?: boolean
  disabled?: boolean
  disabledReason?: string
  infoMessage?: string
}

// Function để validate public key
const validatePublicKey = (value: string): { valid: boolean, message?: string } => {
  // Kiểm tra xem có phải là public key Solana hợp lệ không (bắt đầu với số hoặc chữ và độ dài 32-44 ký tự)
  if (!value || value.trim() === '') {
    return { valid: false, message: "Public key cannot be empty" };
  }
  
  // Kiểm tra định dạng base58
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Regex.test(value)) {
    return { valid: false, message: "Public key format is invalid" };
  }
  
  return { valid: true };
};

// Định nghĩa các cặp extensions không tương thích
const incompatibleExtensionPairs: [string, string][] = [
  ["transfer-fees", "non-transferable"],
  ["non-transferable", "transfer-hook"],
  ["confidential-transfer", "transfer-fees"],
  ["confidential-transfer", "transfer-hook"],
  ["confidential-transfer", "permanent-delegate"],
  ["confidential-transfer", "non-transferable"]
];

// Hàm kiểm tra tính tương thích của một extension với các extensions đã chọn
const isCompatibleExtension = (extensionId: string, selectedExtensions: string[]): { 
  compatible: boolean; 
  incompatibleWith?: string 
} => {
  // Kiểm tra nếu đây là extension cần fee receiver
  if (extensionId === "transfer-fees") {
    // Logic cũ giữ nguyên
  }

  for (const selectedExt of selectedExtensions) {
    const pair1 = [extensionId, selectedExt] as [string, string];
    const pair2 = [selectedExt, extensionId] as [string, string];
    
    const isIncompatible = incompatibleExtensionPairs.some(
      pair => (pair[0] === pair1[0] && pair[1] === pair1[1]) || 
              (pair[0] === pair2[0] && pair[1] === pair2[1])
    );
    
    if (isIncompatible) {
      return { compatible: false, incompatibleWith: selectedExt };
    }
  }
  
  return { compatible: true };
};

const tokenExtensions: TokenExtensionType[] = [
  {
    id: "metadata",
    icon: FileText,
    name: "Token Metadata",
    description: "Metadata embedded directly into the token (always enabled)",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    options: [],
    isRequired: true
  },
  {
    id: "metadata-pointer",
    icon: FileText,
    name: "Metadata Pointer",
    description: "Link metadata with token (always enabled)",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    options: [],
    isRequired: true
  },
  {
    id: "transfer-fees",
    icon: Percent,
    name: "Transfer Fees",
    description: "Automatically collect fees for each token transfer transaction",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    options: [
      { id: "fee-percentage", label: "Fee Percentage", type: "slider", min: 0, max: 10, step: 0.1, defaultValue: 1 },
      { 
        id: "max-fee", 
        label: "Maximum Fee (tokens)", 
        type: "text", 
        placeholder: "Enter maximum fee per transaction (e.g. 1.0)",
        required: true
      },
      { 
        id: "fee-receiver", 
        label: "Fee Receiver Address", 
        type: "text", 
        placeholder: "Enter fee receiver public key",
        required: true,
        validator: validatePublicKey
      }
    ]
  },
  {
    id: "confidential-transfer",
    icon: Eye,
    name: "Confidential Transfer",
    description: "Secure transaction information with zero-knowledge proofs",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    options: [],
    disabled: true,
    disabledReason: "Currently in development, not ready for use yet"
  },
  {
    id: "permanent-delegate",
    icon: Key,
    name: "Permanent Delegate",
    description: "Assign a permanent delegate for the token",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    options: [
      { 
        id: "delegate-address", 
        label: "Delegate Address", 
        type: "text", 
        placeholder: "Enter delegate public key",
        required: true,
        validator: validatePublicKey
      }
    ]
  },
  {
    id: "non-transferable",
    icon: Lock,
    name: "Non-Transferable",
    description: "Create tokens that cannot be transferred",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    options: []
  },
  {
    id: "interest-bearing",
    icon: Zap,
    name: "Interest Bearing",
    description: "Tokens that automatically generate interest over time",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    options: [
      { id: "interest-rate", label: "Annual Interest Rate (%)", type: "slider", min: 0, max: 20, step: 0.1, defaultValue: 5 }
    ]
  },
  {
    id: "default-account-state",
    icon: Shield,
    name: "Default Account State",
    description: "Set default state for all accounts of this token (always frozen)",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    options: [
      {
        id: "freeze-authority",
        label: "Freeze Authority Address",
        type: "text",
        placeholder: "Enter freeze authority public key (defaults to your wallet)",
        validator: validatePublicKey
      }
    ]
  },
  {
    id: "mint-close-authority",
    icon: Key,
    name: "Mint Close Authority",
    description: "Authority allowed to close this mint",
    color: "text-pink-600",
    bgColor: "bg-pink-600/10",
    options: [
      { 
        id: "close-authority", 
        label: "Close Authority Address", 
        type: "text", 
        placeholder: "Enter close authority public key",
        required: true,
        validator: validatePublicKey
      }
    ]
  },
  {
    id: "transfer-hook",
    icon: Webhook,
    name: "Transfer Hook",
    description: "Execute custom program logic on every token transfer",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    options: [
      { 
        id: "program-id", 
        label: "Transfer Hook Program ID", 
        type: "text", 
        placeholder: "Enter program ID of the transfer hook",
        required: true,
        validator: validatePublicKey
      }
    ],
    infoMessage: "When using program ID 12BZr6af3s7qf7GGmhBvMd46DWmVNhHfXmCwftfMk1mZ, whitelist and ExtraAccountMetaList will be automatically initialized."
  }
]

// Component để hiển thị các tùy chọn của extension
const ExtensionOptionInput = ({ 
  option, 
  value, 
  onChange,
  error
}: { 
  option: OptionType; 
  value: string | number | undefined; 
  onChange: (value: string | number) => void;
  error?: string;
}) => {
  if (option.type === 'text') {
    const textOption = option as TextOptionType;
    return (
      <div className="space-y-1 max-w-full overflow-hidden">
      <Input
          placeholder={textOption.placeholder}
          className={`bg-gray-800 border-gray-700 text-white h-9 ${error ? 'border-red-500' : ''} text-xs sm:text-sm`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {textOption.required && !error && (
          <p className="text-[10px] sm:text-xs text-gray-500">* Bắt buộc</p>
        )}
      </div>
    );
  }
  
  if (option.type === 'slider') {
    return (
      <div className="pt-1 w-full max-w-full">
        <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mb-1.5">
          <span>{(option as SliderOptionType).min}%</span>
          <span>Current: {value || (option as SliderOptionType).defaultValue}%</span>
          <span>{(option as SliderOptionType).max}%</span>
        </div>
        <Slider
          min={(option as SliderOptionType).min}
          max={(option as SliderOptionType).max}
          step={(option as SliderOptionType).step}
          defaultValue={[Number(value || (option as SliderOptionType).defaultValue)]}
          onValueChange={(value) => onChange(value[0])}
          className="w-full"
        />
      </div>
    );
  }
  
  if (option.type === 'select') {
    const selectOption = option as SelectOptionType;
    return (
      <div className="space-y-1 max-w-full overflow-hidden">
        <select
          className={`w-full bg-gray-800 border border-gray-700 text-white rounded-md h-9 px-3 text-xs sm:text-sm ${error ? 'border-red-500' : ''}`}
          value={value?.toString() || selectOption.defaultValue}
          onChange={(e) => onChange(e.target.value)}
        >
          {selectOption.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
  
  return null;
};

// Component chính
export default function CreateToken() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>(["metadata", "metadata-pointer"])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string>>>({})
  const [activeTab, setActiveTab] = useState<string>("metadata")
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    symbol?: string;
    decimals?: string;
    supply?: string;
    image?: string;
  }>({})
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    decimals: "9",
    supply: "1000000",
    description: "",
    image: null as File | null,
    imageUrl: "",
    extensionOptions: {} as Record<string, any>,
    websiteUrl: "",
    twitterUrl: "",
    telegramUrl: "",
    discordUrl: ""
  })
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [mint, setMint] = useState<string>("");
  const [createdTokenInfo, setCreatedTokenInfo] = useState<TokenCreationResult | null>(null);

  useEffect(() => {
    // Mô phỏng việc tải dữ liệu
    const loadData = async () => {
      // Trong ứng dụng thực tế, bạn có thể fetch dữ liệu khởi tạo
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  const toggleExtension = (extensionId: string) => {
    // Không cho phép tắt các extension bắt buộc
    const extension = tokenExtensions.find(ext => ext.id === extensionId);
    if (extension?.isRequired) {
      return;
    }
    
    // Không cho phép chọn extension bị vô hiệu hóa
    if (extension?.disabled) {
      toast.error(`Cannot use ${extension.name} feature: ${extension.disabledReason}`);
      return;
    }
    
    if (selectedExtensions.includes(extensionId)) {
      // Xóa extension khỏi danh sách đã chọn
      setSelectedExtensions(prev => prev.filter(id => id !== extensionId));
      
      // Nếu đang xem tab của extension bị xóa, chuyển về tab đầu tiên còn lại
      if (activeTab === extensionId) {
        const remainingExtensions = selectedExtensions.filter(id => id !== extensionId);
        if (remainingExtensions.length > 0) {
          setActiveTab(remainingExtensions[0]);
        } else {
          setActiveTab("metadata"); // Fallback về metadata
        }
      }
    } else {
      // Kiểm tra tính tương thích trước khi thêm extension mới
      const compatibility = isCompatibleExtension(extensionId, selectedExtensions);
      if (!compatibility.compatible) {
        const incompatibleExt = tokenExtensions.find(ext => ext.id === compatibility.incompatibleWith);
        toast.error(`${extension?.name} is not compatible with the selected ${incompatibleExt?.name}`);
        return;
      }
      
      // Thêm extension mới vào danh sách
      setSelectedExtensions(prev => [...prev, extensionId]);
      
      // Thiết lập giá trị mặc định cho các extension
      if (extensionId === "transfer-fees") {
        // Tìm extension và thiết lập giá trị mặc định
        const transferFeeExt = tokenExtensions.find(ext => ext.id === "transfer-fees");
        if (transferFeeExt) {
          const feePercentageOption = transferFeeExt.options.find(opt => opt.id === "fee-percentage");
          if (feePercentageOption && feePercentageOption.type === "slider") {
            // Thiết lập giá trị mặc định cho fee-percentage
            setTokenData(prev => ({
              ...prev,
              extensionOptions: {
                ...prev.extensionOptions,
                "transfer-fees": {
                  ...(prev.extensionOptions["transfer-fees"] || {}),
                  "fee-percentage": (feePercentageOption as SliderOptionType).defaultValue,
                  "max-fee": "1.0",
                  "fee-receiver": ""
                }
              }
            }));
          }
        }
      }
      
      // Tự động chọn tab của extension mới thêm
      setActiveTab(extensionId);
    }
  }

  const updateExtensionOption = (extensionId: string, optionId: string, value: any) => {
    // Cập nhật giá trị
    setTokenData(prev => ({
      ...prev,
      extensionOptions: {
        ...prev.extensionOptions,
        [extensionId]: {
          ...(prev.extensionOptions[extensionId] || {}),
          [optionId]: value
        }
      }
    }))
    
    // Xử lý đặc biệt cho transfer-fee khi cập nhật fee-percentage
    if (extensionId === "transfer-fees" && optionId === "fee-percentage") {
      // Đảm bảo giá trị nằm trong khoảng hợp lệ
      const feePercentage = parseFloat(value);
      if (isNaN(feePercentage) || feePercentage < 0) {
        setValidationErrors(prev => ({
          ...prev,
          [extensionId]: {
            ...(prev[extensionId] || {}),
            [optionId]: 'Transfer fee cannot be less than 0%'
          }
        }));
      } else if (feePercentage > 10) {
        setValidationErrors(prev => ({
          ...prev,
          [extensionId]: {
            ...(prev[extensionId] || {}),
            [optionId]: 'Transfer fee cannot be greater than 10%'
          }
        }));
      } else {
        // Xóa lỗi nếu có
        if (validationErrors[extensionId]?.[optionId]) {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[extensionId]) {
              delete newErrors[extensionId][optionId];
            }
            return newErrors;
          });
        }
      }
    }
    
    // Xóa lỗi nếu có
    if (validationErrors[extensionId]?.[optionId]) {
      setValidationErrors(prev => ({
        ...prev,
        [extensionId]: {
          ...(prev[extensionId] || {}),
          [optionId]: ''
        }
      }))
      
      // Kiểm tra lại nếu có validator
      const extension = tokenExtensions.find(ext => ext.id === extensionId);
      const option = extension?.options.find(opt => opt.id === optionId);
      
      if (option && option.type === 'text' && (option as TextOptionType).validator) {
        const textOption = option as TextOptionType;
        const validation = textOption.validator!(value);
        
        if (!validation.valid) {
          setValidationErrors(prev => ({
            ...prev,
            [extensionId]: {
              ...(prev[extensionId] || {}),
              [optionId]: validation.message || 'Invalid value'
            }
          }))
        }
      }
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file || !(file instanceof File)) {
      toast.error("No valid file selected");
      return;
    }

    setUploadingImage(true);

    try {
      // Tải ảnh lên IPFS sử dụng Pinata
      const imageUrl = await uploadImageAndGetUrl(file, `token-${tokenData.name.toLowerCase()}`);
      
      // Cập nhật state với URL ảnh
      setTokenData(prev => ({
        ...prev,
        image: file,
        imageUrl: imageUrl
      }));

      // Xóa lỗi ảnh nếu có
      if (formErrors.image) {
        setFormErrors({...formErrors, image: undefined});
      }

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      setFormErrors({...formErrors, image: "Could not upload image, please try again"});
    } finally {
      setUploadingImage(false);
    }
  };

  // Hàm validate dữ liệu token
  const validateTokenData = (): boolean => {
    let isValid = true;
    const errors: Record<string, Record<string, string>> = {};
    const basicErrors: {
      name?: string;
      symbol?: string;
      decimals?: string;
      supply?: string;
      image?: string;
    } = {};
    
    // Kiểm tra các trường cơ bản
    if (!tokenData.name.trim()) {
      basicErrors.name = "Token name is required";
      isValid = false;
    }
    
    if (!tokenData.symbol.trim()) {
      basicErrors.symbol = "Token symbol is required";
      isValid = false;
    } else if (tokenData.symbol.length > 10) {
      basicErrors.symbol = "Token symbol must not exceed 10 characters";
      isValid = false;
    }
    
    if (!tokenData.decimals) {
      basicErrors.decimals = "Decimals are required";
      isValid = false;
    } else {
      const decimalsNum = Number(tokenData.decimals);
      if (isNaN(decimalsNum) || decimalsNum < 0 || decimalsNum > 9) {
        basicErrors.decimals = "Decimals must be a number between 0-9";
        isValid = false;
      }
    }
    
    if (!tokenData.supply) {
      basicErrors.supply = "Token supply is required";
      isValid = false;
    } else {
      const supplyNum = Number(tokenData.supply);
      if (isNaN(supplyNum) || supplyNum <= 0) {
        basicErrors.supply = "Token supply must be greater than 0";
        isValid = false;
      }
    }
    
    // Kiểm tra ảnh đã tải lên thành công chưa
    if (!tokenData.imageUrl) {
      basicErrors.image = "You must upload an image for the token";
      isValid = false;
    }
    
    setFormErrors(basicErrors);
    
    // Validate thông tin extension
    for (const extensionId of selectedExtensions) {
      const extension = tokenExtensions.find(ext => ext.id === extensionId);
      
      if (extension) {
        // Kiểm tra đặc biệt cho transfer-fees
        if (extensionId === "transfer-fees") {
          // Kiểm tra fee-receiver
          const feeReceiver = tokenData.extensionOptions[extensionId]?.["fee-receiver"];
          if (!feeReceiver || (typeof feeReceiver === 'string' && feeReceiver.trim() === '')) {
            errors[extensionId] = {
              ...(errors[extensionId] || {}),
              "fee-receiver": "Fee receiver address is required"
            };
            isValid = false;
          } else {
            // Nếu có giá trị, kiểm tra định dạng public key
            const validation = validatePublicKey(feeReceiver);
            if (!validation.valid) {
              errors[extensionId] = {
                ...(errors[extensionId] || {}),
                "fee-receiver": validation.message || "Fee receiver address is invalid"
              };
              isValid = false;
            }
          }
          
          // Kiểm tra max-fee
          const maxFee = tokenData.extensionOptions[extensionId]?.["max-fee"];
          if (!maxFee || (typeof maxFee === 'string' && maxFee.trim() === '')) {
            errors[extensionId] = {
              ...(errors[extensionId] || {}),
              "max-fee": "Maximum fee is required"
            };
            isValid = false;
          } else {
            const maxFeeValue = Number(maxFee);
            if (isNaN(maxFeeValue) || maxFeeValue <= 0) {
              errors[extensionId] = {
                ...(errors[extensionId] || {}),
                "max-fee": "Maximum fee must be greater than 0"
              };
              isValid = false;
            }
          }
          
          // Kiểm tra fee-percentage
          const feePercentage = tokenData.extensionOptions[extensionId]?.["fee-percentage"];
          if (feePercentage === undefined || feePercentage === null) {
            errors[extensionId] = {
              ...(errors[extensionId] || {}),
              "fee-percentage": "Fee percentage is required"
            };
            isValid = false;
          } else {
            const percentValue = Number(feePercentage);
            if (isNaN(percentValue) || percentValue < 0 || percentValue > 10) {
              errors[extensionId] = {
                ...(errors[extensionId] || {}),
                "fee-percentage": "Fee percentage must be between 0-10%"
              };
              isValid = false;
            }
          }
        }
        
        // Kiểm tra các option bắt buộc khác
        const requiredOptions = extension.options.filter(
          opt => opt.type === 'text' && (opt as TextOptionType).required
        );
        
        if (requiredOptions.length > 0) {
          // Kiểm tra từng option bắt buộc
          for (const option of requiredOptions) {
            const textOption = option as TextOptionType;
            const value = tokenData.extensionOptions[extensionId]?.[option.id];
            
            // Nếu không có giá trị hoặc giá trị rỗng
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              errors[extensionId] = {
                ...(errors[extensionId] || {}),
                [option.id]: `${textOption.label} field is required`
              };
              isValid = false;
            }
            // Nếu có validator, thực hiện kiểm tra
            else if (textOption.validator) {
              const validation = textOption.validator(value);
              if (!validation.valid) {
                errors[extensionId] = {
                  ...(errors[extensionId] || {}),
                  [option.id]: validation.message || 'Invalid value'
                };
                isValid = false;
              }
            }
          }
        }
      }
    }
    
    setValidationErrors(errors);
    
    if (!isValid) {
      // Hiển thị thông báo lỗi tổng quan
      if (Object.keys(basicErrors).length > 0) {
        toast.error("Please enter all required basic information for the token");
      } else {
        toast.error("Please enter all required information for the selected extensions");
      }
    }
    
    return isValid;
  };

  const handleCreateToken = async () => {
    // Validate dữ liệu trước khi tiếp tục
    if (!validateTokenData()) {
      return;
    }
    
    // Lưu dữ liệu token vào localStorage để trang review có thể truy cập
    if (typeof window !== 'undefined') {
      const dataToSave = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        supply: tokenData.supply,
        description: tokenData.description,
        extensionOptions: tokenData.extensionOptions,
        selectedExtensions,
        imageUrl: tokenData.imageUrl,
        websiteUrl: tokenData.websiteUrl,
        twitterUrl: tokenData.twitterUrl,
        telegramUrl: tokenData.telegramUrl,
        discordUrl: tokenData.discordUrl
      };
      localStorage.setItem('tokenData', JSON.stringify(dataToSave));
      window.location.href = '/create/review';
    }

    try {
      setIsCreating(true);
      
      // Kiểm tra xem có sử dụng transfer hook whitelist không
      const hasTransferHookWhitelist = 
        selectedExtensions.includes("transfer-hook") && 
        tokenData.extensionOptions?.["transfer-hook"]?.["program-id"] === "12BZr6af3s7qf7GGmhBvMd46DWmVNhHfXmCwftfMk1mZ";
      
      let result: TokenCreationResult;
      
      // Sử dụng hàm tạo token phù hợp dựa trên việc có whitelist hay không
      if (hasTransferHookWhitelist) {
        // Sử dụng hàm kết hợp để giảm số lần ký xuống 2
        result = await createTokenWithTransferHookAndWhitelist(connection, wallet, tokenData, selectedExtensions);
        toast.success("Token được tạo thành công với whitelist đã được khởi tạo");
      } else {
        // Sử dụng hàm tạo token thông thường
        result = await createToken(connection, wallet, tokenData, selectedExtensions);
      }
      
      // Cập nhật state và hiển thị thông báo thành công
      setMint(result.mint);
      setCreatedTokenInfo(result);
      setIsCreated(true);
      toast.success("Token created successfully!");
      
      // Nếu đã tạo token thành công và có transfer hook nhưng chưa khởi tạo whitelist
      if (!hasTransferHookWhitelist && 
          selectedExtensions.includes("transfer-hook") && 
          tokenData.extensionOptions?.["transfer-hook"]?.["program-id"] === "12BZr6af3s7qf7GGmhBvMd46DWmVNhHfXmCwftfMk1mZ") {
        toast("Token đã được tạo thành công", {
          description: "Nếu bạn gặp lỗi khi tạo whitelist, bạn có thể thử lại.",
          action: {
            label: "Tạo lại whitelist",
            onClick: () => {
              // Gọi hàm để tạo lại whitelist
              initializeTransferHookWhitelist(
                connection, 
                wallet, 
                new PublicKey(result.mint), 
                new PublicKey("12BZr6af3s7qf7GGmhBvMd46DWmVNhHfXmCwftfMk1mZ")
              ).then((signature: string) => {
                toast.success("Whitelist được tạo thành công");
              }).catch((error: Error) => {
                toast.error("Lỗi khi tạo whitelist: " + error.message);
              });
            }
          }
        });
      }
    } catch (error: any) {
      console.error("Error creating token:", error);
      toast.error(`Failed to create token: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <PageLoadingSkeleton />
  }

  return (
    <CommonLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            Create New 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}Token
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">
            Design your custom token with Solana's powerful token extensions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
          <div className="md:col-span-2 space-y-4 sm:space-y-8">
            {/* Token Basic Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Token Basic Details
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm sm:text-base">
                    Enter the basic information for your token
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="token-name" className="text-white text-sm sm:text-base">Token Name<span className="text-red-500 ml-1">*</span></Label>
                      <Input 
                        id="token-name" 
                        placeholder="e.g. My Amazing Token" 
                        className={`bg-gray-800 border-gray-700 text-white ${formErrors.name ? 'border-red-500' : ''}`}
                        value={tokenData.name}
                        onChange={(e) => {
                          setTokenData({...tokenData, name: e.target.value});
                          if (formErrors.name) {
                            setFormErrors({...formErrors, name: undefined});
                          }
                        }}
                      />
                      {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token-symbol" className="text-white text-sm sm:text-base">Token Symbol<span className="text-red-500 ml-1">*</span></Label>
                      <Input 
                        id="token-symbol" 
                        placeholder="e.g. MAT" 
                        className={`bg-gray-800 border-gray-700 text-white ${formErrors.symbol ? 'border-red-500' : ''}`}
                        value={tokenData.symbol}
                        onChange={(e) => {
                          setTokenData({...tokenData, symbol: e.target.value});
                          if (formErrors.symbol) {
                            setFormErrors({...formErrors, symbol: undefined});
                          }
                        }}
                      />
                      {formErrors.symbol && <p className="text-xs text-red-500">{formErrors.symbol}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token-decimals" className="text-white text-sm sm:text-base">Decimals<span className="text-red-500 ml-1">*</span></Label>
                      <Input 
                        id="token-decimals" 
                        type="number" 
                        className={`bg-gray-800 border-gray-700 text-white ${formErrors.decimals ? 'border-red-500' : ''}`}
                        value={tokenData.decimals}
                        onChange={(e) => {
                          setTokenData({...tokenData, decimals: e.target.value});
                          if (formErrors.decimals) {
                            setFormErrors({...formErrors, decimals: undefined});
                          }
                        }}
                      />
                      {formErrors.decimals && <p className="text-xs text-red-500">{formErrors.decimals}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token-supply" className="text-white text-sm sm:text-base">Initial Supply<span className="text-red-500 ml-1">*</span></Label>
                      <Input 
                        id="token-supply" 
                        type="number" 
                        className={`bg-gray-800 border-gray-700 text-white ${formErrors.supply ? 'border-red-500' : ''}`}
                        value={tokenData.supply}
                        onChange={(e) => {
                          setTokenData({...tokenData, supply: e.target.value});
                          if (formErrors.supply) {
                            setFormErrors({...formErrors, supply: undefined});
                          }
                        }}
                      />
                      {formErrors.supply && <p className="text-xs text-red-500">{formErrors.supply}</p>}
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-4 mt-2 sm:mt-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="token-description" className="text-white text-sm sm:text-base">Description</Label>
                      <Textarea 
                        id="token-description" 
                        placeholder="Describe your token and its purpose" 
                        className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                        value={tokenData.description}
                        onChange={(e) => setTokenData({...tokenData, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="token-image" className="text-white text-sm sm:text-base text-center block">Token Image<span className="text-red-500 ml-1">*</span></Label>
                      {tokenData.image ? (
                        <div className="relative flex items-center justify-center">
                          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 ${formErrors.image ? 'border-red-500' : 'border-purple-500/30'} flex items-center justify-center bg-gray-800`}>
                            <img 
                              src={tokenData.imageUrl || URL.createObjectURL(tokenData.image)} 
                              alt="Token Preview" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full p-1 h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => {
                              setTokenData({...tokenData, image: null, imageUrl: ""});
                              setFormErrors({...formErrors, image: "Bạn phải tải lên ảnh cho token"});
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                              <path d="M18 6 6 18"/>
                              <path d="m6 6 12 12"/>
                            </svg>
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className={`flex items-center justify-center border-2 border-dashed ${formErrors.image ? 'border-red-500' : 'border-gray-700'} rounded-full h-20 w-20 sm:h-24 sm:w-24 mx-auto cursor-pointer hover:border-purple-500/50 transition-colors`}
                          onClick={() => document.getElementById('token-image')?.click()}
                        >
                          <div className="text-center">
                            <Upload className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                            <p className="mt-1 text-xs text-gray-400">
                              {uploadingImage ? "Uploading..." : "Upload"}
                            </p>
                          </div>
                          <input 
                            id="token-image" 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                            disabled={uploadingImage}
                          />
                        </div>
                      )}
                      {formErrors.image && <p className="text-xs text-red-500 text-center mt-1">{formErrors.image}</p>}
                      {tokenData.imageUrl && (
                        <p className="text-xs text-green-400 text-center mt-1">
                          Image uploaded successfully
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">Social Links (Optional)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.5 8.5-3-2.5a1 1 0 0 0-1.5 1V12a1 1 0 0 0 1.5 1l3-2.5a1 1 0 0 0 0-2Z"/>
                        </svg>
                        <Input 
                          placeholder="Website URL" 
                          className="bg-gray-800 border-gray-700 text-white text-sm"
                          value={tokenData.websiteUrl}
                          onChange={(e) => setTokenData({...tokenData, websiteUrl: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                        </svg>
                        <Input 
                          placeholder="Twitter URL" 
                          className="bg-gray-800 border-gray-700 text-white text-sm"
                          value={tokenData.twitterUrl}
                          onChange={(e) => setTokenData({...tokenData, twitterUrl: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m22 8-5 5-5-5 5-5-5 5-5-5 5 5-5 5 5-5"/>
                          <path d="M2 12h10"/>
                          <path d="M17 22v-8.3a4 4 0 0 0-4-4h-1.7"/>
                        </svg>
                        <Input 
                          placeholder="Telegram URL" 
                          className="bg-gray-800 border-gray-700 text-white text-sm"
                          value={tokenData.telegramUrl}
                          onChange={(e) => setTokenData({...tokenData, telegramUrl: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 20a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3"/>
                          <path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                          <path d="M18 9a5 5 0 0 0-6-5 5 5 0 0 0-6 5v1a2 2 0 1 0 0 4"/>
                        </svg>
                        <Input 
                          placeholder="Discord URL" 
                          className="bg-gray-800 border-gray-700 text-white text-sm"
                          value={tokenData.discordUrl}
                          onChange={(e) => setTokenData({...tokenData, discordUrl: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Extension Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader className="pb-2 p-4 sm:p-6">
                  <CardTitle className="text-white text-lg sm:text-xl">Selected Extensions Configuration</CardTitle>
                  <CardDescription className="text-gray-400 text-sm sm:text-base">
                    Configure the options for your selected token extensions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {selectedExtensions.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      <FileText className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-50" />
                      <p className="text-sm sm:text-base">No extensions selected yet</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Choose from the extensions list on the right</p>
                    </div>
                  ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="bg-gray-800 w-full flex overflow-x-auto pb-0.5 scrollbar-hide">
                        {selectedExtensions.map(extId => {
                          const extension = tokenExtensions.find(ext => ext.id === extId);
                          if (!extension) return null;
                          const IconComponent = extension.icon;
                          return (
                            <TabsTrigger 
                              key={extId} 
                              value={extId}
                              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white h-8 sm:h-9 text-xs sm:text-sm flex-shrink-0"
                            >
                              <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${extension.color}`} />
                              <span className="truncate max-w-[60px] sm:max-w-[80px]">{extension.name}</span>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                      {selectedExtensions.map(extId => {
                        const extension = tokenExtensions.find(ext => ext.id === extId);
                        if (!extension) return null;
                        const IconComponent = extension.icon;
                        return (
                          <TabsContent key={extId} value={extId} className="py-3 overflow-hidden">
                            <div className="space-y-3">
                              <div className="flex items-start space-x-2 sm:space-x-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg ${extension.bgColor} shrink-0`}>
                                  <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 ${extension.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-sm sm:text-base font-semibold text-white">{extension.name}</h3>
                                  <p className="text-xs text-gray-400">{extension.description}</p>
                                </div>
                              </div>
                              
                              {extension.options.length === 0 ? (
                                <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-gray-400 text-xs">
                                  <div className="flex items-center">
                                    <Info className="w-3 h-3 mr-1" />
                                    <span>This extension doesn't require any additional configuration.</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3 mt-3 px-1">
                                  {extension.options.map(option => (
                                    <div key={option.id} className="space-y-1">
                                      <Label htmlFor={`${extId}-${option.id}`} className="text-white text-xs sm:text-sm">
                                        {option.label}
                                        {option.type === 'text' && (option as TextOptionType).required && (
                                          <span className="text-red-500 ml-1">*</span>
                                        )}
                                      </Label>
                                      <div className="max-w-full overflow-x-hidden">
                                        <ExtensionOptionInput
                                          option={option}
                                          value={tokenData.extensionOptions[extId]?.[option.id]}
                                          onChange={(value) => updateExtensionOption(extId, option.id, value)}
                                          error={validationErrors[extId]?.[option.id]}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {extension.id === "transfer-fees" && (
                                    <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-gray-400 text-xs mt-3">
                                      <div className="flex items-start">
                                        <Info className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                                        <span>
                                          Transfer fees are calculated as a percentage each time tokens are transferred.
                                          When users transfer tokens, fees are automatically deducted and sent to the
                                          configured Fee Receiver address.
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {extension.infoMessage && (
                                    <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-gray-400 text-xs mt-3">
                                      <div className="flex items-start">
                                        <Info className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                                        <span>{extension.infoMessage}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Token Extensions Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-1"
          >
            <Card className="bg-gray-900/50 border-gray-700 sticky top-4">
              <CardHeader className="pb-2 p-4 sm:p-6">
                <CardTitle className="text-white flex items-center text-base sm:text-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Token Extensions
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs sm:text-sm">
                  Select the extensions you want to add to your token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 max-h-[350px] sm:max-h-[50vh] overflow-y-auto p-2 sm:p-3 sm:pr-2">
                {tokenExtensions.map((extension) => {
                  const IconComponent = extension.icon;
                  const isSelected = selectedExtensions.includes(extension.id);
                  
                  // Kiểm tra tính tương thích của extension này với các extension đã được chọn
                  // để hiển thị trạng thái tương thích trong tooltip
                  let compatibilityStatus = null;
                  if (!extension.isRequired && !isSelected && !extension.disabled) {
                    const compatibility = isCompatibleExtension(extension.id, selectedExtensions);
                    if (!compatibility.compatible) {
                      const incompatibleExt = tokenExtensions.find(ext => ext.id === compatibility.incompatibleWith);
                      compatibilityStatus = `Không tương thích với ${incompatibleExt?.name}`;
                    }
                  }
                  
                  return (
                    <div 
                      key={extension.id}
                      className={`flex items-center p-2 sm:p-3 rounded-lg border transition-colors ${
                        extension.disabled ? 'bg-gray-800/30 border-gray-700 opacity-60 cursor-not-allowed' :
                        isSelected 
                          ? 'bg-purple-500/20 border-purple-500 cursor-pointer' 
                          : compatibilityStatus 
                            ? 'bg-gray-800/50 border-gray-700 border-red-500/30 cursor-not-allowed' 
                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 cursor-pointer'
                      }`}
                      onClick={() => !extension.disabled && toggleExtension(extension.id)}
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg ${extension.bgColor} mr-2 sm:mr-3 shrink-0`}>
                        <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${extension.color}`} />
                      </div>
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center flex-wrap gap-1">
                        <p className="text-white font-medium text-xs sm:text-sm">{extension.name}</p>
                          {extension.disabled && (
                            <span className="ml-1 px-1 py-0.5 text-[10px] bg-gray-700 text-gray-300 rounded whitespace-nowrap">
                              Beta
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">{extension.description}</p>
                        {compatibilityStatus && (
                          <p className="text-[10px] sm:text-xs text-red-400 mt-0.5 sm:mt-1 truncate">{compatibilityStatus}</p>
                        )}
                        {extension.disabled && extension.disabledReason && (
                          <p className="text-[10px] sm:text-xs text-yellow-500 mt-0.5 sm:mt-1 truncate">{extension.disabledReason}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center">
                        <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full ${
                          extension.disabled ? 'bg-gray-700' :
                          isSelected ? 'bg-purple-600' : 'bg-gray-700'
                        } flex items-center justify-center`}>
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <div className="mt-3 sm:mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 sm:py-5 text-sm sm:text-base"
                      onClick={handleCreateToken}
                    >
                      <Coins className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                      Create Token
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs sm:text-sm">Create your token with the selected extensions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </motion.div>
        </div>
      </div>
    </CommonLayout>
  )
} 