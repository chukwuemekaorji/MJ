'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import {
  ChatIcon, SparkleIcon, QuizIcon, HeartIcon,
  MapIcon, StackIcon, FlameIcon,
} from '@/components/icons';

const TYPE_CIRCLES = [
  { label: 'Questions', value: 'question_pack', Icon: StackIcon  },
  { label: 'Games',     value: 'game',          Icon: SparkleIcon },
  { label: 'Quizzes',   value: 'quiz',          Icon: QuizIcon   },
  { label: 'Exercises', value: 'exercise',      Icon: HeartIcon  },
  { label: 'Journeys',  value: 'journey',       Icon: MapIcon    },
  { label: 'Spicy',     value: 'spicy',         Icon: FlameIcon  },
];

const AREAS = [
  { value: 'communication', label: 'Communication',     desc: 'Improve how you talk and listen to each other'   },
  { value: 'conflict',      label: 'Conflict',          desc: 'Handle disagreements with love and respect'       },
  { value: 'intimacy',      label: 'Intimacy',          desc: 'Deepen emotional and physical closeness'          },
  { value: 'self_growth',   label: 'Personal Growth',   desc: 'Grow individually while growing together'         },
  { value: 'fun',           label: 'Fun & Laughter',    desc: 'Play, laugh and enjoy each other'                 },
  { value: 'future',        label: 'Future Plans',      desc: 'Dream about and plan your life together'          },
  { value: 'childhood',     label: 'Childhood',         desc: 'Revisit your earliest years together'             },
  { value: 'finances',      label: 'Money & Finances',  desc: 'Get on the same page about your finances'        },
  { value: 'travel',        label: 'Travel & Adventure', desc: 'Explore the world you want to see together'     },
  { value: 'values',        label: 'Values & Beliefs',  desc: 'Understand what matters most to each of you'     },
  { value: 'gratitude',     label: 'Gratitude',         desc: 'Build deeper appreciation for each other'        },
  { value: 'health',        label: 'Health & Wellness', desc: 'Support each other\'s wellbeing'                 },
  { value: 'family',        label: 'Family',            desc: 'Connect over your roots and family bonds'        },
  { value: 'memories',      label: 'Memories',          desc: 'Revisit and cherish your shared moments'         },
  { value: 'friendship',    label: 'Friendship',        desc: 'Strengthen your bond as best friends'            },
  { value: 'dreams',        label: 'Dreams',            desc: 'Share your hopes and aspirations'                },
];

export default function ExplorePage() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [userName,   setUserName]   = useState('');

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }
    setUserName(stored.userName);
  }, [router]);

  const partnerName = userName === 'Maryjane' ? 'Chukwuemeka' : 'Maryjane';

  function goToArea(category: string) {
    const url = typeFilter
      ? `/explore/${category}?type=${typeFilter}`
      : `/explore/${category}`;
    router.push(url);
  }

  return (
    <main className="min-h-screen pb-24 home-bg">

      {/* Header */}
      <div className="px-5 pt-12 pb-5">
        <h1 className="text-4xl font-bold home-title">Explore</h1>
        <p className="text-pink-400 text-sm mt-1">For you and {partnerName}</p>
      </div>

      {/* Type filter circles — horizontal scroll, no scrollbar */}
      <div className="px-4 mb-6 overflow-x-auto hide-scroll">
        <div className="flex gap-5 pb-1 w-max">
          {TYPE_CIRCLES.map(({ label, value, Icon }) => {
            const active = typeFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(active ? null : value)}
                className="flex flex-col items-center gap-2 transition-transform active:scale-95"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${active ? 'type-circle-active' : 'type-circle-inactive'}`}>
                  <Icon className={`w-7 h-7 ${active ? 'text-white' : 'text-pink-400'}`} />
                </div>
                <span className={`text-xs font-semibold ${active ? 'type-label-active' : 'type-label-inactive'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activities by area */}
      <div className="px-4 max-w-sm mx-auto">
        <p className="text-base font-bold text-gray-700 mb-3 px-1">Activities by area</p>
        <div className="space-y-2">
          {AREAS.map(area => (
            <button
              key={area.value}
              type="button"
              onClick={() => goToArea(area.value)}
              className="w-full text-left pink-card px-5 py-4 flex items-center gap-4 transition-transform active:scale-[0.98]"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">{area.label}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-snug">{area.desc}</p>
              </div>
              <span className="text-pink-300 text-lg flex-shrink-0">→</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
