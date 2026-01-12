import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TimeCapsule — Decentralized Evidence Preservation',
  description:
    'Preserve digital evidence with tamper-proof timestamps using Bitcoin & IPFS',
  keywords:
    'evidence preservation, timestamping, IPFS, OpenTimestamps, Bitcoin, journalism, OSINT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${inter.className}
          min-h-screen
          bg-gradient-to-br
          from-background
          via-muted
          to-background
          text-foreground
          antialiased
        `}
      >
        {/* Navbar stays global */}
        <Navbar />

        {/* Main app content */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
