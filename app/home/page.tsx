'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple, clearCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import { isPushEnabled, subscribeToPush } from '@/lib/pushClient';
import {
  SunIcon, ChatIcon, SparkleIcon, QuizIcon,
  HeartIcon, MapIcon, StackIcon, ZapIcon, FlameIcon,
} from '@/components/icons';

type DailyState = 'loading' | 'unanswered' | 'waiting' | 'revealed' | null;
type Pending    = { id: string; content_id: string; content?: { text: string; type: string } };

const CATEGORIES = [
  { type: 'couple_question', label: 'Deep Talk',      Icon: ChatIcon,    desc: 'Go deeper together'      },
  { type: 'game',            label: 'Play Together',  Icon: SparkleIcon, desc: 'Would you rather & more' },
  { type: 'quiz',            label: 'Read My Mind',   Icon: QuizIcon,    desc: 'How well do you know me?' },
  { type: 'exercise',        label: 'Together Time',  Icon: HeartIcon,   desc: 'Guided couple activities' },
  { type: 'journey',         label: 'Our Journey',    Icon: MapIcon,     desc: '7-day guided adventures'  },
  { type: 'question_pack',   label: 'Question Packs', Icon: StackIcon,   desc: 'Themed deep-dive sets'    },
  { type: 'insight_prompt',  label: 'Grow Together',  Icon: ZapIcon,     desc: 'Reflect and evolve as one'},
  { type: 'spicy',           label: 'Spicy',          Icon: FlameIcon,   desc: 'Adults only', adult: true },
];

const CAT_CSS: Record<string, string> = {
  couple_question: 'cat-couple-question', game: 'cat-game', quiz: 'cat-quiz',
  exercise: 'cat-exercise', journey: 'cat-journey', question_pack: 'cat-question-pack',
  insight_prompt: 'cat-insight-prompt', spicy: 'cat-spicy',
};

const DAILY_LABELS: Record<string, { label: string; sub: string }> = {
  unanswered: { label: "Today's question is ready",  sub: 'Tap to answer privately' },
  waiting:    { label: 'Waiting for your partner…',  sub: "You've answered — they'll be notified" },
  revealed:   { label: 'Both answered!',             sub: "See each other's answers and discuss" },
};

