import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

// GET: returns whether the partner is currently typing (within last 4 seconds)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ typing: false });

  const supabase = createSupabaseServiceClient();

  // Get couple_id from session
  const { data: session } = await supabase
    .from('activity_sessions')
    .select('couple_id')
    .eq('id', id)
    .single();

  if (!session) return NextResponse.json({ typing: false });

  const { data: couple } = await supabase
    .from('couples')
    .select('typing_user_id, typing_at')
    .eq('id', session.couple_id)
    .single();

  if (!couple || !couple.typing_user_id || couple.typing_user_id === userId) {
    return NextResponse.json({ typing: false });
  }

  const age = Date.now() - new Date(couple.typing_at).getTime();
  return NextResponse.json({ typing: age < 4000 });
}

// POST: set typing state (called while user is typing)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { coupleId, userId } = await req.json();
  if (!coupleId || !userId) return NextResponse.json({ ok: false });

  const supabase = createSupabaseServiceClient();
  await supabase
    .from('couples')
    .update({ typing_user_id: userId, typing_at: new Date().toISOString() })
    .eq('id', coupleId);

  return NextResponse.json({ ok: true });
}
