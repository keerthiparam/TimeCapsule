'use client';

import { useState } from 'react';
import { Loader2, Link as LinkIcon, Upload, Check, AlertCircle, File as FileIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CaptureFormProps {
  onSuccess?: () => void;
}

export default function CaptureForm({ onSuccess }: CaptureFormProps) {
  const [mode, setMode] = useState<'URL' | 'FILE'>('URL');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessId('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let payload: any = { type: mode };
      if (mode === 'URL') payload.url = url;
      else {
        if (!file) throw new Error("Please select a file.");
        if (file.size > 4 * 1024 * 1024) throw new Error("File too large (Max 4MB for demo)");
        const base64 = await fileToBase64(file);
        payload.fileData = base64;
        payload.fileName = file.name;
        payload.fileType = file.type;
      }

      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to capture');

      setUrl('');
      setFile(null);
      setSuccessId(data.capture.id);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full glass p-6 rounded-2xl shadow-lg border border-white/20 backdrop-blur-md">
      
      {/* MODE TABS */}
      <div className="flex gap-2 mb-6 p-1 bg-secondary/20 rounded-2xl w-fit shadow-inner">
        <button
          type="button"
          onClick={() => setMode('URL')}
          className={`px-4 py-2 text-sm font-medium rounded-2xl transition-all flex items-center gap-2 ${
            mode === 'URL'
              ? 'bg-background/70 text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LinkIcon size={16} /> Web Link
        </button>
        <button
          type="button"
          onClick={() => setMode('FILE')}
          className={`px-4 py-2 text-sm font-medium rounded-2xl transition-all flex items-center gap-2 ${
            mode === 'FILE'
              ? 'bg-background/70 text-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload size={16} /> Upload File
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* URL INPUT */}
        {mode === 'URL' ? (
          <div className="relative glass p-2 rounded-xl border border-white/20 shadow-sm hover:shadow-md transition-all">
            <LinkIcon className="absolute left-3 top-3.5 text-muted-foreground" size={20} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              required={mode === 'URL'}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-background/50 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-foreground transition-all"
            />
          </div>
        ) : (
          /* FILE UPLOAD */
          <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:bg-accent/40 glass transition-all">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
              {file ? (
                <>
                  <FileIcon className="h-10 w-10 text-primary mb-2" />
                  <span className="text-sm font-bold text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-foreground">Click to select a file</span>
                  <span className="text-xs text-muted-foreground mt-2">
                    Supports Images, PDF, TXT, JSON (Max 4MB)
                  </span>
                </>
              )}
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/20 text-destructive text-sm rounded-2xl flex items-center gap-2 glass animate-in fade-in">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {successId && (
          <div className="p-3 bg-green-500/20 text-green-500 text-sm rounded-2xl flex items-center gap-2 glass animate-in fade-in">
            <Check size={16} /> Archived! ID: {successId.slice(0,8)}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === 'URL' && !url) || (mode === 'FILE' && !file)}
          className="w-full glass bg-primary/90 text-primary-foreground hover:scale-105 font-medium py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Hashing & Timestamping...
            </>
          ) : (
            'Preserve Evidence'
          )}
        </button>
      </form>
    </div>
  );
}
