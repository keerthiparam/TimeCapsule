'use client';

import { useState } from 'react';
import { Loader2, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. Define the props (This fixes the error!)
interface CaptureFormProps {
  onSuccess?: () => void;
}

interface CaptureResult {
  id: string;
  contentHash: string;
  ipfsCID: string;
  otsStatus: string;
}

// 2. Accept the prop here
export default function CaptureForm({ onSuccess }: CaptureFormProps) {
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 2. Pass Token in Headers
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- PASS TOKEN HERE
        },
        body: JSON.stringify({ url, type: 'URL' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create capture');
      }

      setResult(data.capture);
      setUrl('');
      
      // 3. Trigger the list refresh in the parent component
      if (onSuccess) {
        onSuccess();
      }

    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="sr-only">
            URL to Preserve
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              required
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground disabled:opacity-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-primary text-primary-foreground hover:opacity-90 font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Archiving & Timestamping...
            </>
          ) : (
            'Preserve Evidence'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-destructive h-5 w-5" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Success Message (The list below also updates, but this gives immediate feedback) */}
      {result && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-green-500 font-medium">
            <Check size={20} />
            Successfully Sent to Blockchain!
          </div>
          <p className="text-xs text-muted-foreground">
            Your evidence has been added to the list below. 
            <br />
            ID: <span className="font-mono">{result.id}</span>
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-secondary/50 border border-border rounded-lg">
        <h3 className="font-medium text-foreground mb-2 text-sm">How it works:</h3>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>We screenshot & hash the URL (SHA-256)</li>
          <li>Content is uploaded to IPFS (Decentralized Storage)</li>
          <li>Hash is anchored to Bitcoin via OpenTimestamps</li>
        </ol>
      </div>
    </div>
  );
}