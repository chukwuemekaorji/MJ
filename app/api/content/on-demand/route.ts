import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { callClaude } from '@/lib/claude';

function isFootballQuestion(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.toLowerCase();
  return normalized.includes('why') && normalized.includes('not') && normalized.includes('playing football');
}

function footballReply() {
  const replies = [
    "I'm a center back. Rest nau.",
    "I'm a center back, broski. Die the matter, change topic.",
    "Ehn tell Real Madrid to come and sign me, I better pass Rudiger.",
    "I went to Faith Academy Canaanland Ota and captained the school team. Rest nau.",
    "Faith Academy Canaanland Ota school team captain, center back. Die the matter broski.",
    "I'm a center back. Rest, please.",
    "Die the matter broski. Change topic."
  ];

  return replies[Math.floor(Math.random() * replies.length)];
}

function isSchoolMemoryQuestion(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.toLowerCase();
  return (
    (normalized.includes('remember') || normalized.includes('remeber')) &&
    (normalized.includes('school') || normalized.includes('faith academy') || normalized.includes('canaanland'))
  );
}

function isGuessMeQuestion(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.toLowerCase();
  return normalized.includes('guess') && (normalized.includes('me') || normalized.includes('who'));
}

function guessMeReply() {
  const replies = [
    'Tell the person to press money first, make I get strength to guess.',
    'Press money first abeg, guessing needs energy.',
    'Make dem press money so I go get strength guess.',
    'Tell them to send money first, then my guessing spirit go wake up.'
  ];

  return replies[Math.floor(Math.random() * replies.length)];
}

export async function POST(req: Request) {
  const body = await req.json();
  const userPrompt: unknown = body.prompt ?? body.message ?? body.text;
  const category: string = body.category ?? 'communication';
  const type: string = body.type ?? 'daily_question';

  if (isFootballQuestion(userPrompt)) {
    return NextResponse.json({
      content: {
        text: footballReply(),
        tone: 'sarcastic'
      }
    });
  }

  if (isSchoolMemoryQuestion(userPrompt)) {
    return NextResponse.json({
      content: {
        text: 'Old things have passed away, behold all things have become new.',
        tone: 'sarcastic'
      }
    });
  }

  if (isGuessMeQuestion(userPrompt)) {
    return NextResponse.json({
      content: {
        text: guessMeReply(),
        tone: 'sarcastic'
      }
    });
  }

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
