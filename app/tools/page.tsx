"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CommonLayout } from "@/components/common-layout"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  Coins, 
  Settings, 
  ArrowRight,
  BarChart3,
  Layers,
  ScanLine,
  Gem,
  RefreshCw,
  Send,
  ShieldCheck,
  Calculator
} from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Định nghĩa kiểu dữ liệu cho tool
interface TokenTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  category: "management" | "analytics" | "exchange";
}

// Dữ liệu các công cụ token
const tokenTools: TokenTool[] = [
  {
    id: "transfer",
    name: "Chuyển Token",
    description: "Chuyển token đến địa chỉ ví khác trên mạng Solana",
    icon: <Send className="w-8 h-8 text-purple-400" />,
    color: "from-purple-500/20 to-pink-500/20",
    href: "/tools/transfer",
    category: "management"
  },
  {
    id: "mint",
    name: "Đúc Token",
    description: "Đúc thêm token cho token của bạn (nếu có quyền Mint)",
    icon: <Gem className="w-8 h-8 text-blue-400" />,
    color: "from-blue-500/20 to-cyan-500/20",
    href: "/tools/mint",
    category: "management"
  },
  {
    id: "burn",
    name: "Đốt Token",
    description: "Hủy token vĩnh viễn để giảm lượng cung lưu hành",
    icon: <Layers className="w-8 h-8 text-red-400" />,
    color: "from-red-500/20 to-orange-500/20",
    href: "/tools/burn",
    category: "management"
  },
  {
    id: "freeze",
    name: "Đóng băng Token",
    description: "Đóng băng/mở đóng băng tài khoản token (với quyền Freeze)",
    icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />,
    color: "from-cyan-500/20 to-blue-500/20",
    href: "/tools/freeze",
    category: "management"
  },
  {
    id: "calculator",
    name: "Máy tính Token",
    description: "Tính toán giá trị, chuyển đổi và phân phối token",
    icon: <Calculator className="w-8 h-8 text-green-400" />,
    color: "from-green-500/20 to-emerald-500/20",
    href: "/tools/calculator",
    category: "analytics"
  },
  {
    id: "swap",
    name: "Swap Token",
    description: "Trao đổi token của bạn với các token khác",
    icon: <RefreshCw className="w-8 h-8 text-yellow-400" />,
    color: "from-yellow-500/20 to-amber-500/20",
    href: "/tools/swap",
    category: "exchange"
  },
  {
    id: "analytics",
    name: "Phân tích Token",
    description: "Xem dữ liệu phân tích và chỉ số hiệu suất của token",
    icon: <BarChart3 className="w-8 h-8 text-violet-400" />,
    color: "from-violet-500/20 to-indigo-500/20",
    href: "/tools/analytics",
    category: "analytics"
  },
  {
    id: "scan",
    name: "Quét Token",
    description: "Quét và xác minh token bằng địa chỉ hoặc mã QR",
    icon: <ScanLine className="w-8 h-8 text-pink-400" />,
    color: "from-pink-500/20 to-rose-500/20",
    href: "/tools/scan",
    category: "analytics"
  },
];

// Component cho mỗi card công cụ - tách ra để tránh re-render không cần thiết
const ToolCard: React.FC<{ tool: TokenTool }> = ({ tool }) => {
  return (
    <Link href={tool.href}>
      <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 h-full relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-10 hover:opacity-20 transition-opacity duration-300`}></div>
        <CardHeader>
          <div className="mb-2">{tool.icon}</div>
          <CardTitle className="text-white text-xl">{tool.name}</CardTitle>
          <CardDescription className="text-gray-400">{tool.description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="ghost" className="text-purple-400 hover:text-purple-300 p-0 hover:translate-x-1 transition-transform duration-300">
            Dùng ngay <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

// Component cho tab content
const ToolsGrid: React.FC<{ tools: TokenTool[] }> = ({ tools }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
};

export default function TokenTools() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Mô phỏng việc tải dữ liệu
    const loadData = async () => {
      // Trong ứng dụng thực tế, bạn có thể fetch dữ liệu từ API
      setIsLoading(false)
    }
    
    loadData()
  }, []);

  // Hiển thị loading skeleton khi đang tải dữ liệu
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
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Token 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}Tools
            </span>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Bộ công cụ toàn diện để tương tác với token của bạn
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-gray-800/50 border-b border-gray-700 w-full justify-start mb-6">
              <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
                Tất cả
              </TabsTrigger>
              <TabsTrigger value="management" className="data-[state=active]:bg-gray-700">
                Quản lý
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
                Phân tích
              </TabsTrigger>
              <TabsTrigger value="exchange" className="data-[state=active]:bg-gray-700">
                Giao dịch
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <ToolsGrid tools={tokenTools} />
            </TabsContent>

            <TabsContent value="management" className="mt-0">
              <ToolsGrid tools={tokenTools.filter(tool => tool.category === "management")} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <ToolsGrid tools={tokenTools.filter(tool => tool.category === "analytics")} />
            </TabsContent>

            <TabsContent value="exchange" className="mt-0">
              <ToolsGrid tools={tokenTools.filter(tool => tool.category === "exchange")} />
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Nâng cao năng lực token của bạn</CardTitle>
              <CardDescription className="text-gray-300">
                Tạo token mới hoặc khám phá các tính năng mở rộng cho token hiện tại
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="space-y-4 max-w-2xl">
                <p className="text-gray-300">
                  Với bộ công cụ TokenUI, bạn có thể tối ưu hóa trải nghiệm của token với các tính năng mở rộng mạnh mẽ và dễ dàng tương tác với token của mình trên Solana.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/create">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      Tạo Token Mới
                    </Button>
                  </Link>
                  <Link href="/tokens">
                    <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                      Xem Token Của Tôi
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-end">
                <Settings className="w-24 h-24 text-purple-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </CommonLayout>
  )
} 