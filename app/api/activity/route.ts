import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';
import { sendPushToUser } from '@/lib/push';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get('coupleId');
  const userId   = searchParams.get('userId');
  const packName = searchParams.get('packName');
  const packType = searchParams.get('packType');

  if (!coupleId || !userId || !packName || !packType) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { data: couple } = await supabase
    .from('couples').select('user_a, user_b').eq('id', coupleId).single();

  const isUserA = couple?.user_a === userId;

  let { data: session } = await supabase
    .from('activity_sessions')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('activity_type', packType)
    .eq('category', packName)
    .single();

  if (!session) {
    const { data: newSession } = await supabase
      .from('activity_sessions')
      .insert({ couple_id: coupleId, activity_type: packType, category: packName })
      .select()
      .single();
    session = newSession;
  }

  const myAnswers      = isUserA ? session?.user_a_answers : session?.user_b_answers;
  const partnerAnswers = isUserA ? session?.user_b_answers : session?.user_a_answers;
  const myDone         = isUserA ? session?.user_a_done    : session?.user_b_done;
  const partnerDone    = isUserA ? session?.user_b_done    : session?.user_a_done;

  return NextResponse.json({
    sessionId:     session?.id,
    myAnswers:     myAnswers     ?? {},
    partnerAnswers: session?.completed ? partnerAnswers ?? {} : null,
    myDone:        myDone        ?? false,
    partnerDone:   partnerDone   ?? false,
    completed:     session?.completed ?? false,
  });
}

export async function POST(req: Request) {
  const { coupleId, userId, packName, packType, answers, done } = await req.json();
  if (!coupleId || !userId || !packName || !packType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { data: couple } = await supabase
    .from('couples').select('user_a, user_b').eq('id', coupleId).single();

  const isUserA = couple?.user_a === userId;
  const partnerUserId = isUserA ? couple?.user_b : couple?.user_a;

  const update: Record<string, unknown> = isUserA
    ? { user_a_answers: answers, user_a_done: done }
    : { user_b_answers: answers, user_b_done: done };

  // Check if partner is also done → mark completed
  const { data: existing } = await supabase
    .from('activity_sessions')
    .select('user_a_done, user_b_done')
    .eq('couple_id', coupleId)
    .eq('activity_type', packType)
    .eq('category', packName)
    .single();

  const partnerAlreadyDone = isUserA ? existing?.user_b_done : existing?.user_a_done;
  if (done && partnerAlreadyDone) {
    update.completed    = true;
    update.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('activity_sessions')
    .upsert(
      { couple_id: coupleId, activity_type: packType, category: packName, ...update },
      { onConflict: 'couple_id,activity_type,category' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify partner if I just finished
  if (done && partnerUserId) {
    const [userRes] = await Promise.all([
      supabase.from('users').select('display_name').eq('id', userId).single(),
    ]);
    const name = userRes.data?.display_name ?? 'Your partner';
    void sendPushToUser(partnerUserId, {
      title: `${name} finished "${packName}"`,
      body:  'Now it\'s your turn — complete the activity to see their answers',
      url:   `/activity?packName=${encodeURIComponent(packName)}&type=${packType}`,
    });
  }

  return NextResponse.json({ ok: true, bothDone: done && partnerAlreadyDone });
}
