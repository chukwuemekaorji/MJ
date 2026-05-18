import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.from('users').select('pin').eq('id', userId).single();
  return NextResponse.json({ hasPin: !!data?.pin });
}

export async function POST(req: Request) {
  const { userId, pin, isNew } = await req.json();
  if (!userId || !pin) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const supabase = createSupabaseServiceClient();

  if (isNew) {
    const { error } = await supabase.from('users').update({ pin }).eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ valid: true });
  }

  const { data } = await supabase.from('users').select('pin').eq('id', userId).single();
  return NextResponse.json({ valid: data?.pin === pin });
}
