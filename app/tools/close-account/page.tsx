"use client"

import { CommonLayout } from "@/components/common-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { PageLoadingSkeleton } from "@/components/loading-skeleton"

// Sử dụng dynamic import để lazy load component nặng
const CloseAccountForm = dynamic(
  () => import("@/app/components/close-account/close-account-form"),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: false,
  }
)

const CloseAccountPage = () => {
  const router = useRouter();
  
  return (
    <CommonLayout>
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white p-0 flex items-center gap-1"
            onClick={() => router.push("/tools")}
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Close Token Accounts
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Close zero-balance token accounts and reclaim your SOL rent fees
          </p>
        </div>

        <Suspense fallback={<PageLoadingSkeleton />}>
          <CloseAccountForm />
        </Suspense>
      </div>
    </CommonLayout>
  );
};

export default CloseAccountPage; 