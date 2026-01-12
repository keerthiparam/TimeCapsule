'use client';

import Link from 'next/link';
import { Shield, Clock, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Same manual way as Navbar)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getUser();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center space-y-8">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground">
            Time<span className="text-primary">Capsule</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Preserve Digital Evidence. Prove It Existed.
          </p>
          <p className="text-md text-muted-foreground/80 max-w-2xl mx-auto">
            Securely archive web content with tamper-proof timestamping using Bitcoin & IPFS. 
            Designed for journalists, investigators, and legal teams.
          </p>
        </div>

        {/* CTA Buttons - LOGIC CHANGED HERE */}
        {!loading && (
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            
            {/* If Logged In: Show "Go to Dashboard" */}
            {user ? (
              <Link 
                href="/captures" 
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Go to My Vault <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              // If Logged Out: Show "Start Archiving" + "Log In"
              <>
                <Link 
                  href="/captures" 
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Start Archiving <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium border border-border bg-card text-card-foreground rounded-lg hover:bg-accent transition-all"
                >
                  Log In
                </Link>
              </>
            )}
            
          </div>
        )}
      </section>

      {/* Features Grid (Same as before) */}
      <section className="py-20 bg-card/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2 text-foreground">Tamper-Proof</h3>
              <p className="text-muted-foreground">
                Cryptographic hashing ensures content integrity. Even one pixel changed alters the hash completely.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <Clock className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2 text-foreground">Bitcoin Timestamped</h3>
              <p className="text-muted-foreground">
                Anchored in the Bitcoin blockchain via OpenTimestamps. Mathematically proves existence at a specific time.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <Lock className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2 text-foreground">Decentralized</h3>
              <p className="text-muted-foreground">
                Evidence is stored on IPFS. No central server can delete or censor your captured data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Trusted By
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <UseCaseCard 
              icon="📰" 
              title="Journalists" 
              desc="Archive articles and sources before they are stealth-edited or deleted." 
            />
            <UseCaseCard 
              icon="🔍" 
              title="OSINT Investigators" 
              desc="Preserve social media posts and digital breadcrumbs with verifiable proofs." 
            />
            <UseCaseCard 
              icon="⚖️" 
              title="Legal Teams" 
              desc="Create admissible digital evidence with strict chain-of-custody." 
            />
            <UseCaseCard 
              icon="🎓" 
              title="Researchers" 
              desc="Ensure reproducibility by citing immutable snapshots of web content." 
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-medium">Built with OpenTimestamps, IPFS & Bitcoin</p>
          <p className="mt-2 opacity-75">
            TimeCapsule proves <em>existence</em>, not <em>truthfulness</em>.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper component
function UseCaseCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start p-6 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
      <span className="text-3xl mr-4">{icon}</span>
      <div>
        <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}