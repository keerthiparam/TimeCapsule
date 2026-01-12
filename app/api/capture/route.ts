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
  const token = authHeader?.split(' ')[1]; 
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // --- FIX 1: Extract Identity ---
    const userId = user?.id || null;
    // Get wallet address if they logged in via MetaMask
    const walletAddress = user?.user_metadata?.wallet_address || null;

    const body = await request.json();
    const { type = 'URL' } = body;

    let contentToHash: string | Buffer = "";
    let pageTitle = "";
    let ipfsFileName = "";

    // === 1. HANDLE URL (PUPPETEER) ===
    if (type === 'URL') {
      const { url } = body;
      if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

      console.log('📸 Puppeteer Capturing:', url);
      
      const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
      
      const page = await browser.newPage();
      
      // Allow request interception to handle images
      await page.setRequestInterception(true);
      page.on('request', (req) => req.continue());

      await page.setViewport({ width: 1280, height: 2000 }); 
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch (e) {
        console.warn("Page loading warned:", e);
      }

      // --- THE SANITIZER ---
      await page.evaluate(async () => {
        const toBase64 = async (url: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (e) { return null; }
        };

        const images = document.querySelectorAll('img');
        for (const img of images) {
            const src = img.src || img.dataset.src;
            if (src && !src.startsWith('data:')) {
                const base64 = await toBase64(src);
                if (base64) {
                    img.src = base64 as string;
                    img.removeAttribute('srcset'); 
                    img.removeAttribute('data-src');
                    img.removeAttribute('loading'); 
                }
            }
        }

        const selectorsToRemove = [
            'script', 'iframe', 'noscript', 'object', 'embed',
            'link[rel="manifest"]', 'link[rel="preload"]', 'link[rel="modulepreload"]',
            'meta[http-equiv="Content-Security-Policy"]'
        ];
        
        document.querySelectorAll(selectorsToRemove.join(',')).forEach(el => el.remove());

        document.querySelectorAll('*').forEach(el => {
            const attrs = el.getAttributeNames().filter(name => name.startsWith('on'));
            attrs.forEach(name => el.removeAttribute(name));
        });
        
        document.querySelectorAll('[role="dialog"], .cookie-banner, #credential_picker_container').forEach(el => el.remove());
      });

      contentToHash = await page.content();
      pageTitle = await page.title();
      
      await browser.close();
      
      ipfsFileName = 'evidence.html';

    // === 2. HANDLE FILE UPLOAD ===
    } else if (type === 'FILE') {
      const { fileData, fileName } = body; 
      if (!fileData) return NextResponse.json({ error: 'File required' }, { status: 400 });

      const base64Content = fileData.split(',')[1]; 
      contentToHash = Buffer.from(base64Content, 'base64');
      
      pageTitle = fileName || "Uploaded File";
      ipfsFileName = fileName || 'file.bin';
    }

    // === COMMON LOGIC ===
    const hash = crypto.createHash('sha256').update(contentToHash).digest();
    const contentHashHex = hash.toString('hex');

    const ipfsResult = await uploadToIPFS(contentToHash, ipfsFileName);
    const otsResult = await createTimestamp(hash);

    // --- FIX 2: Save walletAddress to DB ---
    const capture = await prisma.capture.create({
      data: {
        type: type, 
        url: body.url || null, 
        title: pageTitle,
        contentHash: contentHashHex,
        ipfsCID: ipfsResult.cid,
        ipfsUrl: ipfsResult.url,
        otsProof: otsResult.proof,
        otsStatus: otsResult.status,
        
        userId: userId, 
        walletAddress: walletAddress, // <--- SAVING WALLET HERE

        metadata: {
            capturedAt: new Date().toISOString(),
            originalName: body.fileName || null
        },
      }
    });

    return NextResponse.json({ success: true, capture });

  } catch (error: any) {
    console.error('Capture failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const walletAddress = user.user_metadata?.wallet_address;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // --- FIX 3: Robust Query Logic ---
    // If wallet exists, search for matches on ID OR Wallet.
    // This allows persisting data across anonymous sessions if wallet matches.
    const whereClause = walletAddress 
      ? { OR: [{ userId: userId }, { walletAddress: walletAddress }] }
      : { userId: userId };

    const captures = await prisma.capture.findMany({
      take: limit,
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, url: true, title: true,
        contentHash: true, ipfsCID: true, otsStatus: true,
        createdAt: true
      }
    });
    return NextResponse.json({ captures });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}