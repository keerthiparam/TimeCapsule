import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Helper to authenticate
async function getUser(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, isPublic } = await req.json();

    // Verify ownership before toggling!
    // We check both userId AND walletAddress to cover both login types
    const capture = await prisma.capture.findFirst({
      where: {
        id: id,
        OR: [
            { userId: user.id },
            { walletAddress: user.user_metadata?.wallet_address }
        ]
      }
    });

    if (!capture) {
      return NextResponse.json({ error: 'Capture not found or access denied' }, { status: 404 });
    }

    const updated = await prisma.capture.update({
      where: { id: id },
      data: { isPublic: isPublic }
    });

    return NextResponse.json({ success: true, capture: updated });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle' }, { status: 500 });
  }
}