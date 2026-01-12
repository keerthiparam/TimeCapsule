import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // <--- FIX 1: Use the Singleton, not "new PrismaClient()"
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import { uploadToIPFS, uploadJSONToIPFS } from '@/lib/storacha';
import { createTimestamp } from '@/lib/ots';

// Helper to convert Puppeteer buffer to Uint8Array for hashing
function bufferToUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type = 'URL' } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('📸 Starting Capture for:', url);

    // --- STEP 1: Launch Puppeteer (Bypass Security) ---
    // This replaces "hashURL" which was getting blocked
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Helps in some envs
    });
    
    const page = await browser.newPage();
    
    // Set a real User-Agent so Medium/Cloudflare thinks we are a human
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    try {
      // Navigate and wait for content
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
      console.warn("Page loading warned (might be partial):", e);
    }

    // --- STEP 2: Extract Data ---
    const htmlContent = await page.content(); // Get raw HTML
    const pageTitle = await page.title();
    const screenshotBuffer = await page.screenshot({ type: 'png' }); // Get Screenshot
    
    await browser.close();

    // --- STEP 3: Hashing ---
    // Hash the HTML content
    const hash = crypto.createHash('sha256').update(htmlContent).digest(); // Buffer for OTS
    const contentHashHex = hash.toString('hex'); // Hex string for DB

    console.log('Content hash:', contentHashHex);

    // --- STEP 4: Upload to IPFS ---
    console.log('Uploading HTML to IPFS...');
    // Assumes uploadToIPFS takes (data, filename)
    // Upload the HTML
    const ipfsHtmlResult = await uploadToIPFS(htmlContent, 'evidence.html');
    
    // Upload the Screenshot (Optional but recommended)
    // You might need to adjust uploadToIPFS to handle Buffers, or skip this if strict on time
    // const ipfsImageResult = await uploadToIPFS(screenshotBuffer, 'evidence.png');

    console.log('IPFS CID:', ipfsHtmlResult.cid);

    // --- STEP 5: Create OTS Proof ---
    console.log('Creating OTS timestamp...');
    const otsResult = await createTimestamp(hash); // Pass the buffer hash
    console.log('OTS proof created');

    // --- STEP 6: Save to Database ---
    const capture = await prisma.capture.create({
      data: {
        type,
        url,
        title: pageTitle || url,
        description: 'Captured via TimeCapsule',
        contentHash: contentHashHex,
        ipfsCID: ipfsHtmlResult.cid,
        ipfsUrl: ipfsHtmlResult.url, // Store gateway URL
        otsProof: otsResult.proof,
        otsStatus: otsResult.status, // "PENDING"
        metadata: {
            capturedAt: new Date().toISOString(),
            userAgent: "TimeCapsuleBot/1.0",
        },
      }
    });

    return NextResponse.json({
      success: true,
      capture: {
        id: capture.id,
        contentHash: contentHashHex,
        ipfsCID: ipfsHtmlResult.cid,
        otsStatus: otsResult.status,
      }
    });

  } catch (error: any) {
    console.error('Capture failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create capture',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Keep your GET function exactly as it was
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const captures = await prisma.capture.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        url: true,
        title: true,
        description: true,
        contentHash: true,
        ipfsCID: true,
        otsStatus: true,
        createdAt: true,
        screenshotUrl: true
      }
    });

    return NextResponse.json({ captures });
  } catch (error) {
    console.error('Failed to fetch captures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch captures' },
      { status: 500 }
    );
  }
}