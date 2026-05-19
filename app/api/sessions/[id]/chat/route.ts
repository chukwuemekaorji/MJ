import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, read_by')
    .eq('context_id', id)
    .eq('message_type', 'discuss')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark partner messages as read
  if (userId && data) {
    const unread = data.filter(m => m.sender_id !== userId && !((m.read_by ?? []) as string[]).includes(userId));
    if (unread.length > 0) {
      for (const m of unread) {
        const already = (m.read_by ?? []) as string[];
        await supabase.from('messages').update({ read_by: [...already, userId] }).eq('id', m.id);
      }
    }
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { coupleId, senderId, content } = await req.json();
  if (!coupleId || !senderId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('messages').insert({
    couple_id:    coupleId,
    sender_id:    senderId,
    content,
    message_type: 'discuss',
    context_id:   id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
