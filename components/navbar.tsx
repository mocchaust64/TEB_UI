"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { WalletButton } from "@/components/wallet-button"
import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"

export default function Navbar() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) {
    return (
      <nav className="flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
          </div>
          <span className="text-white font-medium text-xl">Solana Token Manager</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-16 h-4 bg-gray-700/50 rounded"></div>
          ))}
        </div>
        <div className="hidden md:flex items-center">
          <div className="w-24 h-8 bg-gray-700/50 rounded"></div>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="w-6 h-6" />
        </Button>
      </nav>
    )
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-white/10 ml-36"
    >
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <Image src="/logo.png" alt="TEB Logo" width={32} height={32} />
        </div>
        <span className="text-white font-medium text-xl">Solana Token Manager</span>
      </Link>

      <div className="hidden md:flex items-center space-x-8">
        <NavLink href="/create">Create Token</NavLink>
        <NavLink href="/manage">Manage</NavLink>
        <NavLink href="/portfolio">Portfolio</NavLink>
        <NavLink href="/extensions">Extensions</NavLink>
        <NavLink href="/docs">Documentation</NavLink>
      </div>

      <div className="hidden md:flex items-center">
        <WalletButton />
      </div>

      <Button variant="ghost" size="icon" className="md:hidden text-white">
        <Menu className="w-6 h-6" />
      </Button>
    </motion.nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-300 hover:text-white transition-colors relative group">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
    </Link>
  )
}
