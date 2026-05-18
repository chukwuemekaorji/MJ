'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple, clearCouple } from '@/lib/coupleStore';

const CATEGORIES = [
  {
    type: 'daily_question',
    label: 'Daily Spark',
    emoji: '🌅',
    desc: 'One question, every day',
    bg: '#FFF0F8',
  },
  {
    type: 'couple_question',
    label: 'Deep Talk',
    emoji: '💬',
    desc: 'Go deeper, get closer',
    bg: '#F0FFF8',
  },
  {
    type: 'game',
    label: 'Play Together',
    emoji: '🎲',
    desc: 'Would you rather, this or that',
    bg: '#F0F4FF',
  },
  {
    type: 'quiz',
    label: 'Read My Mind',
    emoji: '🧠',
    desc: 'How well do you know each other?',
    bg: '#FFF8F0',
  },
  {
    type: 'exercise',
    label: 'Together Time',
    emoji: '🫶',
    desc: 'Activities built for two',
    bg: '#F8F0FF',
  },
  {
    type: 'journey',
    label: 'Our Journey',
    emoji: '🗺️',
    desc: '7-day relationship adventures',
    bg: '#F0FFFC',
  },
  {
    type: 'question_pack',
    label: 'Question Packs',
    emoji: '📦',
    desc: 'Themed sets to explore',
    bg: '#FFFFF0',
  },
  {
    type: 'insight_prompt',
    label: 'Grow Together',
    emoji: '🌱',
    desc: 'Reflect and evolve as one',
    bg: '#F0FFF0',
  },
  {
    type: 'spicy',
    label: 'Spicy',
    emoji: '🌶️',
    desc: 'Adults only — handle with care',
    bg: '#FFF0F0',
    adult: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) router.replace('/');
    else setReady(true);
  }, [router]);

  function handleDisconnect() {
    clearCouple();
    router.replace('/');
  }

  if (!ready) return null;

  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ background: 'linear-gradient(160deg, #FCEAF2 0%, #F8DDE8 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between max-w-sm mx-auto mb-8">
        <div>
          <h1
            className="text-4xl font-bold"
            style={{ fontFamily: 'Georgia, serif', color: '#E8A8C4' }}
          >
            MJ
          </h1>
          <p className="text-pink-400 text-sm mt-0.5">What are we playing today? 💕</p>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          className="text-pink-300 text-xs underline"
        >
          disconnect
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat.type}
            type="button"
            onClick={() => router.push(`/play/${cat.type}`)}
            className="flex flex-col items-start p-4 rounded-3xl text-left transition-transform active:scale-95"
            style={{
              backgroundColor: cat.bg,
              boxShadow: '0 2px 16px rgba(232,168,196,0.25)',
            }}
          >
            <span className="text-3xl mb-2">{cat.emoji}</span>
            <span className="font-bold text-gray-700 text-sm leading-tight">{cat.label}</span>
            <span className="text-gray-400 text-xs mt-1 leading-tight">{cat.desc}</span>
            {cat.adult && (
              <span className="mt-2 text-xs bg-red-100 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                18+
              </span>
            )}
          </button>
        ))}
      </div>
    </main>
  );
}
