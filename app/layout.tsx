import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
      <body className={inter.className}>{children}</body>
    </html>
  );
}