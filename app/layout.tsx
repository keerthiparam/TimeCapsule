import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TimeCapsule — Decentralized Evidence Preservation',
  description:
    'Preserve digital evidence with tamper-proof timestamps using Bitcoin & IPFS',
  keywords:
    'evidence preservation, timestamping, IPFS, OpenTimestamps, Bitcoin, journalism, OSINT',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${inter.className}
          min-h-screen
          text-foreground
          antialiased
          relative
          overflow-x-hidden
        `}
      >
        {/* 🌌 Background glass layers */}
        <div className="fixed inset-0 -z-10">
          {/* gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/40 to-background" />

          {/* blur glow blobs */}
          <div className="absolute top-[-10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[300px] w-[300px] rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        {/* 🌐 Global Navbar */}
        <Navbar />

        {/* 📦 Main content wrapper */}
        <main className="relative min-h-screen backdrop-blur-[2px]">
          {children}
        </main>
      </body>
    </html>
  )
}
