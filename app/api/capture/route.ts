import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import { uploadToIPFS } from '@/lib/storacha';
import { createTimestamp } from '@/lib/ots';
import { createClient } from '@supabase/supabase-js';

// Helper to get user from Bearer Token
async function getUserFromRequest(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // "Bearer <token>"

  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // --- AUTH STEP: Get User from Token ---
    const user = await getUserFromRequest(request);
    const userId = user?.id || null;

    const body = await request.json();
    const { url, type = 'URL' } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('📸 Starting Capture for:', url);

    // 1. Launch Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
      console.warn("Page loading warned:", e);
    }

    const htmlContent = await page.content();
    const pageTitle = await page.title();
    await browser.close();

    const hash = crypto.createHash('sha256').update(htmlContent).digest();
    const contentHashHex = hash.toString('hex');
    const ipfsHtmlResult = await uploadToIPFS(htmlContent, 'evidence.html');
    const otsResult = await createTimestamp(hash);

    const capture = await prisma.capture.create({
      data: {
        type,
        url,
        title: pageTitle || url,
        description: 'Captured via TimeCapsule',
        contentHash: contentHashHex,
        ipfsCID: ipfsHtmlResult.cid,
        ipfsUrl: ipfsHtmlResult.url,
        otsProof: otsResult.proof,
        otsStatus: otsResult.status,
        userId: userId, 
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
      { error: 'Failed to create capture', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // --- AUTH STEP: Security Check ---
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please login to view captures' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const captures = await prisma.capture.findMany({
      take: limit,
      where: {
        userId: user.id
      },
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
    return NextResponse.json({ error: 'Failed to fetch captures' }, { status: 500 });
  }
}