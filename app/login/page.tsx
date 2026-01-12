'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

// Manually create client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.refresh();
        router.push('/captures');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // --- METAMASK LOGIN LOGIC ---
  const handleMetaMaskLogin = async () => {
    setWalletLoading(true);
    try {
      // 1. Check if MetaMask is installed
      // @ts-ignore
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setWalletLoading(false);
        return;
      }

      // 2. Request Wallet Address
      // @ts-ignore
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      // 3. Sign in Anonymously to Supabase
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      // 4. Save Wallet Address to User Profile
      if (data.user) {
        await supabase.auth.updateUser({
          data: { 
            wallet_address: walletAddress,
            full_name: `Wallet: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}`
          }
        });
      }
      // Listener will handle redirect...
    } catch (error: any) {
      console.error(error);
      alert("Login failed: " + error.message);
      setWalletLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-lg text-card-foreground">
        
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            TimeCapsule
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect via Web3 or Email
          </p>
        </div>

        {/* --- METAMASK BUTTON --- */}
        <button
          onClick={handleMetaMaskLogin}
          disabled={walletLoading}
          className="w-full mb-6 flex items-center justify-center gap-3 px-4 py-3 bg-[#F6851B] hover:bg-[#e57a18] text-white font-bold rounded-md transition-all shadow-sm"
        >
          {walletLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <svg style={{width: '24px', height: '24px'}} viewBox="0 0 24 24">
              <path fill="currentColor" d="M21.83 14.82L17.29 2.68C17.06 2.06 16.47 1.66 15.81 1.66H8.18C7.53 1.66 6.94 2.06 6.71 2.68L2.17 14.82C1.96 15.39 2.21 16.03 2.74 16.29L12 20.89L21.26 16.29C21.79 16.03 22.04 15.39 21.83 14.82Z" />
            </svg>
          )}
          Connect MetaMask
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or using email</span></div>
        </div>

        {/* --- STANDARD EMAIL FORM --- */}
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary))',
                  brandButtonText: 'hsl(var(--primary-foreground))',
                  defaultButtonBackground: 'hsl(var(--secondary))',
                  defaultButtonBackgroundHover: 'hsl(var(--secondary) / 0.8)',
                  defaultButtonBorder: 'hsl(var(--border))',
                  defaultButtonText: 'hsl(var(--secondary-foreground))',
                  dividerBackground: 'hsl(var(--border))',
                  inputBackground: 'transparent',
                  inputBorder: 'hsl(var(--input))',
                  inputBorderHover: 'hsl(var(--ring))',
                  inputPlaceholder: 'hsl(var(--muted-foreground))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabelText: 'hsl(var(--foreground))',
                  anchorTextColor: 'hsl(var(--primary))',
                  anchorTextHoverColor: 'hsl(var(--primary) / 0.8)',
                },
                radii: {
                  buttonBorderRadius: 'var(--radius)',
                  inputBorderRadius: 'var(--radius)',
                },
              },
            },
            className: {
              button: 'font-medium transition-colors',
              input: 'bg-background',
              anchor: 'hover:underline font-bold',
            }
          }}
          providers={[]} 
          theme="default"
          showLinks={true}
        />
      </div>
    </div>
  );
}