"use client"

import { SparklesCore } from "@/components/sparkles"
import { usePathname } from "next/navigation"

interface PageBackgroundProps {
  className?: string
}

export function PageBackground({ className = "w-full h-full" }: PageBackgroundProps) {
  const pathname = usePathname()
  
  // Chỉ hiển thị hiệu ứng sparkles ở trang chủ
  const isHomePage = pathname === "/"
  
  if (isHomePage) {
    return (
      <div className={`absolute inset-0 z-0 ${className}`}>
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
    )
  }
  
  // Các trang khác chỉ có nền đen đơn giản
  return (
    <div className={`absolute inset-0 z-0 bg-black ${className}`}></div>
  )
} 