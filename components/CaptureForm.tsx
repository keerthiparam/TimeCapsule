'use client';

import { useState } from 'react';
import { Loader2, Link, Check } from 'lucide-react';

interface CaptureResult {
  id: string;
  contentHash: string;
  ipfsCID: string;
  ipfsUrl: string;
  otsStatus: string;
}

export default function CaptureForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: 'URL' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create capture');
      }

      setResult(data.capture);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            URL to Preserve
          </label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              required
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Creating Timestamp...
            </>
          ) : (
            'Preserve Evidence'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-green-800 font-medium">
            <Check size={20} />
            Successfully Preserved!
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Capture ID:</span>
              <p className="font-mono text-gray-600 break-all">{result.id}</p>
            </div>

            <div>
              <span className="font-medium text-gray-700">Content Hash:</span>
              <p className="font-mono text-xs text-gray-600 break-all">
                {result.contentHash}
              </p>
            </div>

            <div>
              <span className="font-medium text-gray-700">IPFS CID:</span>
              <p className="font-mono text-xs text-gray-600 break-all">
                {result.ipfsCID}
              </p>
            </div>

            <div>
              <span className="font-medium text-gray-700">Timestamp Status:</span>
              <p className="text-gray-600">
                {result.otsStatus === 'INCOMPLETE' ? (
                  <span className="text-yellow-600">
                    ⏳ Pending (awaiting Bitcoin confirmation ~1-2 hours)
                  </span>
                ) : (
                  <span className="text-green-600">✓ Complete</span>
                )}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-green-200">
            <a
              href={`/verify/${result.id}`}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View Verification Page →
            </a>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>We fetch and hash your URL content (SHA-256)</li>
          <li>Content is stored on IPFS (decentralized)</li>
          <li>Hash is timestamped using Bitcoin blockchain via OpenTimestamps</li>
          <li>You get a verifiable proof anyone can check</li>
        </ol>
      </div>
    </div>
  );
}