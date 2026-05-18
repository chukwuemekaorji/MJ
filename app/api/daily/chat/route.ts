import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get('coupleId');
  if (!coupleId) return NextResponse.json({ error: 'Missing coupleId' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('couple_id', coupleId)
    .eq('message_type', 'daily_discussion')
    .gte('created_at', `${today}T00:00:00Z`)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { coupleId, senderId, content } = body;

  if (!coupleId || !senderId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from('messages').insert({
    couple_id: coupleId,
    sender_id: senderId,
    content,
    message_type: 'daily_discussion',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
