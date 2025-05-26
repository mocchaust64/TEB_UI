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
  Users, 
  ArrowRightLeft,
  Upload,
  Info
} from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"

// Định nghĩa các kiểu dữ liệu cho token extensions
type TextOptionType = {
  id: string
  label: string
  type: "text"
  placeholder: string
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

type OptionType = TextOptionType | SliderOptionType

type TokenExtensionType = {
  id: string
  icon: React.ElementType
  name: string
  description: string
  color: string
  bgColor: string
  options: OptionType[]
}

// Dữ liệu các extensions cho token
const tokenExtensions: TokenExtensionType[] = [
  {
    id: "transfer-fees",
    icon: Percent,
    name: "Transfer Fees",
    description: "Automatically collect fees for each token transfer transaction",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    options: [
      { id: "fee-percentage", label: "Fee Percentage", type: "slider", min: 0, max: 10, step: 0.1, defaultValue: 1 }
    ]
  },
  {
    id: "confidential-transfer",
    icon: Eye,
    name: "Confidential Transfer",
    description: "Secure transaction information with zero-knowledge proofs",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    options: []
  },
  {
    id: "permanent-delegate",
    icon: Key,
    name: "Permanent Delegate",
    description: "Assign a permanent delegate for the token",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    options: [
      { id: "delegate-address", label: "Delegate Address", type: "text", placeholder: "Enter delegate public key" }
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
    id: "cpi-guard",
    icon: Shield,
    name: "CPI Guard",
    description: "Protection against CPI attacks",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    options: []
  },
  {
    id: "metadata-pointer",
    icon: FileText,
    name: "Metadata Pointer",
    description: "Link metadata directly to the token",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    options: [
      { id: "metadata-url", label: "Metadata URL", type: "text", placeholder: "https://example.com/metadata.json" }
    ]
  },
  {
    id: "group-pointer",
    icon: Users,
    name: "Group Pointer",
    description: "Group related tokens together",
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    options: [
      { id: "group-address", label: "Group Address", type: "text", placeholder: "Enter group public key" }
    ]
  },
  {
    id: "required-memo",
    icon: ArrowRightLeft,
    name: "Required Memo",
    description: "Require memo for all transactions",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    options: []
  },
]

// Component để hiển thị các tùy chọn của extension
const ExtensionOptionInput = ({ 
  option, 
  value, 
  onChange 
}: { 
  option: OptionType; 
  value: string | number | undefined; 
  onChange: (value: string | number) => void 
}) => {
  if (option.type === 'text') {
    return (
      <Input
        placeholder={(option as TextOptionType).placeholder}
        className="bg-gray-800 border-gray-700 text-white h-9"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  
  if (option.type === 'slider') {
    return (
      <div className="pt-1">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
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
        />
      </div>
    );
  }
  
  return null;
};

// Component chính
export default function CreateToken() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([])
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    decimals: "9",
    supply: "1000000",
    description: "",
    image: null as File | null,
    extensionOptions: {} as Record<string, any>,
    websiteUrl: "",
    twitterUrl: "",
    telegramUrl: "",
    discordUrl: ""
  })

  useEffect(() => {
    // Mô phỏng việc tải dữ liệu
    const loadData = async () => {
      // Trong ứng dụng thực tế, bạn có thể fetch dữ liệu khởi tạo
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  const toggleExtension = (extensionId: string) => {
    setSelectedExtensions(prev => 
      prev.includes(extensionId) 
        ? prev.filter(id => id !== extensionId)
        : [...prev, extensionId]
    )
  }

  const updateExtensionOption = (extensionId: string, optionId: string, value: any) => {
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
  }

  const handleCreateToken = () => {
    // Lưu dữ liệu token vào localStorage để trang review có thể truy cập
    if (typeof window !== 'undefined') {
      if (tokenData.image) {
        // Có ảnh, chuyển đổi sang base64 trước
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataToSave = {
            name: tokenData.name,
            symbol: tokenData.symbol,
            decimals: tokenData.decimals,
            supply: tokenData.supply,
            description: tokenData.description,
            extensionOptions: tokenData.extensionOptions,
            selectedExtensions,
            imageBase64: reader.result
          };
          localStorage.setItem('tokenData', JSON.stringify(dataToSave));
          window.location.href = '/create/review';
        };
        reader.readAsDataURL(tokenData.image);
      } else {
        // Không có ảnh
        const dataToSave = {
          name: tokenData.name,
          symbol: tokenData.symbol,
          decimals: tokenData.decimals,
          supply: tokenData.supply,
          description: tokenData.description,
          extensionOptions: tokenData.extensionOptions,
          selectedExtensions,
        };
        localStorage.setItem('tokenData', JSON.stringify(dataToSave));
        window.location.href = '/create/review';
      }
    }
  }

  if (isLoading) {
    return <PageLoadingSkeleton />
  }

  return (
    <CommonLayout>
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Create New 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}Token
            </span>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Design your custom token with Solana's powerful token extensions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Token Basic Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Coins className="w-5 h-5 mr-2" />
                    Token Basic Details
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter the basic information for your token
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="token-name" className="text-white">Token Name</Label>
                      <Input 
                        id="token-name" 
                        placeholder="e.g. My Amazing Token" 
                        className="bg-gray-800 border-gray-700 text-white"
                        value={tokenData.name}
                        onChange={(e) => setTokenData({...tokenData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token-symbol" className="text-white">Token Symbol</Label>
                      <Input 
                        id="token-symbol" 
                        placeholder="e.g. MAT" 
                        className="bg-gray-800 border-gray-700 text-white"
                        value={tokenData.symbol}
                        onChange={(e) => setTokenData({...tokenData, symbol: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token-decimals" className="text-white">Decimals</Label>
                      <Input 
                        id="token-decimals" 
                        type="number" 
                        className="bg-gray-800 border-gray-700 text-white"
                        value={tokenData.decimals}
                        onChange={(e) => setTokenData({...tokenData, decimals: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="token-supply" className="text-white">Initial Supply</Label>
                      <Input 
                        id="token-supply" 
                        type="number" 
                        className="bg-gray-800 border-gray-700 text-white"
                        value={tokenData.supply}
                        onChange={(e) => setTokenData({...tokenData, supply: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="token-description" className="text-white">Description</Label>
                      <Textarea 
                        id="token-description" 
                        placeholder="Describe your token and its purpose" 
                        className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                        value={tokenData.description}
                        onChange={(e) => setTokenData({...tokenData, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="token-image" className="text-white">Token Image</Label>
                      {tokenData.image ? (
                        <div className="relative flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 flex items-center justify-center bg-gray-800">
                            <img 
                              src={URL.createObjectURL(tokenData.image)} 
                              alt="Token Preview" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full p-1 h-8 w-8"
                            onClick={() => setTokenData({...tokenData, image: null})}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                              <path d="M18 6 6 18"/>
                              <path d="m6 6 12 12"/>
                            </svg>
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-center border-2 border-dashed border-gray-700 rounded-full h-24 w-24 mx-auto cursor-pointer hover:border-purple-500/50 transition-colors"
                          onClick={() => document.getElementById('token-image')?.click()}
                        >
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-1 text-xs text-gray-400">Tải ảnh</p>
                          </div>
                          <input 
                            id="token-image" 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setTokenData({...tokenData, image: file});
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="text-white font-medium mb-3">Social Links (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.5 8.5-3-2.5a1 1 0 0 0-1.5 1V12a1 1 0 0 0 1.5 1l3-2.5a1 1 0 0 0 0-2Z"/>
                        </svg>
                        <Input 
                          placeholder="Website URL" 
                          className="bg-gray-800 border-gray-700 text-white"
                          value={tokenData.websiteUrl}
                          onChange={(e) => setTokenData({...tokenData, websiteUrl: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                        </svg>
                        <Input 
                          placeholder="Twitter URL" 
                          className="bg-gray-800 border-gray-700 text-white"
                          value={tokenData.twitterUrl}
                          onChange={(e) => setTokenData({...tokenData, twitterUrl: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                          <path d="m22 8-5 5-5-5 5-5-5 5-5-5 5 5-5 5 5-5"/>
                          <path d="M2 12h10"/>
                          <path d="M17 22v-8.3a4 4 0 0 0-4-4h-1.7"/>
                        </svg>
                        <Input 
                          placeholder="Telegram URL" 
                          className="bg-gray-800 border-gray-700 text-white"
                          value={tokenData.telegramUrl}
                          onChange={(e) => setTokenData({...tokenData, telegramUrl: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                          <path d="M18 20a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3"/>
                          <path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                          <path d="M18 9a5 5 0 0 0-6-5 5 5 0 0 0-6 5v1a2 2 0 1 0 0 4"/>
                        </svg>
                        <Input 
                          placeholder="Discord URL" 
                          className="bg-gray-800 border-gray-700 text-white"
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-white">Selected Extensions Configuration</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure the options for your selected token extensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedExtensions.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No extensions selected yet</p>
                      <p className="text-sm text-gray-500 mt-1">Choose from the extensions list on the right</p>
                    </div>
                  ) : (
                    <Tabs defaultValue={selectedExtensions[0]} className="w-full">
                      <TabsList className="bg-gray-800 w-full flex overflow-x-auto">
                        {selectedExtensions.map(extId => {
                          const extension = tokenExtensions.find(ext => ext.id === extId);
                          if (!extension) return null;
                          const IconComponent = extension.icon;
                          return (
                            <TabsTrigger 
                              key={extId} 
                              value={extId}
                              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white h-9"
                            >
                              <IconComponent className={`w-4 h-4 mr-1 ${extension.color}`} />
                              <span className="truncate max-w-[80px]">{extension.name}</span>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                      {selectedExtensions.map(extId => {
                        const extension = tokenExtensions.find(ext => ext.id === extId);
                        if (!extension) return null;
                        const IconComponent = extension.icon;
                        return (
                          <TabsContent key={extId} value={extId} className="py-3">
                            <div className="space-y-3">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${extension.bgColor} shrink-0`}>
                                  <IconComponent className={`w-4 h-4 ${extension.color}`} />
                                </div>
                                <div>
                                  <h3 className="text-base font-semibold text-white">{extension.name}</h3>
                                  <p className="text-xs text-gray-400">{extension.description}</p>
                                </div>
                              </div>
                              
                              {extension.options.length === 0 ? (
                                <div className="bg-gray-800/50 rounded-lg p-3 text-gray-400 text-xs">
                                  <div className="flex items-center">
                                    <Info className="w-3 h-3 mr-1" />
                                    <span>This extension doesn't require any additional configuration.</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3 mt-3">
                                  {extension.options.map(option => (
                                    <div key={option.id} className="space-y-1">
                                      <Label htmlFor={`${extId}-${option.id}`} className="text-white text-sm">
                                        {option.label}
                                      </Label>
                                      <ExtensionOptionInput
                                        option={option}
                                        value={tokenData.extensionOptions[extId]?.[option.id]}
                                        onChange={(value) => updateExtensionOption(extId, option.id, value)}
                                      />
                                    </div>
                                  ))}
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
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Token Extensions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Select the extensions you want to add to your token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {tokenExtensions.map((extension) => {
                  const IconComponent = extension.icon;
                  const isSelected = selectedExtensions.includes(extension.id);
                  return (
                    <div 
                      key={extension.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-purple-500/20 border-purple-500' 
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => toggleExtension(extension.id)}
                    >
                      <div className={`p-2 rounded-lg ${extension.bgColor} mr-3 shrink-0`}>
                        <IconComponent className={`w-5 h-5 ${extension.color}`} />
                      </div>
                      <div className="flex-grow min-w-0 mr-3">
                        <p className="text-white font-medium">{extension.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{extension.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <div className={`h-5 w-5 rounded-full ${isSelected ? 'bg-purple-600' : 'bg-gray-700'} flex items-center justify-center`}>
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
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

            <div className="mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 text-base"
                      onClick={handleCreateToken}
                    >
                      <Coins className="mr-1.5 h-4 w-4" />
                      Create Token
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create your token with the selected extensions</p>
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