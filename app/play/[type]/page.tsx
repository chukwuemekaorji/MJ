'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import { BackIcon, CheckIcon, SendIcon, TimerIcon } from '@/components/icons';

type ContentItem = { id: string; text: string; type: string; category: string; tone: string; difficulty: number; metadata: Record<string, unknown> };
type CardState   = 'idle' | 'answering' | 'waiting' | 'revealed';

const LABELS: Record<string, string> = {
  daily_question: 'Daily Spark', couple_question: 'Deep Talk', game: 'Play Together',
  quiz: 'Read My Mind', exercise: 'Together Time', journey: 'Our Journey',
  question_pack: 'Question Packs', insight_prompt: 'Grow Together', spicy: 'Spicy',
};

export default function PlayPage() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const highlight    = searchParams.get('highlight');
  const type         = params.type as string;
  const couple       = useRef(getStoredCouple());

  const [items,      setItems]      = useState<ContentItem[]>([]);
  const [index,      setIndex]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [cardState,  setCardState]  = useState<CardState>('idle');
  const [answer,     setAnswer]     = useState('');
  const [picked,     setPicked]     = useState<string | null>(null);
  const [yourAnswer, setYourAnswer] = useState<unknown>(null);
  const [partnerAns, setPartnerAns] = useState<unknown>(null);
  const [sessionId,  setSessionId]  = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const partnerName = couple.current?.userName === 'Maryjane' ? 'Chukwuemeka' : 'Maryjane';

  useEffect(() => {
    const c = couple.current;
    if (!c) { router.replace('/'); return; }
    fetch(`/api/content?type=${encodeURIComponent(type)}&coupleId=${c.coupleId}&limit=30`)
      .then(r => r.json())
      .then(data => {
        const shuffled = (data.content ?? []).sort(() => Math.random() - 0.5);
        if (highlight) {
          const hi = shuffled.findIndex((it: ContentItem) => it.id === highlight);
          if (hi > 0) { const [item] = shuffled.splice(hi, 1); shuffled.unshift(item); }
        }
        setItems(shuffled);
        setLoading(false);
      });
  }, [type, router, highlight]);

  // fetch session state whenever card changes
  useEffect(() => {
    if (!items[index]) return;
    resetCard();
    fetchSession(items[index].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length]);

  useEffect(() => {
    if (cardState === 'waiting') {
      pollRef.current = setInterval(() => fetchSession(items[index]?.id), 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardState]);

  function resetCard() {
    setCardState('idle'); setAnswer(''); setPicked(null);
    setYourAnswer(null); setPartnerAns(null); setSessionId(null);
  }

  async function fetchSession(contentId: string) {
    const c = couple.current;
    if (!c || !contentId) return;
    const res  = await fetch(`/api/sessions?contentId=${contentId}&coupleId=${c.coupleId}&userId=${c.userId}`);
    const data = await res.json();
    if (!data.session) { setCardState('idle'); return; }
    setSessionId(data.sessionId);
    setYourAnswer(data.yourAnswer);
    if (data.bothAnswered) {
      setPartnerAns(data.partnerAnswer);
      setCardState('revealed');
    } else if (data.yourAnswer) {
      setCardState('waiting');
    } else {
      setCardState('idle');
    }
  }

  async function submitAnswer(ans: unknown) {
    const c = couple.current;
    const item = items[index];
    if (!c || !item || submitting) return;
    setSubmitting(true);
    const res  = await fetch('/api/sessions', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ contentId: item.id, coupleId: c.coupleId, userId: c.userId, answer: ans, contentType: item.type }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.sessionId) setSessionId(data.sessionId);
    setYourAnswer(ans);
    if (data.bothAnswered) { await fetchSession(item.id); } else { setCardState('waiting'); }
  }

  function next() { if (index < items.length - 1) setIndex(i => i + 1); }
  function prev() { if (index > 0) setIndex(i => i - 1); }

  const current  = items[index];
  const isWYR    = !!current?.metadata?.option_a;
  const isQuiz   = Array.isArray(current?.metadata?.options);
  const hasSteps = Array.isArray(current?.metadata?.steps);

  function renderAnswerSection() {
    if (cardState === 'revealed') {
      return (
        <div className="space-y-3 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 your-answer-card">
              <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-2">{couple.current?.userName}</p>
              <p className="text-gray-700 text-xs leading-relaxed">{typeof yourAnswer === 'object' ? JSON.stringify(yourAnswer) : String(yourAnswer ?? '')}</p>
            </div>
            <div className="rounded-2xl p-4 partner-answer-card">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">{partnerName}</p>
              <p className="text-gray-700 text-xs leading-relaxed">{typeof partnerAns === 'object' ? JSON.stringify(partnerAns) : String(partnerAns ?? '')}</p>
            </div>
          </div>
          <button type="button" onClick={() => router.push(`/discuss/${sessionId}`)} className="pink-button w-full">
            Discuss with {partnerName}
          </button>
        </div>
      );
    }

    if (cardState === 'waiting') {
      return (
        <div className="pink-card p-5 text-center space-y-3 animate-slide-up">
          <CheckIcon className="w-8 h-8 text-green-400 mx-auto" />
          <p className="text-pink-600 font-semibold text-sm">Sent to {partnerName}</p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => <span key={i} className={`w-2 h-2 rounded-full bg-pink-300 bounce-dot delay-${i}`} />)}
          </div>
          <p className="text-pink-400 text-xs">{partnerName} will see the topic but not your answer until they respond</p>
        </div>
      );
    }

    if (isWYR) {
      return (
        <div className="space-y-3">
          <p className="text-xs font-bold text-pink-400 uppercase tracking-widest text-center">Pick one</p>
          <div className="grid grid-cols-2 gap-3">
            {(['option_a', 'option_b'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { setPicked(opt); submitAnswer({ option: opt }); }}
                disabled={submitting}
                className={`p-4 rounded-2xl text-sm font-semibold text-center option-btn leading-snug ${picked === opt ? 'option-picked' : 'option-default'}`}
              >
                {String(current.metadata[opt] ?? '')}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (isQuiz) {
      return (
        <div className="space-y-2">
          <p className="text-xs font-bold text-pink-400 uppercase tracking-widest text-center mb-3">Your answer</p>
          {(current.metadata.options as string[]).map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setPicked(String(i)); submitAnswer({ selected: i, text: opt }); }}
              disabled={submitting}
              className={`w-full p-3 rounded-2xl text-sm font-semibold text-left option-btn ${picked === String(i) ? 'option-picked' : 'option-default'}`}
            >
              {opt}
            </button>
          ))}
          {typeof current.metadata.instructions === 'string' && (
            <p className="text-xs text-gray-400 text-center pt-1 italic">{current.metadata.instructions}</p>
          )}
        </div>
      );
    }

    // Text answer (couple_question, insight_prompt, etc.)
    return (
      <div className="space-y-3">
        <textarea
          rows={4}
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Write your answer here…"
          className="w-full pink-card p-4 text-gray-700 text-sm leading-relaxed placeholder-pink-200 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          type="button"
          onClick={() => submitAnswer({ text: answer })}
          disabled={!answer.trim() || submitting}
          className="pink-button w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <SendIcon className="w-4 h-4" />
          {submitting ? 'Sending…' : `Send to ${partnerName}`}
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col play-bg pb-24">
      <div className="flex items-center px-4 pt-10 pb-4 max-w-sm mx-auto w-full">
        <button type="button" onClick={() => router.push('/home')} aria-label="Go back" className="w-8 h-8 flex items-center justify-center rounded-full back-btn-glass mr-3">
          <BackIcon className="w-5 h-5 text-pink-400" />
        </button>
        <h1 className="text-pink-600 font-bold text-base flex-1">{LABELS[type] ?? type}</h1>
        {!loading && items.length > 0 && <span className="text-pink-300 text-sm">{index + 1} / {items.length}</span>}
      </div>

      <div className="flex-1 px-4 pb-6 max-w-sm mx-auto w-full space-y-4">
        {loading ? (
          <p className="text-pink-300 text-center animate-pulse mt-12">Loading…</p>
        ) : items.length === 0 ? (
          <div className="text-center space-y-3 mt-12">
            <p className="text-pink-500 font-semibold">Nothing here yet</p>
            <p className="text-pink-300 text-sm">More content coming soon!</p>
          </div>
        ) : (
          <>
            {/* Badges */}
            <div className="flex gap-2 justify-center flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold tone-${current.tone}`}>{current.tone}</span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-pink-100 text-pink-400">{current.category.replace(/_/g, ' ')}</span>
            </div>

            {/* Card */}
            <div className="rounded-3xl p-6 play-card">
              <p className="text-gray-700 text-lg font-medium leading-snug text-center">{current.text}</p>

              {hasSteps && (
                <div className="mt-4 space-y-3">
                  {(current.metadata.steps as string[]).map((step, i) => (
                    <div key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white step-number">{i + 1}</span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                  {typeof current.metadata.duration_minutes === 'number' && (
                    <p className="text-xs text-pink-300 font-semibold pt-1 flex items-center gap-1"><TimerIcon className="w-3 h-3" />{current.metadata.duration_minutes} minutes</p>
                  )}
                </div>
              )}
            </div>

            {/* Answer section */}
            {renderAnswerSection()}

            {/* Navigation */}
            {cardState === 'idle' && (
              <div className="flex gap-4">
                <button type="button" onClick={prev} disabled={index === 0} className="flex-1 py-3 rounded-2xl font-semibold transition-opacity disabled:opacity-30 nav-prev-btn">← Prev</button>
                <button type="button" onClick={next} disabled={index === items.length - 1} className="flex-1 py-3 rounded-2xl font-bold transition-opacity disabled:opacity-30 nav-next-btn">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
