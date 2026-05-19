import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get('coupleId');
  if (!coupleId) return NextResponse.json({ error: 'Missing coupleId' }, { status: 400 });

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('activity_sessions')
    .select('id, activity_type, category, completed_at')
    .eq('couple_id', coupleId)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}
