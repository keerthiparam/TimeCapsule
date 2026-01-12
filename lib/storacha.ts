// Storacha IPFS Integration (formerly Web3.Storage)
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export interface IPFSUploadResult {
  cid: string;
  url: string;
  size: number;
}

/**
 * Upload content to IPFS via Storacha CLI
 * Requires: npm install -g @storacha/cli
 * Setup: storacha login && storacha space create TimeCapsule
 */
export async function uploadToIPFS(
  content: Buffer | string,
  filename: string
): Promise<IPFSUploadResult> {
  const tempPath = join(tmpdir(), `${Date.now()}-${filename}`);
  
  try {
    // Write content to temp file
    writeFileSync(tempPath, content);
    
    // Upload via Storacha CLI
    const { stdout, stderr } = await execAsync(`storacha up "${tempPath}"`);
    
    if (stderr && !stderr.includes('Stored')) {
      console.error('Storacha stderr:', stderr);
    }
    
    // Parse CID from output
    // Format: "https://storacha.link/ipfs/bafyxxxxx" or just the CID
    const cidMatch = stdout.match(/(?:ipfs\/|^)(bafy[a-z0-9]+)/im);
    
    if (!cidMatch) {
      console.error('Storacha output:', stdout);
      throw new Error('Could not parse CID from storacha output');
    }
    
    const cid = cidMatch[1];
    const size = typeof content === 'string' ? Buffer.byteLength(content) : content.length;
    
    return {
      cid,
      url: `https://${cid}.ipfs.w3s.link/${filename}`,
      size
    };
  } catch (error) {
    console.error('Storacha upload failed:', error);
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Cleanup temp file
    try {
      unlinkSync(tempPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Upload JSON data to IPFS
 */
export async function uploadJSONToIPFS(
  data: any,
  filename: string = 'data.json'
): Promise<IPFSUploadResult> {
  const content = JSON.stringify(data, null, 2);
  return uploadToIPFS(content, filename);
}

/**
 * Retrieve content from IPFS via w3s.link gateway
 */
export async function fetchFromIPFS(cid: string, filename?: string): Promise<string> {
  try {
    const url = filename 
      ? `https://${cid}.ipfs.w3s.link/${filename}`
      : `https://${cid}.ipfs.w3s.link`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('IPFS fetch failed:', error);
    throw new Error('Failed to retrieve from IPFS');
  }
}

/**
 * Check if content is accessible on IPFS
 */
export async function checkIPFSAccess(cid: string, filename?: string): Promise<boolean> {
  try {
    const url = filename 
      ? `https://${cid}.ipfs.w3s.link/${filename}`
      : `https://${cid}.ipfs.w3s.link`;
    const response = await fetch(url, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get IPFS gateway URL for a CID
 */
export function getIPFSUrl(cid: string, filename?: string): string {
  return filename 
    ? `https://${cid}.ipfs.w3s.link/${filename}`
    : `https://${cid}.ipfs.w3s.link`;
}