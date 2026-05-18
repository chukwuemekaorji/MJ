import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';
import { sendPushToUser } from '@/lib/push';

async function getCoupleInfo(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  coupleId: string,
  userId: string
) {
  const { data } = await supabase
    .from('couples')
    .select('user_a, user_b')
    .eq('id', coupleId)
    .single();
  if (!data) return { slot: 'b' as const, partnerUserId: null };
  const slot          = data.user_a === userId ? ('a' as const) : ('b' as const);
  const partnerUserId = data.user_a === userId ? data.user_b : data.user_a;
  return { slot, partnerUserId: partnerUserId as string };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get('contentId');
  const coupleId  = searchParams.get('coupleId');
  const userId    = searchParams.get('userId');
  if (!contentId || !coupleId || !userId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const supabase            = createSupabaseServiceClient();
  const { slot }            = await getCoupleInfo(supabase, coupleId, userId);

  const { data: session } = await supabase
    .from('sessions')
    .select('id, response_user_a, response_user_b, completed')
    .eq('couple_id', coupleId)
    .eq('content_id', contentId)
    .maybeSingle();

  if (!session) return NextResponse.json({ session: null });

  const yourResponse    = slot === 'a' ? session.response_user_a : session.response_user_b;
  const partnerResponse = slot === 'a' ? session.response_user_b : session.response_user_a;

  return NextResponse.json({
    sessionId:       session.id,
    yourAnswer:      yourResponse,
    partnerAnswered: !!partnerResponse,
    partnerAnswer:   session.completed ? partnerResponse : null,
    bothAnswered:    session.completed,
  });
}

export async function POST(req: Request) {
  const { contentId, coupleId, userId, answer, contentType } = await req.json();
  if (!contentId || !coupleId || !userId || answer === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase                   = createSupabaseServiceClient();
  const { slot, partnerUserId }    = await getCoupleInfo(supabase, coupleId, userId);
  const field                      = slot === 'a' ? 'response_user_a' : 'response_user_b';

  const { data: existing } = await supabase
    .from('sessions')
    .select('id, response_user_a, response_user_b')
    .eq('couple_id', coupleId)
    .eq('content_id', contentId)
    .maybeSingle();

  let sessionId: string;
  let bothAnswered = false;

  if (!existing) {
    const { data: created, error } = await supabase
      .from('sessions')
      .insert({ couple_id: coupleId, content_id: contentId, content_type: contentType, [field]: answer })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    sessionId = created.id;
  } else {
    const other = slot === 'a' ? existing.response_user_b : existing.response_user_a;
    bothAnswered = !!other;
    const { error } = await supabase
      .from('sessions')
      .update({
        [field]:        answer,
        completed:      bothAnswered,
        completed_at:   bothAnswered ? new Date().toISOString() : null,
      })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    sessionId = existing.id;
  }

  // Send push to partner (fire and forget — don't block response)
  if (partnerUserId) {
    const [userRes, contentRes] = await Promise.all([
      supabase.from('users').select('display_name').eq('id', userId).single(),
      supabase.from('content').select('text, type').eq('id', contentId).single(),
    ]);
    const name    = userRes.data?.display_name ?? 'Your partner';
    const preview = (contentRes.data?.text ?? '').slice(0, 60);
    const type    = contentRes.data?.type ?? contentType;
    void sendPushToUser(partnerUserId, {
      title: `${name} answered`,
      body:  preview || 'Tap to see their answer',
      url:   `/play/${type}?highlight=${contentId}`,
    });
  }

  return NextResponse.json({ sessionId, bothAnswered });
}
