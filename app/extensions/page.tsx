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
            Create advanced SPL tokens with Token-2022 extensions
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Create Tokens with Extensions</h2>
              <p className="text-muted-foreground">
                Token-2022 is a new token standard on Solana, allowing you to create tokens with advanced features such as:
              </p>
              
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Automatic transfer fees</li>
                <li>Non-transferable tokens</li>
                <li>Interest-bearing tokens</li>
                <li>Secure token transfers with zero-knowledge proof</li>
                <li>And many more features...</li>
              </ul>

              <Button 
                onClick={handleNavigateToCreate}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Create New Token <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 