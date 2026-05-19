import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get('coupleId');
  const userId   = searchParams.get('userId');
  if (!coupleId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const supabase = createSupabaseServiceClient();

  const [{ data: couple }, { data: sessions }] = await Promise.all([
    supabase.from('couples').select('user_a, user_b').eq('id', coupleId).single(),
    supabase
      .from('activity_sessions')
      .select('activity_type, category, user_a_done, user_b_done, completed')
      .eq('couple_id', coupleId),
  ]);

  const isUserA = couple?.user_a === userId;

  const result = (sessions ?? []).map(s => ({
    packName:     s.category,          // category field stores pack_name
    activityType: s.activity_type,
    myDone:       isUserA ? s.user_a_done : s.user_b_done,
    partnerDone:  isUserA ? s.user_b_done : s.user_a_done,
    completed:    s.completed,
  }));

  return NextResponse.json({ sessions: result });
}
