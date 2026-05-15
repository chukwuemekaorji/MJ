import { NextResponse } from 'next/server';
import { getCoupleDailyQuestion, getDailyQuestion } from '@/lib/dailyQuestion';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coupleId = searchParams.get('couple_id')?.trim();

  if (!coupleId) {
    return NextResponse.json(getDailyQuestion());
  }

  try {
    const dailyQuestion = await getCoupleDailyQuestion(coupleId);

    if (!dailyQuestion) {
      return NextResponse.json({ error: 'No active daily questions are available.' }, { status: 404 });
    }

    return NextResponse.json(dailyQuestion);
  } catch (error) {
    console.error('Failed to load couple daily question:', error);
    return NextResponse.json({ error: 'Failed to load daily question' }, { status: 500 });
  }
}
