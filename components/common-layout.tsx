"use client"

import React from "react"
import Navbar from "@/components/navbar"
import { PageBackground } from "@/components/page-background"

interface CommonLayoutProps {
  children: React.ReactNode
}

export function CommonLayout({ children }: CommonLayoutProps) {
  return (
    <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
      {/* Background - chỉ hiển thị hiệu ứng ở trang chủ */}
      <PageBackground />

      <div className="relative z-10">
        <Navbar />
        {children}
      </div>
    </main>
  )
} 