export default function HomePage() {
  const router = useRouter();
  const [ready,        setReady]        = useState(false);
  const [userName,     setUserName]     = useState('');
  const [partnerName,  setPartnerName]  = useState('');
  const [coupleId,     setCoupleId]     = useState('');
  const [userId,       setUserId]       = useState('');
  const [dailyState,   setDailyState]   = useState<DailyState>('loading');
  const [pending,      setPending]      = useState<Pending[]>([]);
  const [pushDismiss,  setPushDismiss]  = useState(false);
  const [pushEnabled,  setPushEnabled]  = useState(true);

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }
    setUserName(stored.userName);
    setPartnerName(stored.userName === 'Maryjane' ? 'Chukwuemeka' : 'Maryjane');
    setCoupleId(stored.coupleId);
    setUserId(stored.userId);
    setReady(true);
    fetchDailyState(stored.coupleId, stored.userId);
    fetchPending(stored.coupleId, stored.userId);
    isPushEnabled().then(enabled => setPushEnabled(enabled));
  }, [router]);

  async function fetchDailyState(cId: string, uId: string) {
    try {
      const res  = await fetch(`/api/daily?coupleId=${cId}&userId=${uId}`);
      const data = await res.json();
      setDailyState(data.question ? data.state : null);
    } catch { setDailyState(null); }
  }

  async function enablePush() {
    const stored = getStoredCouple();
    if (!stored) return;
    const result = await subscribeToPush(stored.userId);
    if (result === 'ok') setPushEnabled(true);
    setPushDismiss(true);
  }

  async function fetchPending(cId: string, uId: string) {
    try {
      const res  = await fetch(`/api/sessions/pending?coupleId=${cId}&userId=${uId}`);
      const data = await res.json();
      setPending(data.pending ?? []);
    } catch { /* silent */ }
  }

  if (!ready) return null;

  const dailyInfo = dailyState && dailyState !== 'loading' ? DAILY_LABELS[dailyState] : null;

  return (
    <main className="min-h-screen pb-24 home-bg">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold home-title">MJ</h1>
          <p className="text-pink-400 text-sm mt-0.5">Hey <span className="font-semibold text-pink-600">{userName}</span></p>
        </div>
        <button type="button" onClick={() => { clearCouple(); router.replace('/'); }} className="text-pink-300 text-xs underline">
          disconnect
        </button>
      </div>

      <div className="px-4 space-y-5 max-w-sm mx-auto">

        {/* Push notifications prompt */}
        {!pushEnabled && !pushDismiss && (
          <div className="rounded-2xl p-4 flex items-center gap-3 animate-fade-up" style={{ background: 'linear-gradient(135deg, #FCE4EC, #F8DDE8)' }}>
            <div className="flex-1">
              <p className="text-pink-700 font-semibold text-sm">Stay in the loop</p>
              <p className="text-pink-400 text-xs mt-0.5">Get notified when {partnerName} answers a question</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={() => setPushDismiss(true)} className="text-pink-300 text-xs px-2 py-1">Later</button>
              <button type="button" onClick={enablePush} className="text-white text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #FF4FA3, #C2185B)' }}>Enable</button>
            </div>
          </div>
        )}

        {/* Pending partner answers */}
        {pending.length > 0 && (
          <div className="space-y-2">
            {pending.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => router.push(`/play/${p.content?.type ?? 'couple_question'}?highlight=${p.content_id}`)}
                className="w-full text-left rounded-2xl p-4 flex items-center gap-3 animate-fade-up"
                style={{ background: 'linear-gradient(135deg, #FCEAF2, #F8DDE8)', boxShadow: '0 2px 12px rgba(232,168,196,0.3)' }}
              >
                <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-pink-700 font-semibold text-sm">{partnerName} answered a question</p>
                  <p className="text-pink-400 text-xs truncate mt-0.5">{p.content?.text ?? 'Tap to respond'}</p>
                </div>
                <span className="text-pink-400 text-sm flex-shrink-0">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Daily Question */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <SunIcon className="w-4 h-4 text-pink-400" />
            <p className="text-xs font-bold text-pink-400 uppercase tracking-widest">Daily Question</p>
          </div>

          {dailyState === 'loading' ? (
            <div className="pink-card p-5 animate-pulse">
              <div className="h-4 bg-pink-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-pink-50 rounded w-1/2" />
            </div>
          ) : dailyInfo ? (
            <button
              type="button"
              onClick={() => router.push('/daily')}
              className={`w-full text-left rounded-3xl p-5 transition-transform active:scale-98 daily-card-shadow daily-${dailyState}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white font-bold text-base leading-snug">{dailyInfo.label}</p>
                  <p className="text-white/75 text-sm mt-1">{dailyInfo.sub}</p>
                </div>
                <span className="text-white text-2xl ml-3">→</span>
              </div>
              {dailyState === 'waiting' && (
                <div className="flex gap-1 mt-3 items-center">
                  {[0, 1, 2].map(i => <span key={i} className={`w-2 h-2 rounded-full bg-white/60 bounce-dot delay-${i}`} />)}
                  <span className="text-white/70 text-xs ml-1">Waiting for {partnerName}</span>
                </div>
              )}
            </button>
          ) : (
            <button type="button" onClick={() => router.push('/daily')} className="w-full text-left pink-card p-5">
              <p className="text-pink-600 font-bold">No question yet today</p>
              <p className="text-pink-400 text-sm mt-1">Tap to check</p>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-px bg-pink-200" />
          <span className="text-pink-300 text-xs font-semibold tracking-widest uppercase">Explore</span>
          <div className="flex-1 h-px bg-pink-200" />
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.type}
              type="button"
              onClick={() => router.push(`/play/${cat.type}`)}
              className={`flex flex-col items-start p-4 rounded-3xl text-left transition-transform active:scale-95 ${CAT_CSS[cat.type]} cat-shadow`}
            >
              <cat.Icon className="w-7 h-7 text-pink-400 mb-2" />
              <span className="font-bold text-gray-700 text-sm leading-tight">{cat.label}</span>
              <span className="text-gray-400 text-xs mt-1 leading-tight">{cat.desc}</span>
              {cat.adult && <span className="mt-2 text-xs bg-red-100 text-red-400 px-2 py-0.5 rounded-full font-semibold">18+</span>}
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
