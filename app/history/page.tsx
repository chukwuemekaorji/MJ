'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import { ClockIcon } from '@/components/icons';

type Session = {
  id: string;
  activity_type: string;
  category: string;   // this is the pack_name
  completed_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  couple_question: 'Deep Talk',    game:          'Play Together',
  quiz:            'Read My Mind', exercise:      'Together Time',
  journey:         'Our Journey',  question_pack: 'Questions',
  insight_prompt:  'Grow Together', spicy:        'Spicy',
};

export default function HistoryPage() {
  const router  = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }
    fetch(`/api/sessions/history?coupleId=${stored.coupleId}`)
      .then(r => r.json())
      .then(data => { setSessions(data.sessions ?? []); setLoading(false); });
  }, [router]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <main className="min-h-screen pb-24 home-bg">
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <ClockIcon className="w-6 h-6 text-pink-400" />
        <h1 className="text-2xl font-bold home-title">History</h1>
      </div>

      <div className="px-4 max-w-sm mx-auto space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="pink-card p-4 h-16 animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center mt-16 space-y-3">
            <ClockIcon className="w-12 h-12 text-pink-200 mx-auto" />
            <p className="text-pink-400 font-semibold">No history yet</p>
            <p className="text-pink-300 text-sm">
              Complete an activity together and it will show up here
            </p>
          </div>
        ) : (
          sessions.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                router.push(
                  `/activity?packName=${encodeURIComponent(s.category)}&type=${s.activity_type}`
                )
              }
              className="w-full text-left pink-card p-4 flex items-start gap-3 active:scale-98 transition-transform"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                    {TYPE_LABEL[s.activity_type] ?? s.activity_type}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-pink-200 flex-shrink-0" />
                  <span className="text-xs text-green-500 font-semibold">Both answered</span>
                </div>
                <p className="text-gray-700 text-sm font-semibold leading-snug">{s.category}</p>
                <p className="text-pink-300 text-xs mt-1">{formatDate(s.completed_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-pink-300 text-sm">→</span>
                <span className="text-xs text-pink-300">See answers</span>
              </div>
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </main>
  );
}
