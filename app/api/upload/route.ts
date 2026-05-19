import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const { fileName, mimeType, folder = 'answers' } = await req.json();
  if (!fileName || !mimeType) {
    return NextResponse.json({ error: 'Missing fileName or mimeType' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const ext  = fileName.split('.').pop() ?? 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ signedUrl: data.signedUrl, path, token: data.token });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.storage
    .from('uploads')
    .createSignedUrl(path, 60 * 60 * 24); // 24h

  return NextResponse.json({ url: data?.signedUrl ?? null });
}
