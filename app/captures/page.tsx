'use client';

import { useEffect, useState } from 'react';
import { Clock, ExternalLink, CheckCircle, AlertCircle, Loader2, Shield, Download, Globe, Lock } from 'lucide-react'; 
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import CaptureForm from '@/components/CaptureForm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  metadata?: any;
  isPublic: boolean; // <--- Added isPublic
}

export default function CapturesPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  // Track which specific item is toggling to show a mini-spinner
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  const router = useRouter();

  const fetchCaptures = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/capture', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch captures');
      }
      
      setCaptures(data.captures || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchCaptures();
    };
    checkUser();
  }, [router]); 

  const handleSuccess = () => {
    fetchCaptures();
  };

  // --- DOWNLOAD FUNCTION ---
  const handleDownload = (capture: Capture) => {
    let filename = `evidence-${capture.id.slice(0, 8)}`;
    if (capture.type === 'URL') filename += '.html';
    else if (capture.metadata?.originalName) filename = capture.metadata.originalName;
    else filename += '.bin';

    const proxyUrl = `/api/download_proxy?cid=${capture.ipfsCID}&filename=${encodeURIComponent(filename)}`;
    window.location.href = proxyUrl;
  };

  // --- NEW: TOGGLE PUBLIC/PRIVATE ---
  const handleTogglePublic = async (capture: Capture) => {
    setTogglingId(capture.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Optimistic Update (Update UI instantly)
      const newStatus = !capture.isPublic;
      setCaptures(prev => prev.map(c => c.id === capture.id ? { ...c, isPublic: newStatus } : c));

      // API Call
      await fetch('/api/capture/togglepublic', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: capture.id, isPublic: newStatus })
      });

    } catch (err) {
      console.error("Failed to toggle", err);
      // Revert if failed
      setCaptures(prev => prev.map(c => c.id === capture.id ? { ...c, isPublic: !capture.isPublic } : c));
      alert("Failed to update visibility");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <p className="text-muted-foreground">Loading your evidence vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border pb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Evidence Vault
            </h1>
            <p className="text-muted-foreground">
              Manage your decentralized archives and blockchain proofs.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-foreground">{captures.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
            </div>
            <div className="text-center px-4 border-l border-border">
              <p className="text-2xl font-bold text-green-500">
                {captures.filter(c => c.otsStatus === 'COMPLETE').length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Verified</p>
            </div>
            <div className="text-center px-4 border-l border-border">
              <p className="text-2xl font-bold text-blue-500">
                {captures.filter(c => c.isPublic).length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Public</p>
            </div>
          </div>
        </div>

        {/* Capture Form */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> 
            Archive New Content
          </h2>
          <CaptureForm onSuccess={handleSuccess} />
        </div>

        {/* Timeline List */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">Recent Archives</h2>
          
          {captures.length === 0 ? (
            <div className="bg-card rounded-xl border border-border border-dashed p-12 text-center">
              <Clock className="text-muted-foreground mx-auto mb-4" size={48} />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No captures yet
              </h2>
              <p className="text-muted-foreground">
                Paste a URL above to create your first immutable record.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {captures.map((capture) => (
                <div
                  key={capture.id}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Content Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            capture.otsStatus === 'COMPLETE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                            {capture.otsStatus === 'COMPLETE' ? <CheckCircle size={16} /> : <Clock size={16} />}
                        </span>
                        <h3 className="font-semibold text-foreground text-lg truncate">
                          {capture.title || capture.url}
                        </h3>
                      </div>

                      <div className="pl-11">
                        <p className="text-sm text-muted-foreground mb-3 truncate font-mono">
                          {capture.url || capture.metadata?.originalName || "Uploaded File"}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/70">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(capture.createdAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 font-mono bg-secondary px-2 py-0.5 rounded">
                            ID: {capture.contentHash.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex md:flex-col gap-3 pl-11 md:pl-0 min-w-[140px]">
                      
                      {/* --- TOGGLE PUBLIC BUTTON --- */}
                      <button
                        onClick={() => handleTogglePublic(capture)}
                        disabled={togglingId === capture.id}
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors gap-2 border ${
                            capture.isPublic 
                            ? 'bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20' 
                            : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
                        }`}
                      >
                        {togglingId === capture.id ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : capture.isPublic ? (
                            <><Globe size={14} /> Public</>
                        ) : (
                            <><Lock size={14} /> Private</>
                        )}
                      </button>

                      <Link
                        href={`/verify/${capture.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        View Proof
                      </Link>

                      <button
                        onClick={() => handleDownload(capture)}
                        className="inline-flex items-center justify-center px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-lg transition-colors gap-2"
                      >
                        <Download size={14} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}