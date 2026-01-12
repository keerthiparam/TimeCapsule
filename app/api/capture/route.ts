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
    const userId = user?.id || null;

    const body = await request.json();
    const { type = 'URL' } = body;

    let contentToHash: string | Buffer = "";
    let pageTitle = "";
    let ipfsFileName = "";

    // === 1. HANDLE URL (PUPPETEER) ===
    if (type === 'URL') {
      const { url } = body;
      if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

      console.log('📸 Puppeteer Capturing (Standalone Mode):', url);
      
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

      // --- THE SANITIZER: Make the page static and self-contained ---
      await page.evaluate(async () => {
        // 1. INLINE IMAGES (Convert to Base64 so they don't get blocked)
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
            // Twitter specific: grab the high-res version if available
            const src = img.src || img.dataset.src;
            if (src && !src.startsWith('data:')) {
                const base64 = await toBase64(src);
                if (base64) {
                    img.src = base64 as string;
                    // Remove attributes that trigger external loads
                    img.removeAttribute('srcset'); 
                    img.removeAttribute('data-src');
                    img.removeAttribute('loading'); 
                }
            }
        }

        // 2. NUKE SCRIPTS & EXTERNAL CONNECTIONS (Fixes CSP Errors)
        const selectorsToRemove = [
            'script',                // The brain
            'iframe',                // External windows
            'noscript',              // Fallbacks
            'object', 'embed',       // Flash/Plugins
            'link[rel="manifest"]',  // App Manifests (Twitter PWA)
            'link[rel="preload"]',   // Script pre-loaders
            'link[rel="modulepreload"]',
            'meta[http-equiv="Content-Security-Policy"]' // Remove original CSP
        ];
        
        document.querySelectorAll(selectorsToRemove.join(',')).forEach(el => el.remove());

        // 3. CLEANUP FORMS & EVENTS
        document.querySelectorAll('*').forEach(el => {
            // Remove event handlers like onclick="hack()"
            const attrs = el.getAttributeNames().filter(name => name.startsWith('on'));
            attrs.forEach(name => el.removeAttribute(name));
        });
        
        // Remove popups
        document.querySelectorAll('[role="dialog"], .cookie-banner, #credential_picker_container').forEach(el => el.remove());
      });

      contentToHash = await page.content();
      pageTitle = await page.title();
      
      await browser.close();
      
      ipfsFileName = 'evidence.html';

    // === 2. HANDLE FILE UPLOAD ===
    } else if (type === 'FILE') {
      const { fileData, fileName } = body; 
      // fileData comes as "data:image/png;base64,....."
      if (!fileData) return NextResponse.json({ error: 'File required' }, { status: 400 });

      // Strip the prefix (data:application/pdf;base64,) to get raw bytes
      const base64Content = fileData.split(',')[1]; 
      contentToHash = Buffer.from(base64Content, 'base64');
      
      pageTitle = fileName || "Uploaded File";
      ipfsFileName = fileName || 'file.bin';
    }

    // === COMMON LOGIC ===
    
    // 1. Hash content
    const hash = crypto.createHash('sha256').update(contentToHash).digest();
    const contentHashHex = hash.toString('hex');

    // 2. IPFS Upload
    const ipfsResult = await uploadToIPFS(contentToHash, ipfsFileName);

    // 3. OTS Timestamp
    const otsResult = await createTimestamp(hash);

    // 4. Save to DB
    const capture = await prisma.capture.create({
      data: {
        type: type, 
        url: body.url || null, // Optional now
        title: pageTitle,
        contentHash: contentHashHex,
        ipfsCID: ipfsResult.cid,
        ipfsUrl: ipfsResult.url,
        otsProof: otsResult.proof,
        otsStatus: otsResult.status,
        userId: userId, 
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

// GET function stays the same as before...
export async function GET(request: NextRequest) {
    // ... (Use the same GET code I gave you in the last step) ...
    // Just copy-paste the getUserFromRequest logic if needed
    try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const captures = await prisma.capture.findMany({
      take: limit,
      where: { userId: user.id },
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