// Cryptographic utilities for TimeCapsule
import crypto from 'crypto';

/**
 * Generate SHA-256 hash of content
 */
export function hashContent(content: string | Buffer): Buffer {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest();
}

/**
 * Generate SHA-256 hash and return as hex string
 */
export function hashContentHex(content: string | Buffer): string {
  return hashContent(content).toString('hex');
}

// ❌ DELETED: hashURL() 
// Reason: It causes 403 Forbidden errors. We now handle fetching 
// via Puppeteer in app/api/capture/route.ts

/**
 * Hash file content
 */
export async function hashFile(file: File): Promise<{
  hash: Buffer;
  content: Buffer;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const content = Buffer.from(arrayBuffer);
  const hash = hashContent(content);

  return { hash, content };
}

/**
 * Verify content matches hash
 */
export function verifyHash(content: string | Buffer, expectedHash: string): boolean {
  const actualHash = hashContentHex(content);
  return actualHash === expectedHash;
}

/**
 * Generate a unique capture ID
 */
export function generateCaptureId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a merkle root from multiple hashes (for batch verification)
 */
export function createMerkleRoot(hashes: Buffer[]): Buffer {
  if (hashes.length === 0) {
    throw new Error('Cannot create merkle root from empty array');
  }

  if (hashes.length === 1) {
    return hashes[0];
  }

  const newLevel: Buffer[] = [];
  
  for (let i = 0; i < hashes.length; i += 2) {
    if (i + 1 < hashes.length) {
      const combined = Buffer.concat([hashes[i], hashes[i + 1]]);
      newLevel.push(hashContent(combined));
    } else {
      newLevel.push(hashes[i]);
    }
  }

  return createMerkleRoot(newLevel);
}

/**
 * Extract metadata from content
 * (Useful helper, even though Puppeteer does some of this too)
 */
export function extractMetadata(content: string, url?: string): any {
  const metadata: any = {
    length: content.length,
    extractedAt: new Date().toISOString()
  };

  if (url) {
    metadata.url = url;
    try {
      metadata.domain = new URL(url).hostname;
    } catch (e) {
      // invalid url, ignore
    }
  }

  // Try to extract title from HTML
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Try to extract meta description
  const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }

  return metadata;
}