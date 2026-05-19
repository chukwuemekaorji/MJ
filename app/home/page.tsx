'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import { isPushEnabled, subscribeToPush } from '@/lib/pushClient';
import { SunIcon, FlameIcon } from '@/components/icons';

type DailyState = 'loading' | 'unanswered' | 'waiting' | 'revealed' | null;
type Pending    = { id: string; content_id: string; content?: { text: string; type: string } };

const DAILY_LABELS: Record<string, { label: string; sub: string }> = {
  unanswered: { label: "Today's question is ready",  sub: 'Tap to answer privately'                },
  waiting:    { label: 'Waiting for your partner…',  sub: "You've answered — they'll be notified" },
  revealed:   { label: 'Both answered!',             sub: "See each other's answers and discuss"  },
};

export default function HomePage() {
  const router = useRouter();
  const [ready,       setReady]       = useState(false);
  const [userName,    setUserName]    = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [dailyState,  setDailyState]  = useState<DailyState>('loading');
  const [streak,      setStreak]      = useState(0);
  const [streakToday, setStreakToday] = useState(false);
  const [pending,     setPending]     = useState<Pending[]>([]);
  const [pushDismiss, setPushDismiss] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }
    setUserName(stored.userName);
    setPartnerName(stored.userName === 'Maryjane' ? 'Chukwuemeka' : 'Maryjane');
    setReady(true);
    fetchDailyState(stored.coupleId, stored.userId);
    fetchPending(stored.coupleId, stored.userId);
    isPushEnabled().then(e => setPushEnabled(e));
  }, [router]);

  async function fetchDailyState(cId: string, uId: string) {
    try {
      const res  = await fetch(`/api/daily?coupleId=${cId}&userId=${uId}`);
      const data = await res.json();
      setDailyState(data.question ? data.state : null);
      setStreak(data.streak ?? 0);
      setStreakToday(data.streakToday ?? false);
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
          <p className="text-pink-400 text-sm mt-0.5">
            Hey <span className="font-semibold text-pink-600">{userName}</span>
          </p>
        </div>

        {/* Streak badge */}
        {streak > 0 && (
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl ${streakToday ? 'bg-pink-600' : 'bg-pink-100'}`}
            title={streakToday ? `${streak} day streak — kept today!` : `${streak} day streak — answer today to keep it going`}
          >
            <FlameIcon className={`w-4 h-4 ${streakToday ? 'text-white' : 'text-pink-500'}`} />
            <span className={`text-sm font-bold ${streakToday ? 'text-white' : 'text-pink-600'}`}>{streak}</span>
          </div>
        )}
      </div>

      <div className="px-4 space-y-5 max-w-sm mx-auto">

        {/* Push notifications prompt */}
        {!pushEnabled && !pushDismiss && (
          <div className="rounded-2xl p-4 flex items-center gap-3 animate-fade-up push-prompt-card">
            <div className="flex-1">
              <p className="text-pink-700 font-semibold text-sm">Stay in the loop</p>
              <p className="text-pink-400 text-xs mt-0.5">Get notified when {partnerName} answers a question</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={() => setPushDismiss(true)} className="text-pink-300 text-xs px-2 py-1">Later</button>
              <button type="button" onClick={enablePush} className="text-xs font-bold px-3 py-1.5 rounded-xl push-enable-btn">Enable</button>
            </div>
          </div>
        )}

        {/* Streak broken warning */}
        {streak > 0 && !streakToday && dailyState === 'unanswered' && (
          <div className="rounded-2xl p-3 flex items-center gap-3 animate-fade-up" style={{ background: 'linear-gradient(135deg, #FFF3E0, #FFEDD5)' }}>
            <FlameIcon className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <p className="text-orange-700 text-xs font-medium">
              Answer today to keep your {streak} day streak alive
            </p>
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
                className="w-full text-left rounded-2xl p-4 flex items-center gap-3 animate-fade-up pending-card"
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

        {/* Explore banner */}
        <button
          type="button"
          onClick={() => router.push('/explore')}
          className="w-full text-left rounded-3xl p-5 flex items-center justify-between pink-card"
        >
          <div>
            <p className="font-bold text-gray-800 text-base">Explore activities</p>
            <p className="text-pink-400 text-sm mt-0.5">Questions, games, quizzes, exercises &amp; more</p>
          </div>
          <span className="text-pink-400 text-2xl ml-3 flex-shrink-0">→</span>
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
