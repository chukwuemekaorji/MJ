import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get('coupleId');
  const userId   = searchParams.get('userId');
  if (!coupleId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const supabase = createSupabaseServiceClient();

  const { data: couple } = await supabase.from('couples').select('user_a, user_b').eq('id', coupleId).single();
  if (!couple) return NextResponse.json({ pending: [] });

  const isA          = couple.user_a === userId;
  const myField      = isA ? 'response_user_a'    : 'response_user_b';
  const partnerField = isA ? 'response_user_b'    : 'response_user_a';
  const partnerId    = isA ? couple.user_b         : couple.user_a;

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`id, content_id, content_type, ${myField}, ${partnerField}, content:content_id(text, type, category)`)
    .eq('couple_id', coupleId)
    .eq('completed', false)
    .not(partnerField, 'is', null)
    .is(myField, null);

  return NextResponse.json({ pending: sessions ?? [], partnerId });
}
