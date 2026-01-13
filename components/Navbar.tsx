'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Globe } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 1. Check user on load
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    getUser()

    // 2. Listen for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (_event === 'SIGNED_OUT') {
        setUser(null)
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getDisplayName = () => {
    if (!user) return ''
    if (user.user_metadata?.wallet_address) {
      const addr = user.user_metadata.wallet_address
      return `ETH: ${addr.slice(0, 6)}...${addr.slice(-4)}`
    }
    return user.email
  }

  return (
    <nav className="sticky top-0 z-50 w-full">
      {/* Glass shell */}
      <div className="border-b border-white/10 bg-card/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">

          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 text-xl font-bold tracking-tight text-primary"
          >
            <span className="transition-transform group-hover:scale-110">⏳</span>
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              TimeCapsule
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-6">

            {/* Explore */}
            <Link
              href="/explore"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-all hover:text-primary hover:drop-shadow"
            >
              <Globe size={16} />
              Explore
            </Link>

            {/* Logged-in only */}
            {user && (
              <Link
                href="/captures"
                className="text-sm font-medium text-muted-foreground transition-all hover:text-primary"
              >
                My Vault
              </Link>
            )}

            {/* Auth section */}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden rounded-lg border border-white/10 bg-secondary/40 px-3 py-1 text-xs font-mono text-muted-foreground backdrop-blur-md sm:inline">
                  {getDisplayName()}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-destructive transition-all hover:text-red-400"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary hover:shadow-primary/40"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
