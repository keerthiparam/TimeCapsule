// API Route: Download OTS proof file
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Capture ID is required' },
        { status: 400 }
      );
    }

    // Get the capture with OTS proof
    const capture = await prisma.capture.findUnique({
      where: { id },
      select: { 
        otsProof: true, 
        id: true,
        otsStatus: true 
      }
    });

    if (!capture) {
      return NextResponse.json(
        { error: 'Capture not found' },
        { status: 404 }
      );
    }

    if (!capture.otsProof) {
      return NextResponse.json(
        { error: 'OTS proof not available yet' },
        { status: 404 }
      );
    }

    // Convert Buffer to Uint8Array for NextResponse
    const proofBytes = new Uint8Array(capture.otsProof);

    // Return the proof as a downloadable .ots file
    return new NextResponse(proofBytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="timecapsule-${capture.id}.ots"`,
        'Cache-Control': 'public, max-age=31536000',
      }
    });

  } catch (error) {
    console.error('Download failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to download proof',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}