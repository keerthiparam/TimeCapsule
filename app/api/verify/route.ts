// API Route: Verify capture proof
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyTimestamp, upgradeTimestamp } from '@/lib/ots';
import { hashContentHex } from '@/lib/crypto';
import { fetchFromIPFS } from '@/lib/storacha';

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

    // Get capture from database
    const capture = await prisma.capture.findUnique({
      where: { id }
    });

    if (!capture) {
      return NextResponse.json(
        { error: 'Capture not found' },
        { status: 404 }
      );
    }

    // If no OTS proof yet, return early
    if (!capture.otsProof) {
      return NextResponse.json({
        verified: false,
        message: 'No timestamp proof available yet'
      });
    }

    // Try to upgrade proof if incomplete
    let otsProof = capture.otsProof;
    let otsStatus = capture.otsStatus;

    if (capture.otsStatus === 'INCOMPLETE') {
      console.log('Attempting to upgrade OTS proof...');
      const upgraded = await upgradeTimestamp(capture.otsProof);
      
      if (upgraded.status === 'COMPLETE') {
        // Update database with complete proof
        await prisma.capture.update({
          where: { id },
          data: {
            otsProof: upgraded.proof,
            otsStatus: 'COMPLETE'
          }
        });
        otsProof = upgraded.proof;
        otsStatus = 'COMPLETE';
        console.log('OTS proof upgraded to COMPLETE');
      }
    }

    // Verify the proof
    const hash = Buffer.from(capture.contentHash, 'hex');
    const verification = await verifyTimestamp(otsProof, hash);

    // Verify IPFS content still matches
    let ipfsIntact = false;
    if (capture.ipfsCID) {
      try {
        const ipfsContent = await fetchFromIPFS(capture.ipfsCID);
        const ipfsHash = hashContentHex(ipfsContent);
        ipfsIntact = ipfsHash === capture.contentHash;
      } catch (error) {
        console.error('IPFS verification failed:', error);
      }
    }

    return NextResponse.json({
      verified: verification.verified,
      capture: {
        id: capture.id,
        url: capture.url,
        title: capture.title,
        contentHash: capture.contentHash,
        ipfsCID: capture.ipfsCID,
        ipfsUrl: capture.ipfsUrl,
        otsStatus,
        createdAt: capture.createdAt
      },
      verification: {
        ...verification,
        ipfsIntact,
        blockHeight: verification.blockHeight,
        timestamp: verification.timestamp
      }
    });

  } catch (error) {
    console.error('Verification failed:', error);
    return NextResponse.json(
      { 
        error: 'Verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Endpoint to manually trigger proof upgrade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Capture ID is required' },
        { status: 400 }
      );
    }

    const capture = await prisma.capture.findUnique({
      where: { id }
    });

    if (!capture || !capture.otsProof) {
      return NextResponse.json(
        { error: 'No proof to upgrade' },
        { status: 404 }
      );
    }

    // Attempt upgrade
    const upgraded = await upgradeTimestamp(capture.otsProof);

    // Update database
    await prisma.capture.update({
      where: { id },
      data: {
        otsProof: upgraded.proof,
        otsStatus: upgraded.status
      }
    });

    return NextResponse.json({
      success: true,
      status: upgraded.status,
      message: upgraded.status === 'COMPLETE' 
        ? 'Proof successfully upgraded!' 
        : 'Proof still pending Bitcoin confirmation'
    });

  } catch (error) {
    console.error('Upgrade failed:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade proof' },
      { status: 500 }
    );
  }
}