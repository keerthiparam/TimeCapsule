'use client'

import Link from 'next/link'
import { Shield, Clock, Lock, ArrowRight, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    getUser()
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background/40 backdrop-blur-sm">
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center space-y-8">
        <div className="space-y-4 max-w-3xl glass p-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground">
           Time<span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Capsule</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Preserve Digital Evidence. Prove It Existed.
          </p>
          <p className="text-md text-muted-foreground/80 max-w-2xl mx-auto">
            Securely archive web content with tamper-proof timestamping using Bitcoin & IPFS. 
            Designed for journalists, investigators, and legal teams.
          </p>
        </div>

        {/* CTA Buttons */}
        {!loading && (
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            {user ? (
              <Link
                href="/captures"
                className="glass inline-flex items-center justify-center px-8 py-3 text-lg font-medium bg-primary/90 text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                Go to My Vault <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/captures"
                  className="glass inline-flex items-center justify-center px-8 py-3 text-lg font-medium bg-primary/90 text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Start Archiving <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="glass inline-flex items-center justify-center px-8 py-3 text-lg font-medium border border-white/20 bg-card/30 text-card-foreground rounded-2xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        )}
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={<Shield />} title="Tamper-Proof" desc="Cryptographic hashing ensures content integrity. Even one pixel changed alters the hash completely." />
            <FeatureCard icon={<Clock />} title="Bitcoin Timestamped" desc="Anchored in the Bitcoin blockchain via OpenTimestamps. Mathematically proves existence at a specific time." />
            <FeatureCard icon={<Lock />} title="Decentralized" desc="Evidence is stored on IPFS. No central server can delete or censor your captured data." />
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
            <UseCaseCard icon="📰" title="Journalists" desc="Archive articles and sources before they are stealth-edited or deleted." />
            <UseCaseCard icon="🔍" title="OSINT Investigators" desc="Preserve social media posts and digital breadcrumbs with verifiable proofs." />
            <UseCaseCard icon="⚖️" title="Legal Teams" desc="Create admissible digital evidence with strict chain-of-custody." />
            <UseCaseCard icon="🎓" title="Researchers" desc="Ensure reproducibility by citing immutable snapshots of web content." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 py-8 bg-card/40 backdrop-blur-lg">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-medium">Built with OpenTimestamps, IPFS & Bitcoin</p>
          <p className="mt-2 opacity-75">
          TimeCapsule proves <em>existence</em>, not <em>truthfulness</em>.
          </p>
        </div>
      </footer>
    </div>
  )
}

// Feature Card
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass flex flex-col items-start p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

// Use Case Card
function UseCaseCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="glass flex items-start p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all">
      <span className="text-3xl mr-4">{icon}</span>
      <div>
        <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
