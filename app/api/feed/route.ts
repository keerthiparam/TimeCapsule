import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Fetch the 50 most recent PUBLIC captures
    const captures = await prisma.capture.findMany({
      where: { 
        isPublic: true // <--- CRITICAL: Only show what users voluntarily shared
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, 
        type: true, 
        url: true, 
        title: true,
        contentHash: true, 
        ipfsCID: true, 
        otsStatus: true,
        createdAt: true, 
        metadata: true,
        // We do NOT select userId or walletAddress to protect privacy
      }
    });

    return NextResponse.json({ captures });
  } catch (error) {
    console.error("Feed Error:", error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}