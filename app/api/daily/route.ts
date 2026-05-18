import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getCoupleDailyQuestion } from '@/lib/dailyQuestion';

// For now, hardcode a couple_id; in real app, derive from auth session.
const COUPLE_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  try {
    const question = await getCoupleDailyQuestion(COUPLE_ID);
    if (!question) {
      return NextResponse.json({ prompt: null }, { status: 200 });
    }
    return NextResponse.json({ prompt: { id: question.id, text: question.question } });
  } catch {
    return NextResponse.json({ prompt: null }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const answer: string = body.answer ?? '';

  if (!answer.trim()) {
    return NextResponse.json({ error: 'Empty answer' }, { status: 400 });
  }

  // In real app, use auth user_id
  const userId = '00000000-0000-0000-0000-000000000002';

  const today = new Date().toISOString().slice(0, 10);

  const { data: daily, error: dailyError } = await supabase
    .from('daily_questions')
    .select('id')
    .eq('couple_id', COUPLE_ID)
    .eq('date', today)
    .single();

  if (dailyError || !daily) {
    return NextResponse.json({ error: 'No daily question' }, { status: 404 });
  }

  const { error: upsertError } = await supabase.from('daily_answers').upsert(
    {
      daily_question_id: daily.id,
      user_id: userId,
      answer,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'daily_question_id,user_id' }
  );

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
