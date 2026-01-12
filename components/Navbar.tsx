'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Check user on load
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();

    // 2. Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, []); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Helper to get display name (Email OR Wallet)
  const getDisplayName = () => {
    if (!user) return '';
    // If they have a wallet address in metadata, show that
    if (user.user_metadata?.wallet_address) {
      const addr = user.user_metadata.wallet_address;
      return `ETH: ${addr.slice(0,6)}...${addr.slice(-4)}`;
    }
    // Otherwise show email
    return user.email;
  };

  return (
    <nav className="w-full border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        <Link href="/" className="text-xl font-bold tracking-tighter text-primary flex items-center gap-2">
          ⏳ TimeCapsule
        </Link>

        <div className="flex items-center gap-6">
          {user && (
            <Link 
              href="/captures" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              My Captures
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline border border-border px-2 py-1 rounded bg-secondary/50">
                {getDisplayName()}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-destructive hover:text-red-400 transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}