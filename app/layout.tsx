import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar'; // <--- Import the Navbar

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TimeCapsule - Decentralized Evidence Preservation',
  description: 'Preserve digital evidence with tamper-proof timestamps using Bitcoin & IPFS',
  keywords: 'evidence preservation, timestamping, IPFS, OpenTimestamps, Bitcoin, journalism, OSINT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en"> 
      {/* Added 'dark' class to force dark mode if you configured it in globals.css */}
      
      <body className={inter.className}>
        
        {/* 1. The Navbar goes here (Top of page) */}
        <Navbar />
        
        {/* 2. The Main Content goes here */}
        <main className="min-h-screen bg-background text-foreground">
          {children}
        </main>

      </body>
    </html>
  );
}