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
  Plus,
  Flame,
  Coins,
  Settings,
  ArrowRight,
  Layers,
  Gem,
  Send,
  Key,
  FileEdit,
  XCircle
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
    id: "create-token",
    name: "Create Token",
    description: "Create a new token with customizable extensions",
    icon: <Plus className="w-8 h-8 text-emerald-400" />,
    color: "from-emerald-500/20 to-teal-500/20",
    href: "/create",
    category: "management"
  },
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
    id: "delegate-transfer",
    name: "Permanent Delegate Recovery",
    description: "Recover tokens from other wallets using Permanent Delegate authority",
    icon: <Key className="w-8 h-8 text-indigo-400" />,
    color: "from-indigo-500/20 to-blue-500/20",
    href: "/tools/permanent-delegate-recovery",
    category: "management"
  },
  {
    id: "update-metadata",
    name: "Update Metadata",
    description: "Update token metadata and information",
    icon: <FileEdit className="w-8 h-8 text-amber-400" />,
    color: "from-amber-500/20 to-yellow-500/20",
    href: "/tools/update-metadata",
    category: "management"
  },
  {
    id: "close-mint",
    name: "Close Mint",
    description: "Close token mint authority permanently",
    icon: <XCircle className="w-8 h-8 text-rose-400" />,
    color: "from-rose-500/20 to-red-500/20",
    href: "/tools/close-mint",
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
  }
];

// Component cho mỗi card công cụ - tách ra để tránh re-render không cần thiết
const ToolCard: React.FC<{ tool: TokenTool }> = ({ tool }) => {
  return (
    <Link href={tool.href}>
      <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 h-full relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-10 hover:opacity-20 transition-opacity duration-300`}></div>
        <CardHeader>
          <div className="mb-2">{tool.icon}</div>
          <CardTitle className="text-white text-lg sm:text-xl">{tool.name}</CardTitle>
          <CardDescription className="text-gray-400 text-xs sm:text-sm">{tool.description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="ghost" className="text-purple-400 hover:text-purple-300 p-0 hover:translate-x-1 transition-transform duration-300 text-sm sm:text-base">
            Use Now <ArrowRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

// Component cho tab content
const ToolsGrid: React.FC<{ tools: TokenTool[] }> = ({ tools }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
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
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-10"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4">
            Token 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}Tools
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">
            Comprehensive toolkit to interact with your tokens
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-gray-800/50 border-b border-gray-700 w-full justify-start mb-4 sm:mb-6 overflow-x-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 text-xs sm:text-sm">
                All
              </TabsTrigger>
              <TabsTrigger value="management" className="data-[state=active]:bg-gray-700 text-xs sm:text-sm">
                Management
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700 text-xs sm:text-sm">
                Analytics
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
          </Tabs>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-gray-700">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white text-xl sm:text-2xl">Enhance your token capabilities</CardTitle>
              <CardDescription className="text-gray-300 text-xs sm:text-sm">
                Create new tokens or explore extensions for your existing tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-3 sm:gap-4 items-start md:items-center justify-between p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3 sm:space-y-4 max-w-2xl">
                <p className="text-gray-300 text-xs sm:text-sm">
                  With TokenUI toolkit, you can optimize your token experience with powerful extensions and easily interact with your tokens on Solana.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Link href="/create">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm">
                      Create New Token
                    </Button>
                  </Link>
                  <Link href="/tokens">
                    <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800 text-xs sm:text-sm">
                      View My Tokens
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <CoinsIcon className="w-16 h-16 text-purple-400 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Helpful Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-base sm:text-lg">Token Extension Documentation</CardTitle>
                <CardDescription className="text-gray-400 text-xs sm:text-sm">
                  Comprehensive documentation about Solana token extensions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-gray-300 text-xs sm:text-sm mb-4">
                  Learn about all available token extensions and how to use them in your projects.
                </p>
                <a 
                  href="https://github.com/mocchaust64/token-extensions-boost" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm inline-flex items-center"
                >
                  View Documentation <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </a>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-base sm:text-lg">TokenUI GitHub</CardTitle>
                <CardDescription className="text-gray-400 text-xs sm:text-sm">
                  Open source code and contributions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-gray-300 text-xs sm:text-sm mb-4">
                  View the source code, report issues, or contribute to the TokenUI project on GitHub.
                </p>
                <a 
                  href="https://github.com/mocchaust64/TEB_UI" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm inline-flex items-center"
                >
                  View Repository <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </a>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-base sm:text-lg">Token Extensions Tutorial</CardTitle>
                <CardDescription className="text-gray-400 text-xs sm:text-sm">
                  Step-by-step guides to use token extensions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-gray-300 text-xs sm:text-sm mb-4">
                  Comprehensive tutorials and examples coming soon in English.
                </p>
                <span 
                  className="text-purple-400 text-xs sm:text-sm inline-flex items-center"
                >
                  Coming Soon <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </span>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </CommonLayout>
  )
} 