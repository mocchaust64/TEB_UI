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
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any'
      },
      {
        url: '/icon.png',
        type: 'image/png',
        sizes: '32x32'
      }
    ],
    apple: {
      url: '/apple-icon.png',
      sizes: '180x180',
      type: 'image/png'
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <style>
          {`
            /* Ẩn thông báo lỗi 429 từ Next.js */
            nextjs-portal {
              display: none !important;
            }
          `}
        </style>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Ngăn chặn sự kiện lỗi trước khi Next.js xử lý
            window.addEventListener('error', function(event) {
              // Kiểm tra nếu là lỗi 429
              if (event.message && event.message.includes('429')) {
                event.stopImmediatePropagation();
              }
            });
            window.addEventListener('unhandledrejection', function(event) {
              // Kiểm tra nếu là lỗi 429
              if (event.reason && event.reason.message && event.reason.message.includes('429')) {
                event.stopImmediatePropagation();
              }
            });
          `
        }} />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-9SGC057FTB" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-9SGC057FTB');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <SolanaWalletProvider>
          {children}
          <Toaster position="top-right" />
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
