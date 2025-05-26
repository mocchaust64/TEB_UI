"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CommonLayout } from "@/components/common-layout"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  ChevronRight,
  Settings,
  Key,
  Lock,
  ShieldAlert,
  Percent,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

// Mock dữ liệu token
const tokenDetails = {
  id: "1",
  name: "Sample Token",
  symbol: "SMPL",
  supply: "1,000,000",
  decimals: "9",
  authorities: {
    mint: "Your wallet",
    freeze: "Your wallet",
    transfer_fee: "Your wallet",
    withdraw_withheld: "Your wallet",
    metadata: "mutable"
  },
  transferFee: 1.5,
  withheldAmount: "15,000"
}

export default function TokenManagePage() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("authorities")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  
  // Trạng thái cho đơn giản quản lý form
  const [transferFee, setTransferFee] = useState("1.5")
  const [mintAddress, setMintAddress] = useState("")
  const [freezeEnabled, setFreezeEnabled] = useState(true)
  const [transferFeeEnabled, setTransferFeeEnabled] = useState(true)
  const [metadataMutable, setMetadataMutable] = useState(true)
  
  useEffect(() => {
    // Mô phỏng việc tải dữ liệu
    const loadData = async () => {
      // Trong một ứng dụng thực tế, bạn sẽ lấy thông tin token từ API
      // dựa trên params.id
      setToken(tokenDetails)
      
      // Khởi tạo các giá trị form từ dữ liệu token
      setTransferFee(tokenDetails.transferFee.toString())
      setFreezeEnabled(tokenDetails.authorities.freeze === "Your wallet")
      setTransferFeeEnabled(tokenDetails.authorities.transfer_fee === "Your wallet")
      setMetadataMutable(tokenDetails.authorities.metadata === "mutable")
      
      setMounted(true)
    }
    
    loadData()
  }, [params])
  
  const handleSubmitAuthorities = () => {
    setIsSubmitting(true)
    setErrorMsg("")
    setSuccessMsg("")
    
    // Mô phỏng gửi cập nhật quyền (sẽ được thay bằng API thực tế)
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccessMsg("Đã cập nhật quyền quản lý token thành công")
      
      // Cập nhật lại dữ liệu token
      setToken((prev: any) => ({
        ...prev,
        authorities: {
          ...prev.authorities,
          freeze: freezeEnabled ? "Your wallet" : "revoked",
          transfer_fee: transferFeeEnabled ? "Your wallet" : "revoked",
          metadata: metadataMutable ? "mutable" : "immutable"
        }
      }))
    }, 1500)
  }
  
  const handleSubmitTransferFee = () => {
    setIsSubmitting(true)
    setErrorMsg("")
    setSuccessMsg("")
    
    // Validate
    const feeValue = parseFloat(transferFee)
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
      setIsSubmitting(false)
      setErrorMsg("Phí chuyển khoản phải là một số từ 0 đến 100")
      return
    }
    
    // Mô phỏng cập nhật phí chuyển khoản
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccessMsg("Đã cập nhật phí chuyển khoản thành công")
      
      // Cập nhật lại dữ liệu token
      setToken((prev: any) => ({
        ...prev,
        transferFee: feeValue
      }))
    }, 1500)
  }
  
  const handleWithdrawFees = () => {
    setIsSubmitting(true)
    setErrorMsg("")
    setSuccessMsg("")
    
    // Mô phỏng rút phí
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccessMsg("Đã rút hết phí đã giữ lại thành công")
      
      // Cập nhật lại dữ liệu token
      setToken((prev: any) => ({
        ...prev,
        withheldAmount: "0"
      }))
    }, 1500)
  }
  
  // Hiển thị loading skeleton khi chưa mounted
  if (!mounted) {
    return <PageLoadingSkeleton />
  }
  
  return (
    <CommonLayout>
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-8">
            <Link href="/tokens" className="text-gray-400 hover:text-white">Tokens</Link>
            <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
            <Link href={`/tokens/${token.id}`} className="text-gray-400 hover:text-white">{token.name}</Link>
            <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
            <span className="text-white">Quản lý Token</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
            <Settings className="w-7 h-7 mr-3 text-purple-400" />
            Quản lý Token {token.symbol}
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <Card className="bg-gray-900/50 border-gray-700 mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-xl">Cấu hình Token</CardTitle>
                  <CardDescription>Quản lý quyền hạn và cài đặt cho token của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <TabsList className="bg-gray-800 border-b border-gray-700 w-full justify-start mb-6">
                    <TabsTrigger value="authorities" className="data-[state=active]:bg-gray-700 h-10">
                      <Key className="w-4 h-4 mr-2" />
                      Quản lý quyền
                    </TabsTrigger>
                    <TabsTrigger value="transfer-fees" className="data-[state=active]:bg-gray-700 h-10">
                      <Percent className="w-4 h-4 mr-2" />
                      Phí chuyển khoản
                    </TabsTrigger>
                    <TabsTrigger value="metadata" className="data-[state=active]:bg-gray-700 h-10">
                      <FileText className="w-4 h-4 mr-2" />
                      Metadata
                    </TabsTrigger>
                  </TabsList>
                  
                  {successMsg && (
                    <Alert className="bg-green-500/20 border-green-500/50 text-green-200 mb-6">
                      <CheckCircle className="w-4 h-4" />
                      <AlertTitle>Thành công</AlertTitle>
                      <AlertDescription>{successMsg}</AlertDescription>
                    </Alert>
                  )}
                  
                  {errorMsg && (
                    <Alert className="bg-red-500/20 border-red-500/50 text-red-200 mb-6">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertTitle>Lỗi</AlertTitle>
                      <AlertDescription>{errorMsg}</AlertDescription>
                    </Alert>
                  )}
                  
                  <TabsContent value="authorities" className="mt-0">
                    <div className="space-y-6">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                        <div className="flex">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 shrink-0 mt-1" />
                          <div className="text-yellow-300 text-sm">
                            <p className="font-medium mb-1">Cảnh báo quan trọng</p>
                            <p>Việc từ bỏ quyền là <strong>không thể hủy bỏ</strong>. Sau khi từ bỏ quyền, bạn sẽ không thể quản lý các chức năng tương ứng của token nữa.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                              <Key className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">Mint Authority</h3>
                              <p className="text-gray-400 text-sm">Quyền tạo thêm token mới</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-white text-sm bg-gray-700 px-2 py-1 rounded mr-3">
                              {token.authorities.mint}
                            </span>
                            <Button 
                              variant="outline" 
                              className="border-red-500/50 hover:bg-red-500/20 text-red-400"
                              disabled={token.authorities.mint === "revoked"}
                            >
                              Từ bỏ
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                              <Lock className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">Freeze Authority</h3>
                              <p className="text-gray-400 text-sm">Quyền đóng băng các địa chỉ giữ token</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Switch 
                              checked={freezeEnabled}
                              onCheckedChange={setFreezeEnabled}
                              disabled={token.authorities.freeze === "revoked"}
                              className="mr-3"
                            />
                            <span className="text-white text-sm bg-gray-700 px-2 py-1 rounded mr-3">
                              {freezeEnabled ? "Bật" : "Tắt"}
                            </span>
                            <Button 
                              variant="outline" 
                              className="border-red-500/50 hover:bg-red-500/20 text-red-400"
                              disabled={token.authorities.freeze === "revoked"}
                            >
                              Từ bỏ
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                              <Percent className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">Transfer Fee Authority</h3>
                              <p className="text-gray-400 text-sm">Quyền thay đổi phí cho mỗi giao dịch</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Switch 
                              checked={transferFeeEnabled}
                              onCheckedChange={setTransferFeeEnabled}
                              disabled={token.authorities.transfer_fee === "revoked"}
                              className="mr-3"
                            />
                            <span className="text-white text-sm bg-gray-700 px-2 py-1 rounded mr-3">
                              {transferFeeEnabled ? "Bật" : "Tắt"}
                            </span>
                            <Button 
                              variant="outline" 
                              className="border-red-500/50 hover:bg-red-500/20 text-red-400"
                              disabled={token.authorities.transfer_fee === "revoked"}
                            >
                              Từ bỏ
                            </Button>
                          </div>
                        </div>
                        
                        <div className="pt-6 flex justify-end">
                          <Button 
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={handleSubmitAuthorities}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="transfer-fees" className="mt-0">
                    <div className="space-y-6">
                      <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                        <h3 className="text-white font-medium mb-3">Phí chuyển khoản hiện tại</h3>
                        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-3">
                          <span className="text-gray-400">Phí</span>
                          <span className="text-white text-lg font-semibold">{token.transferFee}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Tổng phí đã thu</span>
                          <span className="text-white">{token.withheldAmount} {token.symbol}</span>
                        </div>
                      </div>
                      
                      {token.authorities.transfer_fee === "Your wallet" ? (
                        <>
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="transferFee" className="text-white block mb-2">
                                Cập nhật phí chuyển khoản (%)
                              </label>
                              <div className="flex">
                                <Input 
                                  id="transferFee"
                                  type="number"
                                  value={transferFee}
                                  onChange={(e) => setTransferFee(e.target.value)}
                                  className="bg-gray-800 border-gray-700 text-white rounded-r-none"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                />
                                <div className="bg-gray-700 text-white flex items-center px-3 rounded-r-md border-t border-r border-b border-gray-700">
                                  %
                                </div>
                              </div>
                              <p className="text-gray-400 text-sm mt-1">
                                Phí này sẽ được áp dụng cho mỗi giao dịch chuyển token
                              </p>
                            </div>
                            
                            <div className="pt-2 flex justify-end">
                              <Button 
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={handleSubmitTransferFee}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "Đang cập nhật..." : "Cập nhật phí"}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-700 pt-6">
                            <h3 className="text-white font-medium mb-4">Rút phí đã giữ lại</h3>
                            <p className="text-gray-400 mb-4">
                              Bạn có thể rút {token.withheldAmount} {token.symbol} từ các khoản phí đã thu được
                            </p>
                            <Button 
                              onClick={handleWithdrawFees}
                              disabled={isSubmitting || token.withheldAmount === "0"}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Rút toàn bộ phí
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                          <XCircle className="w-12 h-12 text-gray-500 mb-3" />
                          <h3 className="text-white text-lg font-medium mb-1">Quyền đã bị thu hồi</h3>
                          <p className="text-gray-400 max-w-md">
                            Bạn đã từ bỏ quyền quản lý phí chuyển khoản. Không thể thay đổi cài đặt này nữa.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metadata" className="mt-0">
                    <div className="space-y-6">
                      <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                        <h3 className="text-white font-medium mb-3">Trạng thái Metadata</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Khả năng thay đổi</span>
                          <span className={`px-2 py-1 rounded text-sm ${token.authorities.metadata === "mutable" ? "bg-green-500/20 text-green-400" : "bg-gray-600/50 text-gray-400"}`}>
                            {token.authorities.metadata === "mutable" ? "Mutable (Có thể thay đổi)" : "Immutable (Không thể thay đổi)"}
                          </span>
                        </div>
                      </div>
                      
                      {token.authorities.metadata === "mutable" ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div>
                              <h3 className="text-white font-medium">Cho phép thay đổi metadata</h3>
                              <p className="text-gray-400 text-sm">Khi bật, metadata của token (tên, biểu tượng, mô tả) có thể được cập nhật</p>
                            </div>
                            <div className="flex items-center">
                              <Switch 
                                checked={metadataMutable}
                                onCheckedChange={setMetadataMutable}
                                className="mr-3"
                              />
                              <span className="text-white text-sm bg-gray-700 px-2 py-1 rounded">
                                {metadataMutable ? "Bật" : "Tắt"}
                              </span>
                            </div>
                          </div>
                          
                          {!metadataMutable && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                              <div className="flex">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 shrink-0 mt-1" />
                                <div className="text-yellow-300 text-sm">
                                  <p className="font-medium">Cảnh báo</p>
                                  <p>Khi tắt khả năng thay đổi metadata, bạn sẽ không thể cập nhật thông tin token (tên, mô tả, hình ảnh) trong tương lai.</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-2 flex justify-end">
                            <Button 
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={handleSubmitAuthorities}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-800/50 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                          <Lock className="w-12 h-12 text-gray-500 mb-3" />
                          <h3 className="text-white text-lg font-medium mb-1">Metadata đã bị khóa</h3>
                          <p className="text-gray-400 max-w-md">
                            Metadata của token này đã được đặt là không thể thay đổi (immutable). 
                            Không thể cập nhật tên, mô tả hay hình ảnh của token.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-1"
          >
            <Card className="bg-gray-900/50 border-gray-700 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2" />
                  Thông tin quan trọng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  Việc quản lý token rất quan trọng. Vui lòng đọc kỹ trước khi thay đổi:
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400 mr-2 shrink-0 mt-0.5" />
                    <span>Việc từ bỏ quyền là <strong>vĩnh viễn</strong> và không thể hoàn tác.</span>
                  </li>
                  <li className="flex text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 shrink-0 mt-0.5" />
                    <span>Bạn nên giữ lại quyền Mint nếu có kế hoạch phát hành thêm token trong tương lai.</span>
                  </li>
                  <li className="flex text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 shrink-0 mt-0.5" />
                    <span>Quyền Freeze cho phép bạn đóng băng các địa chỉ trong trường hợp bị hack hoặc có hoạt động đáng ngờ.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Công cụ khác</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                <Link href={`/tokens/${token.id}/manage/mint`}>
                  <Button variant="outline" className="w-full justify-start text-gray-200 hover:bg-gray-800">
                    Tạo thêm Token
                  </Button>
                </Link>
                <Link href={`/tokens/${token.id}/manage/burn`}>
                  <Button variant="outline" className="w-full justify-start text-gray-200 hover:bg-gray-800">
                    Đốt Token
                  </Button>
                </Link>
                <Link href={`/tokens/${token.id}`}>
                  <Button variant="outline" className="w-full justify-start text-gray-200 hover:bg-gray-800">
                    Xem Token
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </CommonLayout>
  )
} 