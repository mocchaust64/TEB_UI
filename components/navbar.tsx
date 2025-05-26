"use client"

import { Button } from "@/components/ui/button"
import { 
  Menu, 
  X, 
  Plus, 
  Coins, 
  Settings, 
  BookOpen, 
  Layers,
  Wrench,
  Search
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { WalletButton } from "@/components/wallet-button"
import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"

export default function Navbar() {
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Đóng menu khi chuyển trang
  useEffect(() => {
    const handleRouteChange = () => setIsMobileMenuOpen(false)
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
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
          {[...Array(6)].map((_, i) => (
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

  const menuVariants = {
    hidden: { 
      opacity: 0,
      y: -20,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.2 
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2 
      }
    }
  };

  const menuItemVariants = {
    hidden: { 
      opacity: 0, 
      x: -10 
    },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        delay: i * 0.05,
        duration: 0.2
      }
    }),
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.1 
      }
    }
  };

  const mobileLinks = [
    { href: "/create", label: "Create Token", icon: <Plus className="w-5 h-5 mr-3 text-purple-400" /> },
    { href: "/tokens", label: "Tokens", icon: <Coins className="w-5 h-5 mr-3 text-blue-400" /> },
    { href: "/tools", label: "Tools", icon: <Wrench className="w-5 h-5 mr-3 text-green-400" /> },
    { href: "/manage", label: "Manage", icon: <Settings className="w-5 h-5 mr-3 text-yellow-400" /> },
    { href: "/extensions", label: "Extensions", icon: <Layers className="w-5 h-5 mr-3 text-pink-400" /> },
    { href: "/docs", label: "Documentation", icon: <BookOpen className="w-5 h-5 mr-3 text-cyan-400" /> },
  ];

  // Lọc các liên kết khi tìm kiếm
  const filteredLinks = searchQuery 
    ? mobileLinks.filter(link => 
        link.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mobileLinks;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-white/10"
      >
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image src="/logo.png" alt="TEB Logo" width={32} height={32} />
          </div>
          <span className="text-white font-medium text-xl">Solana Token Manager</span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <NavLink href="/create">Create Token</NavLink>
          <NavLink href="/tokens">Tokens</NavLink>
          <NavLink href="/tools">Tools</NavLink>
          <NavLink href="/manage">Manage</NavLink>
          <NavLink href="/extensions">Extensions</NavLink>
          <NavLink href="/docs">Documentation</NavLink>
        </div>

        <div className="hidden md:flex items-center">
          <WalletButton />
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </Button>
      </motion.nav>

      {/* Menu mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden fixed top-[73px] left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-white/10 max-h-[calc(100vh-73px)] overflow-y-auto"
          >
            <div className="py-4 px-4 flex flex-col space-y-2">
              {/* Search input */}
              <motion.div
                variants={menuItemVariants}
                initial="hidden"
                animate="visible"
                custom={0}
                className="mb-2"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="pl-10 pr-4 py-2 bg-gray-800/70 border-gray-700 text-white w-full rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Hiển thị kết quả tìm kiếm */}
              {filteredLinks.length === 0 ? (
                <motion.div
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                  className="text-center py-6 text-gray-400"
                >
                  Không tìm thấy kết quả phù hợp
                </motion.div>
              ) : (
                filteredLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    custom={i + 1} // +1 vì có search box ở vị trí 0
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <MobileNavLink 
                      href={link.href} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      icon={link.icon}
                    >
                      {link.label}
                    </MobileNavLink>
                  </motion.div>
                ))
              )}
              
              <motion.div 
                variants={menuItemVariants}
                custom={mobileLinks.length + 1}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="pt-4 mt-2 border-t border-gray-700"
              >
                <div className="px-4 py-3">
                  <WalletButton />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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

function MobileNavLink({ href, onClick, icon, children }: { 
  href: string; 
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode 
}) {
  const [isPressed, setIsPressed] = useState(false);

  // Xử lý hiệu ứng nhấn
  const handlePressDown = () => setIsPressed(true);
  const handlePressUp = () => setIsPressed(false);

  return (
    <Link 
      href={href} 
      className={`flex items-center px-4 py-3.5 rounded-md text-lg text-gray-200 hover:text-white transition-colors relative overflow-hidden
                 ${isPressed ? 'bg-gray-800/70' : 'hover:bg-gray-800/40'}`}
      onClick={onClick}
      onMouseDown={handlePressDown}
      onMouseUp={handlePressUp}
      onMouseLeave={handlePressUp}
      onTouchStart={handlePressDown}
      onTouchEnd={handlePressUp}
    >
      {/* Hiệu ứng ripple */}
      {isPressed && (
        <span className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/20 animate-ripple" />
      )}

      {/* Icon và text */}
      {icon}
      <span>{children}</span>
      
      <div className="ml-auto opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6"/>
        </svg>
      </div>
    </Link>
  )
}
