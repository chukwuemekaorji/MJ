'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';

type ContentItem = {
  id: string;
  text: string;
  type: string;
  category: string;
  tone: string;
  difficulty: number;
  metadata: Record<string, unknown>;
};

const LABELS: Record<string, string> = {
  daily_question: 'Daily Spark 🌅',
  couple_question: 'Deep Talk 💬',
  game: 'Play Together 🎲',
  quiz: 'Read My Mind 🧠',
  exercise: 'Together Time 🫶',
  journey: 'Our Journey 🗺️',
  question_pack: 'Question Packs 📦',
  insight_prompt: 'Grow Together 🌱',
  spicy: 'Spicy 🌶️',
};

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const type = params.type as string;

  const [items, setItems] = useState<ContentItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }
    fetch(`/api/content?type=${encodeURIComponent(type)}&coupleId=${stored.coupleId}&limit=30`)
      .then(r => r.json())
      .then(data => {
        const shuffled = (data.content ?? []).sort(() => Math.random() - 0.5);
        setItems(shuffled);
        setLoading(false);
      });
  }, [type, router]);

  const current = items[index];

  function next() { setPicked(null); setIndex(i => Math.min(i + 1, items.length - 1)); }
  function prev() { setPicked(null); setIndex(i => Math.max(i - 1, 0)); }

  const isWYR   = !!current?.metadata?.option_a;
  const isQuiz  = Array.isArray(current?.metadata?.options);
  const hasSteps = Array.isArray(current?.metadata?.steps);
  const toneClass = `tone-${current?.tone ?? 'medium'}`;

  return (
    <main className="min-h-screen flex flex-col play-bg">

      {/* Header */}
      <div className="flex items-center px-4 pt-8 pb-4 max-w-sm mx-auto w-full">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="text-pink-400 text-xl font-bold mr-3 w-8 h-8 flex items-center justify-center rounded-full back-btn-glass"
        >
          ←
        </button>
        <h1 className="text-pink-600 font-bold text-base flex-1">{LABELS[type] ?? type}</h1>
        {!loading && items.length > 0 && (
          <span className="text-pink-300 text-sm">{index + 1} / {items.length}</span>
        )}
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        {loading ? (
          <p className="text-pink-300 text-center animate-pulse">Loading…</p>
        ) : items.length === 0 ? (
          <div className="text-center space-y-3">
            <p className="text-5xl">🃏</p>
            <p className="text-pink-500 font-semibold">Nothing here yet</p>
            <p className="text-pink-300 text-sm">More content coming soon!</p>
          </div>
        ) : (
          <div className="w-full max-w-sm">

            {/* Badges */}
            <div className="flex gap-2 mb-4 justify-center flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${toneClass}`}>
                {current.tone}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-pink-100 text-pink-400">
                {current.category.replace(/_/g, ' ')}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-white text-gray-400">
                {'★'.repeat(current.difficulty)}{'☆'.repeat(3 - current.difficulty)}
              </span>
            </div>

            {/* Main card */}
            <div className="rounded-3xl p-6 space-y-5 play-card">
              <p className="text-gray-700 text-lg font-medium leading-snug text-center">{current.text}</p>

              {/* Would You Rather */}
              {isWYR && (
                <div className="grid grid-cols-2 gap-3">
                  {(['option_a', 'option_b'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPicked(opt)}
                      className={`p-3 rounded-2xl text-sm font-semibold text-center option-btn ${picked === opt ? 'option-picked' : 'option-default'}`}
                    >
                      {String(current.metadata[opt] ?? '')}
                    </button>
                  ))}
                  {picked && (
                    <p className="col-span-2 text-center text-xs text-pink-300 font-medium">
                      Now ask your partner what they picked 💕
                    </p>
                  )}
                </div>
              )}

              {/* Quiz */}
              {isQuiz && !isWYR && (
                <div className="space-y-2">
                  {(current.metadata.options as string[]).map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPicked(String(i))}
                      className={`w-full p-3 rounded-2xl text-sm font-semibold text-left option-btn ${picked === String(i) ? 'option-picked' : 'option-default'}`}
                    >
                      {opt}
                    </button>
                  ))}
                  {typeof current.metadata.instructions === 'string' && (
                    <p className="text-xs text-gray-400 text-center pt-1 italic">
                      {current.metadata.instructions}
                    </p>
                  )}
                </div>
              )}

              {/* Exercise steps */}
              {hasSteps && (
                <div className="space-y-3">
                  {(current.metadata.steps as string[]).map((step, i) => (
                    <div key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white step-number">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                  {typeof current.metadata.duration_minutes === 'number' && (
                    <p className="text-xs text-pink-300 font-semibold pt-1">
                      ⏱ {current.metadata.duration_minutes} minutes
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6 gap-4">
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                className="flex-1 py-3 rounded-2xl font-semibold transition-opacity disabled:opacity-30 nav-prev-btn"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={next}
                disabled={index === items.length - 1}
                className="flex-1 py-3 rounded-2xl font-bold transition-opacity disabled:opacity-30 nav-next-btn"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
