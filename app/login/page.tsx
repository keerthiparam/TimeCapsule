'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Manually create client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // --- FIX: Listen for Auth Changes ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.refresh(); // Update the Navbar
        router.push('/captures'); // Go to dashboard
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-lg text-card-foreground">
        
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            TimeCapsule
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Login or create an account.
          </p>
        </div>

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