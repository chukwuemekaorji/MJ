import { NextRequest, NextResponse } from 'next/server';
import { generateOnDemandContent } from '@/lib/claude';

type RequestBody = {
  prompt?: string;
  context?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  try {
    const content = await generateOnDemandContent({
      prompt,
      context: body.context?.trim() || undefined
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to generate on-demand content:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 502 });
  }
}

export function GET() {
  return NextResponse.json(
    {
      message: 'Send a POST request with { prompt, context? } to generate content on demand.'
    },
    { status: 200 }
  );
}
