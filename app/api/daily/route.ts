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

  const [{ data: questionId, error: rpcError }, { data: coupleInfo }] = await Promise.all([
    supabase.rpc('assign_daily_question', { p_couple_id: coupleId }),
    supabase.from('couples').select('streak_count, streak_last_date').eq('id', coupleId).single(),
  ]);

  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  const streak      = coupleInfo?.streak_count      ?? 0;
  const streakDate  = coupleInfo?.streak_last_date   ?? null;
  const today       = new Date().toISOString().slice(0, 10);
  const streakToday = streakDate === today;

  if (!questionId) return NextResponse.json({ question: null, streak, streakToday }, { status: 200 });

  const { data: question } = await supabase
    .from('daily_questions')
    .select('id, text')
    .eq('id', questionId)
    .single();

  if (!question) return NextResponse.json({ question: null, streak, streakToday }, { status: 200 });

  const { data: answers } = await supabase
    .from('daily_answers')
    .select('user_id, answer')
    .eq('daily_question_id', question.id);

  const myAnswer      = answers?.find(a => a.user_id === userId)      ?? null;
  const partnerAnswer = answers?.find(a => a.user_id !== userId)      ?? null;
  const bothAnswered  = !!myAnswer && !!partnerAnswer;

  return NextResponse.json({
    question:        { id: question.id, text: question.text },
    yourAnswer:      myAnswer?.answer ?? null,
    partnerAnswered: !!partnerAnswer,
    partnerAnswer:   bothAnswered ? partnerAnswer.answer : null,
    state:           bothAnswered ? 'revealed' : myAnswer ? 'waiting' : 'unanswered',
    streak,
    streakToday,
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

  // Fetch couple info for partner push + streak
  const { data: couple } = await supabase
    .from('couples')
    .select('user_a, user_b, streak_count, streak_last_date')
    .eq('id', coupleId)
    .single();

  if (!couple) return NextResponse.json({ ok: true });

  const partnerUserId = couple.user_a === userId ? couple.user_b : couple.user_a;

  // Check if both have now answered
  const { data: allAnswers } = await supabase
    .from('daily_answers')
    .select('user_id')
    .eq('daily_question_id', questionId);

  const bothAnswered = (allAnswers?.length ?? 0) >= 2;
  const today        = new Date().toISOString().slice(0, 10);
  const yesterday    = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (bothAnswered && couple.streak_last_date !== today) {
    // Calculate new streak
    const newStreak = couple.streak_last_date === yesterday
      ? (couple.streak_count ?? 0) + 1
      : 1;

    await Promise.all([
      supabase.from('couples')
        .update({ streak_count: newStreak, streak_last_date: today })
        .eq('id', coupleId),
      supabase.from('streaks')
        .upsert({ couple_id: coupleId, date: today, both_answered: true },
                { onConflict: 'couple_id,date' }),
    ]);

    // Push streak notification to BOTH partners
    const streakMsg = newStreak === 1
      ? 'You both answered today — your streak begins! 💕'
      : newStreak >= 7
        ? `🔥 ${newStreak} day streak! You're on fire`
        : `🔥 ${newStreak} day streak! Keep it going`;

    void sendPushToUser(couple.user_a, { title: 'Streak!', body: streakMsg, url: '/daily' });
    void sendPushToUser(couple.user_b, { title: 'Streak!', body: streakMsg, url: '/daily' });
  } else if (!bothAnswered) {
    // Only one answered — notify partner
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

  return NextResponse.json({ ok: true, bothAnswered });
}
