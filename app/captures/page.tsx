'use client';

import { useEffect, useState } from 'react';
import { Clock, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Capture {
  id: string;
  type: string;
  url: string;
  title: string;
  description: string;
  contentHash: string;
  ipfsCID: string;
  otsStatus: string;
  createdAt: string;
  screenshotUrl?: string;
}

export default function CapturesPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCaptures = async () => {
      try {
        const response = await fetch('/api/capture');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch captures');
        }
        
        setCaptures(data.captures);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCaptures();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading captures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Error</h1>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Preserved Evidence
          </h1>
          <p className="text-gray-600">
            Timeline of all captured and timestamped content
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-gray-900">{captures.length}</p>
            <p className="text-sm text-gray-600">Total Captures</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-green-600">
              {captures.filter(c => c.otsStatus === 'COMPLETE').length}
            </p>
            <p className="text-sm text-gray-600">Verified</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-yellow-600">
              {captures.filter(c => c.otsStatus === 'INCOMPLETE').length}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>

        {/* Timeline */}
        {captures.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Clock className="text-gray-400 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No captures yet
            </h2>
            <p className="text-gray-600 mb-4">
              Start preserving evidence to see your timeline
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Create First Capture
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {captures.map((capture, index) => (
              <div
                key={capture.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {capture.title || capture.url}
                      </h3>
                      {capture.otsStatus === 'COMPLETE' ? (
                        <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                      ) : (
                        <Clock className="text-yellow-600 flex-shrink-0" size={18} />
                      )}
                    </div>

                    {capture.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {capture.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(capture.createdAt).toLocaleDateString()}
                      </span>
                      <span className="font-mono">
                        {capture.contentHash.slice(0, 12)}...
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/verify/${capture.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                    >
                      Verify →
                    </Link>
                    <a
                      href={capture.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                    >
                      Original
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* Status badge */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    capture.otsStatus === 'COMPLETE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {capture.otsStatus === 'COMPLETE' ? (
                      <>
                        <CheckCircle size={12} />
                        Bitcoin Verified
                      </>
                    ) : (
                      <>
                        <Clock size={12} />
                        Awaiting Confirmation
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}