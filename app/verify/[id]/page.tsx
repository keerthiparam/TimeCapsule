'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, Clock, ExternalLink, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';

interface VerificationData {
  verified: boolean;
  capture: {
    id: string;
    url: string;
    title: string;
    contentHash: string;
    ipfsCID: string;
    ipfsUrl: string;
    otsStatus: string;
    createdAt: string;
  };
  verification: {
    verified: boolean;
    message: string;
    ipfsIntact: boolean;
    blockHeight?: number;
    timestamp?: number;
  };
}

export default function VerifyPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/verify?id=${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Refresh verification data
        await fetchVerification();
      }
    } catch (err) {
      console.error('Upgrade failed:', err);
    } finally {
      setUpgrading(false);
    }
  };

  const handleDownloadProof = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/verify/download?id=${id}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timecapsule-${id}.ots`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download OTS proof');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Verifying proof...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Verification Failed
          </h1>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isComplete = data.capture.otsStatus === 'COMPLETE';
  const isPending = data.capture.otsStatus === 'INCOMPLETE';
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proof Verification
          </h1>
          <p className="text-gray-600">
            Independent verification of digital evidence
          </p>
        </div>

        {/* Status Card */}
        <div className={`p-6 rounded-lg mb-6 ${
          isComplete 
            ? 'bg-green-50 border-2 border-green-200' 
            : 'bg-yellow-50 border-2 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {isComplete ? (
              <CheckCircle className="text-green-600" size={32} />
            ) : (
              <Clock className="text-yellow-600" size={32} />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isComplete ? 'Fully Verified' : 'Pending Confirmation'}
              </h2>
              <p className={isComplete ? 'text-green-700' : 'text-yellow-700'}>
                {data.verification.message}
              </p>
            </div>
          </div>

          {isPending && (
            <div className="mt-4">
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Checking...
                  </>
                ) : (
                  'Check for Confirmation'
                )}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                Bitcoin blocks are mined approximately every 10 minutes. Check back soon!
              </p>
            </div>
          )}
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            Independent Verification
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Don't trust us? Verify the timestamp yourself without relying on TimeCapsule:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Download the OTS proof file using the button below</li>
            <li>Click on "View on IPFS", which will take you to the IPFS storage.</li>
            <li>From there, right click on the file that you can see, and click on "Save link as..." and save it as you wish.</li>
            <li>Go to <a href="https://opentimestamps.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">opentimestamps.org</a></li>
            <li>Click "Stamp & Verify" → Upload your .ots file and then the IPFS file that you saved, in that order.</li>
            <li>See Bitcoin block confirmation (cryptographically verified!)</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Advanced:</span> Use CLI: <code className="bg-gray-100 px-2 py-1 rounded font-mono">ots verify timecapsule-{id}.ots</code>
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-4 italic">
            This proof is cryptographically verifiable and doesn't require trust in TimeCapsule. Even if this website goes down, the proof remains valid on the Bitcoin blockchain.
          </p>
        </div>
        {/* Capture Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} />
            Capture Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Original URL</label>
              <a 
                href={data.capture.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
              >
                {data.capture.title || data.capture.url}
                <ExternalLink size={14} />
              </a>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Content Hash (SHA-256)</label>
              <p className="font-mono text-xs text-gray-600 break-all mt-1 bg-gray-50 p-2 rounded">
                {data.capture.contentHash}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">IPFS Storage</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-gray-600">
                  {data.capture.ipfsCID}
                </span>
                {data.verification.ipfsIntact && (
                  <CheckCircle className="text-green-600" size={16} />
                )}
              </div>
              <a 
                href={`https://${data.capture.ipfsCID}.ipfs.storacha.link`}
                target="_blank"
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mt-1"
              >
                View on IPFS
                <ExternalLink size={14} />
              </a>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Captured At</label>
              <p className="text-gray-600 mt-1">
                {new Date(data.capture.createdAt).toLocaleString()}
              </p>
            </div>

            {data.verification.blockHeight && (
              <div>
                <label className="text-sm font-medium text-gray-700">Bitcoin Block</label>
                <a
                  href={`https://blockstream.info/block-height/${data.verification.blockHeight}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                >
                  #{data.verification.blockHeight}
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            {/* Download OTS Proof Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleDownloadProof}
                disabled={downloading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download OTS Proof File
                  </>
                )}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                Download the OpenTimestamps proof to verify independently
              </p>
            </div>
          </div>
        </div>

        {/* Independent Verification Instructions */}
        
      </div>
    </div>
  );
}