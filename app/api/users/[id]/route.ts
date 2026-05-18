import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body   = await req.json();

  const allowed: Record<string, unknown> = {};
  if (body.avatar_color) allowed.avatar_color = body.avatar_color;
  if (body.avatar_url   !== undefined) allowed.avatar_url = body.avatar_url;
  if (body.display_name) allowed.display_name = body.display_name;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('users').update(allowed).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, avatar_color, couple_id')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
