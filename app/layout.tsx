import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SolanaWalletProvider } from "@/components/wallet-provider"
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Solana Token Manager - Manage Token Extensions",
  description: "Comprehensive tool for creating and managing tokens with extension features on Solana",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaWalletProvider>
          {children}
          <Toaster position="top-right" />
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
