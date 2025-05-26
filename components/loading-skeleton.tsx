import React from "react"
import { Card } from "@/components/ui/card"

export function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-12">
      <div className="h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl bg-gray-900/50 border border-gray-700 rounded-lg p-8">
          <div className="h-8 w-48 bg-gray-700/50 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-700/50 rounded"></div>
            <div className="h-10 bg-gray-700/50 rounded"></div>
            <div className="h-36 bg-gray-700/50 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black/[0.96] antialiased">
      <LoadingSkeleton />
    </div>
  )
} 