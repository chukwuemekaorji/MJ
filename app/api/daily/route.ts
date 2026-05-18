import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const coupleId = searchParams.get('coupleId');
  const userId = searchParams.get('userId');

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

  const myAnswer = answers?.find(a => a.user_id === userId) ?? null;
  const partnerAnswer = answers?.find(a => a.user_id !== userId) ?? null;
  const bothAnswered = !!myAnswer && !!partnerAnswer;

  return NextResponse.json({
    question: { id: question.id, text: question.text },
    yourAnswer: myAnswer?.answer ?? null,
    partnerAnswered: !!partnerAnswer,
    partnerAnswer: bothAnswered ? partnerAnswer.answer : null,
    state: bothAnswered ? 'revealed' : myAnswer ? 'waiting' : 'unanswered',
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { answer, userId, questionId, coupleId } = body;

  if (!answer?.trim() || !userId || !questionId || !coupleId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from('daily_answers').upsert(
    { daily_question_id: questionId, user_id: userId, answer, updated_at: new Date().toISOString() },
    { onConflict: 'daily_question_id,user_id' }
  );

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
