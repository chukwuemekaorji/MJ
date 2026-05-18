import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const coupleId = searchParams.get('coupleId');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

  if (!type || !coupleId) {
    return NextResponse.json({ error: 'Missing type or coupleId' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('content')
    .select('id, text, type, category, tone, difficulty, metadata')
    .eq('type', type)
    .eq('is_active', true)
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ content: data ?? [] });
}
