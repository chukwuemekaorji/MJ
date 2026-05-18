import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';
import { sendPushToUser } from '@/lib/push';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get('coupleId');
  const userId   = searchParams.get('userId');

  if (!coupleId || !userId) {
    return NextResponse.json({ error: 'Missing coupleId or userId' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { data: questionId, error: rpcError } = await supabase.rpc('assign_daily_question', {
    p_couple_id: coupleId,
  });

  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });
  if (!questionId) return NextResponse.json({ question: null }, { status: 200 });

  const { data: question } = await supabase
    .from('daily_questions')
    .select('id, text')
    .eq('id', questionId)
    .single();

  if (!question) return NextResponse.json({ question: null }, { status: 200 });

  const { data: answers } = await supabase
    .from('daily_answers')
    .select('user_id, answer')
    .eq('daily_question_id', question.id);

  const myAnswer     = answers?.find(a => a.user_id === userId) ?? null;
  const partnerAnswer = answers?.find(a => a.user_id !== userId) ?? null;
  const bothAnswered  = !!myAnswer && !!partnerAnswer;

  return NextResponse.json({
    question:       { id: question.id, text: question.text },
    yourAnswer:     myAnswer?.answer ?? null,
    partnerAnswered: !!partnerAnswer,
    partnerAnswer:  bothAnswered ? partnerAnswer.answer : null,
    state:          bothAnswered ? 'revealed' : myAnswer ? 'waiting' : 'unanswered',
  });
}

export async function POST(req: Request) {
  const { answer, userId, questionId, coupleId } = await req.json();

  if (!answer?.trim() || !userId || !questionId || !coupleId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from('daily_answers').upsert(
    { daily_question_id: questionId, user_id: userId, answer, updated_at: new Date().toISOString() },
    { onConflict: 'daily_question_id,user_id' }
  );

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });

  // Find partner and send push notification
  const { data: couple } = await supabase
    .from('couples')
    .select('user_a, user_b')
    .eq('id', coupleId)
    .single();

  if (couple) {
    const partnerUserId = couple.user_a === userId ? couple.user_b : couple.user_a;

    const [userRes, questionRes] = await Promise.all([
      supabase.from('users').select('display_name').eq('id', userId).single(),
      supabase.from('daily_questions').select('text').eq('id', questionId).single(),
    ]);

    const name    = userRes.data?.display_name ?? 'Your partner';
    const preview = (questionRes.data?.text ?? '').slice(0, 60);

    void sendPushToUser(partnerUserId, {
      title: `${name} answered today's question`,
      body:  preview || 'Tap to see their answer and respond',
      url:   '/daily',
    });
  }

  return NextResponse.json({ ok: true });
}
