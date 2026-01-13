'use client';

import { useEffect, useState } from 'react';
import { Globe, Clock, CheckCircle, ExternalLink, Loader2, Shield, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PublicCapture {
  id: string;
  type: string;
  url: string;
  title: string;
  contentHash: string;
  ipfsCID: string;
  otsStatus: string;
  createdAt: string;
  metadata?: any;
}

export default function ExplorePage() {
  const [captures, setCaptures] = useState<PublicCapture[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch the public feed
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        // No Auth Headers needed! This is a public endpoint.
        const response = await fetch('/api/feed'); 
        if (response.ok) {
          const data = await response.json();
          setCaptures(data.captures || []);
        }
      } catch (err) {
        console.error("Failed to load feed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <p className="text-muted-foreground">Loading the public record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4 border-b border-border pb-10">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Global Public Archive
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            An immutable, censorship-resistant feed of digital evidence preserved by TimeCapsule users. 
            Once published here, data is anchored to Bitcoin and cannot be deleted.
          </p>
        </div>

        {/* The Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" /> Recent Verifications
            </h2>
            <div className="text-sm text-muted-foreground">
              Live Feed • {captures.length} Records
            </div>
          </div>

          {captures.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-xl border-dashed">
              <p className="text-muted-foreground">No public evidence has been published yet.</p>
              <p className="text-xs text-muted-foreground mt-2">Be the first to publish from your Dashboard.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {captures.map((capture) => (
                <div 
                  key={capture.id} 
                  className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                >
                  {/* Card Header */}
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        capture.type === 'URL' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {capture.type === 'URL' ? <Globe size={12} /> : <FileText size={12} />}
                        {capture.type}
                      </span>
                      
                      {capture.otsStatus === 'COMPLETE' ? (
                        <span className="text-green-500 flex items-center gap-1 text-xs font-mono" title="Anchored on Bitcoin">
                          <CheckCircle size={12} /> Verified
                        </span>
                      ) : (
                        <span className="text-yellow-500 flex items-center gap-1 text-xs font-mono" title="Waiting for confirmation">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {capture.title || "Untitled Evidence"}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-4 font-mono">
                      {capture.url || capture.metadata?.originalName || "Direct Upload"}
                    </p>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock size={12} /> 
                        {new Date(capture.createdAt).toLocaleDateString()} at {new Date(capture.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="flex items-center gap-2 font-mono opacity-70">
                        <span className="uppercase">SHA256:</span> {capture.contentHash.slice(0, 8)}...
                      </div>
                    </div>
                  </div>

                  {/* Card Footer / Actions */}
                  <div className="bg-secondary/30 p-4 border-t border-border flex items-center justify-between">
                    <Link 
                      href={`/verify/${capture.id}`}
                      className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      Inspect Proof <ArrowRight className="w-3 h-3" />
                    </Link>
                    
                    {/* Link to Original (Only if URL) */}
                    {capture.type === 'URL' && capture.url && (
                      <a 
                        href={capture.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="View Original Source"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
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