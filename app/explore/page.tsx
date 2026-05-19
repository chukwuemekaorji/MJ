'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';

type Pack = {
  pack_name: string;
  type: string;
  category: string;
  description: string;
  count: number;
};

const TYPE_FILTERS = [
  { label: 'All',        value: null           },
  { label: 'Questions',  value: 'question_pack' },
  { label: 'Games',      value: 'game'          },
  { label: 'Quizzes',    value: 'quiz'          },
  { label: 'Exercises',  value: 'exercise'      },
  { label: 'Journeys',   value: 'journey'       },
  { label: 'Spicy 🌶️',  value: 'spicy'         },
];

const TYPE_COLORS: Record<string, string> = {
  question_pack: '#FFF0F8',
  game:          '#F0F4FF',
  quiz:          '#FFF8F0',
  exercise:      '#F0FFF0',
  journey:       '#F0FFFC',
  spicy:         '#FFF0F0',
  couple_question: '#FFF0F8',
};

const TYPE_LABEL: Record<string, string> = {
  question_pack:   'Questions',
  game:            'Game',
  quiz:            'Quiz',
  exercise:        'Exercise',
  journey:         'Journey',
  spicy:           'Spicy 🌶️',
  couple_question: 'Questions',
};

const UNIT: Record<string, string> = {
  question_pack: 'questions',
  game:          'rounds',
  quiz:          'questions',
  exercise:      'steps',
  journey:       'days',
  spicy:         'prompts',
  couple_question: 'questions',
};

export default function ExplorePage() {
  const router = useRouter();
  const [packs,     setPacks]     = useState<Pack[]>([]);
  const [filter,    setFilter]    = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }
    fetch('/api/explore')
      .then(r => r.json())
      .then(d => { setPacks(d.packs ?? []); setLoading(false); });
  }, [router]);

  const visible = filter ? packs.filter(p => p.type === filter) : packs;

  return (
    <main className="min-h-screen pb-24 home-bg">

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-4xl font-bold home-title">Explore</h1>
        <p className="text-pink-400 text-sm mt-1">Pick an activity to do together</p>
      </div>

      {/* Type filter chips */}
      <div className="px-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
          {TYPE_FILTERS.map(f => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-pink-500 border border-pink-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pack grid */}
      <div className="px-4 max-w-sm mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="pink-card p-5 animate-pulse">
                <div className="h-4 bg-pink-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-pink-50 rounded w-full" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="text-pink-400 text-center py-12">No activities here yet</p>
        ) : (
          <div className="space-y-3">
            {visible.map(pack => (
              <button
                key={pack.pack_name}
                type="button"
                onClick={() => router.push(
                  `/activity?packName=${encodeURIComponent(pack.pack_name)}&type=${pack.type}`
                )}
                className="w-full text-left rounded-3xl p-5 flex items-center gap-4 transition-transform active:scale-[0.98]"
                style={{ backgroundColor: TYPE_COLORS[pack.type] ?? '#FFF0F8', boxShadow: '0 2px 16px rgba(232,168,196,0.2)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                      {TYPE_LABEL[pack.type] ?? pack.type}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 text-base leading-tight">{pack.pack_name}</p>
                  {pack.description && (
                    <p className="text-gray-400 text-xs mt-1 leading-snug line-clamp-2">{pack.description}</p>
                  )}
                  <p className="text-pink-400 text-xs mt-2 font-medium">
                    {pack.count} {UNIT[pack.type] ?? 'items'}
                  </p>
                </div>
                <span className="text-pink-300 text-xl flex-shrink-0">→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
