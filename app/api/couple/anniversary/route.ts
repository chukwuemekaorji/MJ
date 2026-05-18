import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get('coupleId');
  if (!coupleId) return NextResponse.json({ error: 'Missing coupleId' }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('couples')
    .select('anniversary_date, paired_at')
    .eq('id', coupleId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Use anniversary_date if set, otherwise fall back to paired_at
  const date = data.anniversary_date ?? data.paired_at?.slice(0, 10) ?? null;
  return NextResponse.json({ date });
}

export async function PUT(req: Request) {
  const { coupleId, date } = await req.json();
  if (!coupleId || !date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('couples')
    .update({ anniversary_date: date })
    .eq('id', coupleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
