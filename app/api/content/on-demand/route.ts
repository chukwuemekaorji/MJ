import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { callClaude } from '@/lib/claude';

export async function POST(req: Request) {
  const body = await req.json();
  const category: string = body.category ?? 'communication';
  const type: string = body.type ?? 'daily_question';

  const prompt = `
You are generating a single relationship prompt.

Return ONLY a JSON object with:
{
  "text": string,
  "type": "${type}",
  "category": "${category}",
  "tone": "light" | "medium" | "deep",
  "difficulty": 1 | 2 | 3
}

The prompt should be suitable for a couple app, not explicit, and emotionally safe.
`;

  const text = await callClaude([{ role: 'user', content: prompt }]);

  let parsed: { text: string; type: string; category: string; tone: string; difficulty: number };
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Claude returned invalid JSON' }, { status: 500 });
  }

  const { error } = await supabase.from('content').insert({
    text: parsed.text,
    type: parsed.type,
    category: parsed.category,
    tone: parsed.tone,
    difficulty: parsed.difficulty
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }

  return NextResponse.json({ content: parsed });
}
