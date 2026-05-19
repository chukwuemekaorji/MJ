'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import {
  StackIcon, SparkleIcon, QuizIcon, HeartIcon,
  MapIcon, FlameIcon, ChatIcon, ZapIcon, CheckIcon,
} from '@/components/icons';

type Pack = { pack_name: string; type: string; category: string; description: string; count: number };
type Session = { packName: string; activityType: string; myDone: boolean; partnerDone: boolean; completed: boolean };
type Tab = 'all' | 'unanswered' | 'answered';

const AREA_INFO: Record<string, { label: string; desc: string }> = {
  communication: { label: 'Communication',   desc: 'Improve how you talk and listen to each other'  },
  conflict:      { label: 'Conflict',        desc: 'Handle disagreements with love and respect'      },
  intimacy:      { label: 'Intimacy',        desc: 'Deepen emotional and physical closeness'         },
  self_growth:   { label: 'Personal Growth', desc: 'Grow individually while growing together'        },
  fun:           { label: 'Fun & Laughter',  desc: 'Play, laugh and enjoy each other'               },
  future:        { label: 'Future Plans',    desc: 'Dream about and plan your life together'         },
  childhood:     { label: 'Childhood',       desc: 'Revisit your earliest years together'            },
  finances:      { label: 'Money & Finances', desc: 'Get on the same page about your finances'      },
  travel:        { label: 'Travel & Adventure', desc: 'Explore the world you want to see together'  },
  values:        { label: 'Values & Beliefs', desc: 'Understand what matters most to each of you'   },
  gratitude:     { label: 'Gratitude',       desc: 'Build deeper appreciation for each other'       },
  health:        { label: 'Health & Wellness', desc: 'Support each other\'s wellbeing'              },
  family:        { label: 'Family',          desc: 'Connect over your roots and family bonds'       },
  memories:      { label: 'Memories',        desc: 'Revisit and cherish your shared moments'        },
  friendship:    { label: 'Friendship',      desc: 'Strengthen your bond as best friends'           },
  dreams:        { label: 'Dreams',          desc: 'Share your hopes and aspirations'               },
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  question_pack:   StackIcon,
  game:            SparkleIcon,
  quiz:            QuizIcon,
  exercise:        HeartIcon,
  journey:         MapIcon,
  spicy:           FlameIcon,
  couple_question: ChatIcon,
  insight_prompt:  ZapIcon,
};

const TYPE_LABEL: Record<string, string> = {
  question_pack: 'Pack', game: 'Game', quiz: 'Quiz',
  exercise: 'Exercise', journey: 'Journey', spicy: 'Spicy',
  couple_question: 'Questions', insight_prompt: 'Insight',
};

function CategoryContent() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const category     = params.category as string;
  const typeFilter   = searchParams.get('type');

  const [packs,    setPacks]    = useState<Pack[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab,      setTab]      = useState<Tab>('all');
  const [loading,  setLoading]  = useState(true);

  const info = AREA_INFO[category] ?? { label: category, desc: '' };

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }

    const url = typeFilter
      ? `/api/explore?category=${category}&type=${typeFilter}`
      : `/api/explore?category=${category}`;

    Promise.all([
      fetch(url).then(r => r.json()),
      fetch(`/api/activity/status?coupleId=${stored.coupleId}&userId=${stored.userId}`).then(r => r.json()),
    ]).then(([packData, sessionData]) => {
      setPacks(packData.packs ?? []);
      setSessions(sessionData.sessions ?? []);
      setLoading(false);
    });
  }, [category, typeFilter, router]);

  function sessionFor(pack: Pack): Session | undefined {
    return sessions.find(s => s.packName === pack.pack_name && s.activityType === pack.type);
  }

  const allPacks        = packs;
  const unansweredPacks = packs.filter(p => { const s = sessionFor(p); return !s || !s.myDone; });
  const answeredPacks   = packs.filter(p => !!sessionFor(p)?.completed);

  const filtered = tab === 'unanswered' ? unansweredPacks
                 : tab === 'answered'   ? answeredPacks
                 : allPacks;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'all',        label: 'All',        count: allPacks.length        },
    { key: 'unanswered', label: 'Unanswered', count: unansweredPacks.length },
    { key: 'answered',   label: 'Answered',   count: answeredPacks.length   },
  ];

  return (
    <main className="min-h-screen pb-24 home-bg">

      {/* Header */}
      <div className="px-4 pt-10 pb-5 max-w-sm mx-auto">
        <button type="button" onClick={() => router.back()} className="text-pink-400 text-sm mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{info.label}</h1>
        {info.desc && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{info.desc}</p>}
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-5 max-w-sm mx-auto">
        <div className="flex bg-white rounded-2xl p-1 gap-1 tab-bar">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                tab === t.key ? 'bg-pink-600 text-white' : 'text-gray-400'
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-xs font-bold ${tab === t.key ? 'text-white/80' : 'text-pink-300'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity list */}
      <div className="px-4 max-w-sm mx-auto space-y-0">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 animate-pulse py-4">
                <div className="w-14 h-14 rounded-2xl bg-pink-100 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-pink-100 rounded w-1/4" />
                  <div className="h-4 bg-pink-50 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-pink-400 text-center py-12">
            {tab === 'answered' ? 'No completed activities yet' : 'No activities here yet'}
          </p>
        ) : (
          filtered.map((pack, i) => {
            const Icon    = TYPE_ICON[pack.type] ?? StackIcon;
            const session = sessionFor(pack);
            const done    = session?.completed ?? false;
            const mine    = session?.myDone    ?? false;

            return (
              <button
                key={pack.pack_name}
                type="button"
                onClick={() => router.push(`/activity?packName=${encodeURIComponent(pack.pack_name)}&type=${pack.type}`)}
                className={`w-full text-left flex items-center gap-4 py-4 transition-transform active:scale-[0.98] ${
                  i < filtered.length - 1 ? 'border-b border-pink-100' : ''
                }`}
              >
                {/* Icon square */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 act-icon-${pack.type}`}>
                  <Icon className="w-6 h-6 text-pink-500" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mb-1">
                    {TYPE_LABEL[pack.type] ?? pack.type}
                  </span>
                  <p className="font-bold text-gray-800 text-sm leading-snug">{pack.pack_name}</p>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {done ? (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  ) : mine ? (
                    <span className="text-xs text-pink-400 font-medium">Waiting</span>
                  ) : (
                    <span className="text-pink-300 text-lg">→</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <BottomNav />
    </main>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center home-bg"><p className="text-pink-400 animate-pulse">Loading…</p></main>}>
      <CategoryContent />
    </Suspense>
  );
}
