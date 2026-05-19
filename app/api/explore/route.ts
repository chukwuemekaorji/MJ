import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseClient';

export async function GET() {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('content')
    .select('type, category, metadata')
    .eq('is_active', true)
    .not('metadata->>pack_name', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by pack_name
  const map: Record<string, {
    pack_name: string; type: string; category: string;
    description: string; count: number;
  }> = {};

  for (const item of data ?? []) {
    const name = item.metadata?.pack_name as string;
    const desc = item.metadata?.pack_description as string ?? '';
    if (!name) continue;
    if (!map[name]) {
      map[name] = { pack_name: name, type: item.type, category: item.category, description: desc, count: 0 };
    }
    map[name].count++;
  }

  const packs = Object.values(map).sort((a, b) => a.pack_name.localeCompare(b.pack_name));
  return NextResponse.json({ packs });
}
