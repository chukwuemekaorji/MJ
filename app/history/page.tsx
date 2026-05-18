'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import { ClockIcon } from '@/components/icons';

type Session = { id: string; content_type: string; completed_at: string; content?: { text: string; category: string } };

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
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const TYPE_LABEL: Record<string, string> = {
    couple_question: 'Deep Talk', game: 'Play Together', quiz: 'Read My Mind',
    exercise: 'Together Time', journey: 'Our Journey', question_pack: 'Question Packs',
    insight_prompt: 'Grow Together', spicy: 'Spicy',
  };

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
            <p className="text-pink-300 text-sm">Answer questions together and they&apos;ll show up here</p>
          </div>
        ) : (
          sessions.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => router.push(`/discuss/${s.id}`)}
              className="w-full text-left pink-card p-4 flex items-start gap-3 active:scale-98 transition-transform"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">{TYPE_LABEL[s.content_type] ?? s.content_type}</span>
                  {s.content?.category && (
                    <span className="text-xs text-gray-400">{s.content.category.replace(/_/g, ' ')}</span>
                  )}
                </div>
                <p className="text-gray-700 text-sm font-medium leading-snug truncate">{s.content?.text ?? 'Session'}</p>
                <p className="text-pink-300 text-xs mt-1">{formatDate(s.completed_at)}</p>
              </div>
              <span className="text-pink-300 text-sm flex-shrink-0 mt-1">→</span>
            </button>
          ))
        )}
      </div>
      <BottomNav />
    </main>
  );
}
