'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { SendIcon, FlameIcon, ChatIcon, HeartFillIcon } from '@/components/icons';

type DailyState = 'loading' | 'unanswered' | 'waiting' | 'revealed';
type Question   = { id: string; text: string };
type Message    = { id: string; sender_id: string; content: string; created_at: string };

export default function DailyPage() {
  const router  = useRouter();
  const couple  = useRef(getStoredCouple());

  const [question,        setQuestion]        = useState<Question | null>(null);
  const [state,           setState]           = useState<DailyState>('loading');
  const [answer,          setAnswer]          = useState('');
  const [yourAnswer,      setYourAnswer]      = useState<string | null>(null);
  const [partnerAnswer,   setPartnerAnswer]   = useState<string | null>(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [newMessage,      setNewMessage]      = useState('');
  const [chatOpen,        setChatOpen]        = useState(false);
  const [streak,          setStreak]          = useState(0);
  const [streakToday,     setStreakToday]     = useState(false);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const partnerName = couple.current?.userName === 'Maryjane' ? 'Chukwuemeka' : 'Maryjane';

  useEffect(() => {
    if (!couple.current) { router.replace('/'); return; }
    fetchState();
  }, [router]);

  useEffect(() => {
    if (state === 'waiting') {
      pollRef.current = setInterval(fetchState, 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [state]);

  useEffect(() => {
    if (chatOpen) {
      fetchMessages();
      const iv = setInterval(fetchMessages, 3000);
      return () => clearInterval(iv);
    }
  }, [chatOpen]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchState() {
    const c = couple.current;
    if (!c) return;
    const res  = await fetch(`/api/daily?coupleId=${c.coupleId}&userId=${c.userId}`);
    const data = await res.json();
    if (!data.question) return;
    setQuestion(data.question);
    setYourAnswer(data.yourAnswer);
    setStreak(data.streak ?? 0);
    setStreakToday(data.streakToday ?? false);
    if (data.state === 'revealed') {
      setPartnerAnswer(data.partnerAnswer);
      setState('revealed');
    } else if (data.yourAnswer) {
      setState('waiting');
    } else {
      setState('unanswered');
    }
  }

  async function submitAnswer() {
    const c = couple.current;
    if (!answer.trim() || !c || !question || submitting) return;
    setSubmitting(true);
    await fetch('/api/daily', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ answer, userId: c.userId, questionId: question.id, coupleId: c.coupleId }),
    });
    setYourAnswer(answer);
    setState('waiting');
    setSubmitting(false);
    fetchState();
  }

  async function fetchMessages() {
    const c = couple.current;
    if (!c) return;
    const res  = await fetch(`/api/daily/chat?coupleId=${c.coupleId}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }

  async function sendMessage() {
    const c = couple.current;
    if (!newMessage.trim() || !c) return;
    const msg = newMessage;
    setNewMessage('');
    await fetch('/api/daily/chat', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ coupleId: c.coupleId, senderId: c.userId, content: msg }),
    });
    fetchMessages();
  }

  const headerSubtitle: Record<DailyState, string> = {
    unanswered: "Answer privately — your partner won't see until they answer too",
    waiting:    `Waiting for ${partnerName} to answer…`,
    revealed:   'You both answered — read and discuss!',
    loading:    'Loading today\'s question…',
  };

  return (
    <main className="min-h-screen flex flex-col daily-page-bg">

      {/* Top bar */}
      <div className={`px-4 pt-10 pb-6 text-white animate-fade-up daily-header-${state}`}>
        <button type="button" onClick={() => router.push('/home')} className="text-white/80 text-sm mb-4 flex items-center gap-1">
          ← Home
        </button>
        <h1 className="text-2xl font-bold serif-heading">Daily Question</h1>
        <p className="text-white/75 text-sm mt-1">{headerSubtitle[state]}</p>
      </div>

      <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full space-y-5">

        {/* Loading skeleton */}
        {state === 'loading' && (
          <div className="pink-card p-6 space-y-3 animate-pulse">
            <div className="h-5 bg-pink-100 rounded w-full" />
            <div className="h-5 bg-pink-100 rounded w-4/5" />
            <div className="h-5 bg-pink-50 rounded w-3/5" />
          </div>
        )}

        {/* Question card */}
        {question && (
          <div className="pink-card p-6 animate-fade-up">
            <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-3">Today&apos;s question</p>
            <p className="text-gray-800 text-lg font-semibold leading-snug">{question.text}</p>
          </div>
        )}

        {/* Unanswered: answer input */}
        {state === 'unanswered' && (
          <div className="space-y-3 animate-slide-up">
            <textarea
              rows={5}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Write your honest answer here… only you can see this until your partner answers too."
              className="w-full pink-card p-4 text-gray-700 text-sm leading-relaxed placeholder-pink-200 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <button
              type="button"
              onClick={submitAnswer}
              disabled={!answer.trim() || submitting}
              className="pink-button w-full disabled:opacity-50"
            >
              <SendIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />{submitting ? 'Saving…' : 'Submit my answer'}
            </button>
          </div>
        )}

        {/* Waiting */}
        {state === 'waiting' && (
          <div className="space-y-4 animate-slide-up">
            <div className="pink-card p-5">
              <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-2">Your answer</p>
              <p className="text-gray-700 text-sm leading-relaxed">{yourAnswer}</p>
            </div>
            <div className="pink-card p-5 text-center space-y-3">
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map(i => (
                  <span key={i} className={`w-3 h-3 rounded-full bg-pink-300 bounce-dot delay-${i}`} />
                ))}
              </div>
              <p className="text-pink-600 font-semibold">Waiting for {partnerName}…</p>
              <p className="text-pink-400 text-xs">They&apos;ll see your answer once they submit theirs</p>
            </div>
          </div>
        )}

        {/* Revealed */}
        {state === 'revealed' && (
          <div className="space-y-4 animate-slide-up">

            {/* Streak banner */}
            {streak > 0 && (
              <div className={`rounded-2xl p-4 text-center ${streakToday ? 'bg-pink-600' : 'bg-orange-50'}`}>
                <p className={`text-lg font-bold ${streakToday ? 'text-white' : 'text-orange-600'}`}>
                  <FlameIcon className="w-5 h-5 inline mr-1.5 -mt-0.5" />{streak} day streak{streakToday ? '!' : ' — keep it going tomorrow'}
                </p>
                {streakToday && (
                  <p className="text-white/80 text-xs mt-0.5 flex items-center justify-center gap-1">You both answered today <HeartFillIcon className="w-3 h-3" /></p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 your-answer-card">
                <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-2">{couple.current?.userName}</p>
                <p className="text-gray-700 text-xs leading-relaxed">{yourAnswer}</p>
              </div>
              <div className="rounded-2xl p-4 partner-answer-card">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">{partnerName}</p>
                <p className="text-gray-700 text-xs leading-relaxed">{partnerAnswer}</p>
              </div>
            </div>

            <button type="button" onClick={() => setChatOpen(o => !o)} className="pink-button w-full">
              {chatOpen ? 'Close chat' : <><ChatIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />Discuss with {partnerName}</>}
            </button>

            {chatOpen && (
              <div className="pink-card overflow-hidden animate-slide-up">
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-pink-300 text-sm text-center mt-8 flex items-center justify-center gap-1">Start the conversation <HeartFillIcon className="w-3.5 h-3.5" /></p>
                  )}
                  {messages.map(msg => {
                    const isMe = msg.sender_id === couple.current?.userId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2 text-sm leading-relaxed ${isMe ? 'msg-mine' : 'msg-theirs'}`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEnd} />
                </div>
                <div className="border-t border-pink-100 p-3 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Say something…"
                    className="flex-1 text-sm px-3 py-2 rounded-xl bg-pink-50 text-gray-700 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 send-btn"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
