import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, read_by, reply_to_id, reactions')
    .eq('context_id', id)
    .eq('message_type', 'discuss')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // Resolve reply_to content inline (self-join not available in PostgREST)
  const msgMap = new Map(rows.map(m => [m.id, m]));
  const messages = rows.map(m => ({
    ...m,
    reply_to: m.reply_to_id
      ? { content: msgMap.get(m.reply_to_id)?.content ?? '', sender_id: msgMap.get(m.reply_to_id)?.sender_id ?? '' }
      : null,
  }));

  // Mark partner messages as read
  if (userId) {
    const unread = rows.filter(m => m.sender_id !== userId && !((m.read_by ?? []) as string[]).includes(userId));
    for (const m of unread) {
      const already = (m.read_by ?? []) as string[];
      await supabase.from('messages').update({ read_by: [...already, userId] }).eq('id', m.id);
    }
  }

  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { coupleId, senderId, content, replyToId } = await req.json();
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
    ...(replyToId ? { reply_to_id: replyToId } : {}),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Toggle emoji reaction on a message
export async function PATCH(req: Request) {
  const { messageId, userId, emoji } = await req.json();
  if (!messageId || !userId || !emoji) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: msg } = await supabase.from('messages').select('reactions').eq('id', messageId).single();
  const reactions = ((msg?.reactions ?? {}) as Record<string, string[]>);
  const users = reactions[emoji] ?? [];

  if (users.includes(userId)) {
    reactions[emoji] = users.filter(u => u !== userId);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji] = [...users, userId];
  }

  await supabase.from('messages').update({ reactions }).eq('id', messageId);
  return NextResponse.json({ ok: true });
}
