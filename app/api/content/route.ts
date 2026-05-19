import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type     = searchParams.get('type');
  const coupleId = searchParams.get('coupleId');
  const packName = searchParams.get('packName');
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

  if (!coupleId) {
    return NextResponse.json({ error: 'Missing coupleId' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from('content')
    .select('id, text, type, category, tone, difficulty, metadata')
    .eq('is_active', true)
    .limit(limit);

  if (type)     query = query.eq('type', type);
  if (packName) query = query.filter('metadata->>pack_name', 'eq', packName);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort pack items by pack_order
  const sorted = (data ?? []).sort((a, b) => {
    const ao = Number(a.metadata?.pack_order ?? 0);
    const bo = Number(b.metadata?.pack_order ?? 0);
    return ao - bo;
  });

  return NextResponse.json({ content: sorted });
}
