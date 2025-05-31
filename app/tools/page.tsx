"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CommonLayout } from "@/components/common-layout"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  CoinsIcon, 
  ShieldCheck,
  Receipt,
  Wallet,
  ArrowUpDown,
  Plus,
  Flame,
  Coins,
  Settings,
  ArrowRight,
  BarChart3,
  Layers,
  ScanLine,
  Gem,
  RefreshCw,
  Send,
} from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-hot-toast"

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
    name: "Transfer Token",
    description: "Transfer tokens to other wallet addresses on Solana network",
    icon: <Send className="w-8 h-8 text-purple-400" />,
    color: "from-purple-500/20 to-pink-500/20",
    href: "/tools/transfer",
    category: "management"
  },
  {
    id: "mint",
    name: "Mint Token",
    description: "Mint additional tokens if you have mint authority",
    icon: <Gem className="w-8 h-8 text-blue-400" />,
    color: "from-blue-500/20 to-cyan-500/20",
    href: "/tools/mint",
    category: "management"
  },
  {
    id: "burn",
    name: "Burn Token",
    description: "Permanently remove tokens to reduce circulating supply",
    icon: <Layers className="w-8 h-8 text-red-400" />,
    color: "from-red-500/20 to-orange-500/20",
    href: "/tools/burn",
    category: "management"
  },
  {
    id: "freeze",
    name: "Freeze Token",
    description: "Freeze/unfreeze token accounts (with Freeze authority)",
    icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />,
    color: "from-cyan-500/20 to-blue-500/20",
    href: "/tools/freeze",
    category: "management"
  },
  {
    id: "claim-fees",
    name: "Claim Token Fees",
    description: "Claim transfer fees from tokens with Transfer Fee feature",
    icon: <Receipt className="w-8 h-8 text-green-400" />,
    color: "from-green-500/20 to-emerald-500/20",
    href: "/tools/claim-fee",
    category: "analytics"
  },
  {
    id: "swap",
    name: "Swap Token",
    description: "Exchange your tokens with other tokens",
    icon: <RefreshCw className="w-8 h-8 text-yellow-400" />,
    color: "from-yellow-500/20 to-amber-500/20",
    href: "/tools/swap",
    category: "exchange"
  },
  {
    id: "analytics",
    name: "Token Analytics",
    description: "View analytics data and performance metrics for tokens",
    icon: <BarChart3 className="w-8 h-8 text-violet-400" />,
    color: "from-violet-500/20 to-indigo-500/20",
    href: "/tools/analytics",
    category: "analytics"
  },
  {
    id: "scan",
    name: "Scan Token",
    description: "Scan and verify tokens using address or QR code",
    icon: <ScanLine className="w-8 h-8 text-pink-400" />,
    color: "from-pink-500/20 to-rose-500/20",
    href: "/tools/scan",
    category: "analytics"
  },
];

// Component cho mỗi card công cụ - tách ra để tránh re-render không cần thiết
const ToolCard: React.FC<{ tool: TokenTool }> = ({ tool }) => {
  const handleToolClick = (e: React.MouseEvent, toolId: string) => {
    // Kiểm tra xem tool này có phải là một trong các công cụ đang phát triển không
    if (toolId === "swap" || toolId === "analytics" || toolId === "scan") {
      e.preventDefault();
      toast("This feature is currently under development. Please check back later!", {
        duration: 4000,
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #475569',
        },
        icon: '🚧',
      });
    }
  };

  return (
    <Link href={tool.href} onClick={(e) => handleToolClick(e, tool.id)}>
      <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 h-full relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-10 hover:opacity-20 transition-opacity duration-300`}></div>
        <CardHeader>
          <div className="mb-2">{tool.icon}</div>
          <CardTitle className="text-white text-xl">{tool.name}</CardTitle>
          <CardDescription className="text-gray-400">{tool.description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="ghost" className="text-purple-400 hover:text-purple-300 p-0 hover:translate-x-1 transition-transform duration-300">
            Use Now <ArrowRight className="ml-1 h-4 w-4" />
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
            Comprehensive toolkit to interact with your tokens
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
                All
              </TabsTrigger>
              <TabsTrigger value="management" className="data-[state=active]:bg-gray-700">
                Management
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="exchange" className="data-[state=active]:bg-gray-700">
                Exchange
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
              <CardTitle className="text-white text-2xl">Enhance your token capabilities</CardTitle>
              <CardDescription className="text-gray-300">
                Create new tokens or explore extensions for your existing tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="space-y-4 max-w-2xl">
                <p className="text-gray-300">
                  With TokenUI toolkit, you can optimize your token experience with powerful extensions and easily interact with your tokens on Solana.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/create">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      Create New Token
                    </Button>
                  </Link>
                  <Link href="/tokens">
                    <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                      View My Tokens
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Claim Fee</CardTitle>
              <CardDescription className="text-gray-300">
                Harvest and withdraw transfer fees
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="space-y-4 max-w-2xl">
                <p className="text-gray-300">
                  Claim transfer fees from tokens with Transfer Fee feature
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/tools/claim-fees">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      Claim Fee
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-end">
                <Coins className="w-24 h-24 text-purple-400 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </CommonLayout>
  )
} 