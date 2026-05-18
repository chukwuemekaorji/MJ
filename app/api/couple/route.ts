import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code')?.toUpperCase();
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  const supabase = createSupabaseServiceClient();

  const { data: couple, error } = await supabase
    .from('couples')
    .select('id, user_a, user_b')
    .eq('couple_code', code)
    .single();

  if (error || !couple) return NextResponse.json({ error: 'Couple not found' }, { status: 404 });

  const { data: users } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', [couple.user_a, couple.user_b]);

  return NextResponse.json({
    coupleId: couple.id,
    users: (users ?? []).map(u => ({ id: u.id, displayName: u.display_name })),
  });
}
