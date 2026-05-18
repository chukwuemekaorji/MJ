import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code')?.toUpperCase();

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('couples')
    .select('id')
    .eq('couple_code', code)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Couple not found' }, { status: 404 });

  return NextResponse.json({ coupleId: data.id });
}
