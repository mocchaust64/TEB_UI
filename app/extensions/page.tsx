"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

export default function TokenExtensionsPage() {
  const router = useRouter()

  const handleNavigateToCreate = () => {
    router.push('/create')
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Token Extensions</h1>
          <p className="text-lg text-muted-foreground">
            Tạo token SPL nâng cao với các tiện ích mở rộng Token-2022
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tạo Token với Extensions</h2>
              <p className="text-muted-foreground">
                Token-2022 là chuẩn token mới trên Solana, cho phép bạn tạo token với nhiều tính năng cao cấp như:
              </p>
              
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Fee tự động khi chuyển token</li>
                <li>Token không thể chuyển nhượng</li>
                <li>Token tích lũy lãi suất</li>
                <li>Chuyển token bảo mật với zero-knowledge proof</li>
                <li>Và nhiều tính năng khác...</li>
              </ul>

              <Button 
                onClick={handleNavigateToCreate}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Tạo Token Mới <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 