'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { CheckCircleIcon, CameraIcon, ChatIcon } from '@/components/icons';

type Item = {
  id: string;
  text: string;
  type: string;
  category: string;
  tone: string;
  difficulty: number;
  metadata: Record<string, unknown>;
};

type Answers = Record<string, { type: 'text' | 'image'; value: string }>;

function ActivityContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const packName     = searchParams.get('packName') ?? '';
  const packType     = searchParams.get('type') ?? '';
  const couple       = useRef(getStoredCouple());

  const [items,       setItems]       = useState<Item[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [index,       setIndex]       = useState(0);
  const [answers,     setAnswers]     = useState<Answers>({});
  const [text,        setText]        = useState('');
  const [imgPath,     setImgPath]     = useState('');
  const [imgPreview,  setImgPreview]  = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [phase,       setPhase]       = useState<'answering' | 'waiting' | 'revealed'>('answering');
  const [revealed,    setRevealed]    = useState<{ myAnswers: Answers; partnerAnswers: Answers } | null>(null);
  const [sessionId,   setSessionId]   = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const c           = couple.current;
  const partnerName = c?.userName === 'Maryjane' ? 'Chukwuemeka' : 'Maryjane';
  const current     = items[index];
  const answerType  = (current?.metadata?.answer_type as string) ?? 'text';
  const isQuiz      = Array.isArray(current?.metadata?.options);
  const isWYR       = !!current?.metadata?.option_a;
  const total       = items.length;

  useEffect(() => {
    if (!c) { router.replace('/'); return; }
    // Load items
    fetch(`/api/content?packName=${encodeURIComponent(packName)}&type=${packType}&coupleId=${c.coupleId}&limit=100`)
      .then(r => r.json())
      .then(d => { setItems(d.content ?? []); setItemsLoaded(true); });
    // Load session state
    loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'waiting') {
      pollRef.current = setInterval(loadSession, 6000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function loadSession() {
    if (!c) return;
    const res  = await fetch(`/api/activity?coupleId=${c.coupleId}&userId=${c.userId}&packName=${encodeURIComponent(packName)}&packType=${packType}`);
    const data = await res.json();
    setSessionId(data.sessionId);

    if (data.myDone && !data.completed) {
      setPhase('waiting');
      // Restore progress from saved answers
      if (data.myAnswers && Object.keys(data.myAnswers).length > 0) {
        setAnswers(data.myAnswers);
      }
    }
    if (data.completed) {
      setPhase('revealed');
      setRevealed({ myAnswers: data.myAnswers ?? {}, partnerAnswers: data.partnerAnswers ?? {} });
    }
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !c) return;
    setUploading(true);
    const preview = URL.createObjectURL(file);
    setImgPreview(preview);

    const res  = await fetch('/api/upload', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ fileName: file.name, mimeType: file.type, folder: 'answers' }),
    });
    const { signedUrl, path } = await res.json();

    await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'content-type': file.type } });

    setImgPath(path);
    setUploading(false);
  }

  function currentAnswer(): { type: 'text' | 'image'; value: string } | null {
    if (answerType === 'image') {
      return imgPath ? { type: 'image', value: imgPath } : null;
    }
    if (isWYR || isQuiz) {
      return answers[current?.id] ?? null;
    }
    return text.trim() ? { type: 'text', value: text.trim() } : null;
  }

  async function submitAnswer() {
    if (!current || !c) return;
    const ans = currentAnswer();
    if (!ans) return;

    const newAnswers = { ...answers, [current.id]: ans };
    setAnswers(newAnswers);

    if (index < total - 1) {
      setIndex(i => i + 1);
      setText('');
      setImgPath('');
      setImgPreview('');
    } else {
      // All done — save to DB
      setSubmitting(true);
      await fetch('/api/activity', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ coupleId: c.coupleId, userId: c.userId, packName, packType, answers: newAnswers, done: true }),
      });
      setSubmitting(false);
      setPhase('waiting');
      loadSession();
    }
  }

  async function finishActivity(finalAnswers: Answers) {
    if (!c) return;
    setSubmitting(true);
    await fetch('/api/activity', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ coupleId: c.coupleId, userId: c.userId, packName, packType, answers: finalAnswers, done: true }),
    });
    setSubmitting(false);
    setPhase('waiting');
    loadSession();
  }

  function pickWYR(_opt: string, val: string) {
    if (!current) return;
    const newAnswers = { ...answers, [current.id]: { type: 'text' as const, value: val } };
    setAnswers(newAnswers);
    if (index < total - 1) {
      setIndex(i => i + 1);
    } else {
      finishActivity(newAnswers);
    }
  }

  function pickQuiz(opt: string) {
    if (!current) return;
    const newAnswers = { ...answers, [current.id]: { type: 'text' as const, value: opt } };
    setAnswers(newAnswers);
    if (index < total - 1) {
      setIndex(i => i + 1);
    } else {
      finishActivity(newAnswers);
    }
  }

  // ── Waiting state ──
  if (phase === 'waiting') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 home-bg">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="pink-card p-8 space-y-4">
            <CheckCircleIcon className="w-14 h-14 text-green-400 mx-auto" />
            <h2 className="text-xl font-bold text-pink-600">You&apos;re done!</h2>
            <p className="text-gray-500 text-sm">
              Waiting for <strong>{partnerName}</strong> to complete their answers.<br />
              They won&apos;t see yours until they finish.
            </p>
            <div className="flex justify-center gap-1 pt-2">
              {[0, 1, 2].map(i => (
                <span key={i} className={`w-2 h-2 rounded-full bg-pink-300 bounce-dot delay-${i}`} />
              ))}
            </div>
          </div>
          <button type="button" onClick={() => router.push('/explore')} className="text-pink-400 text-sm underline">
            ← Back to Explore
          </button>
        </div>
      </main>
    );
  }

  // ── Revealed state ──
  if (phase === 'revealed' && revealed && itemsLoaded) {
    return (
      <main className="min-h-screen pb-8 home-bg">
        <div className="px-4 pt-10 pb-4 flex items-center gap-3">
          <button type="button" onClick={() => router.push('/explore')} className="text-pink-400 text-xl">←</button>
          <h1 className="font-bold text-pink-600 text-lg flex-1">{packName}</h1>
          <span className="text-xs bg-green-100 text-green-600 font-bold px-3 py-1 rounded-full">Both done!</span>
        </div>

        <div className="px-4 max-w-sm mx-auto space-y-4">
          {items.map((item, i) => {
            const myAns      = revealed.myAnswers[item.id];
            const partnerAns = revealed.partnerAnswers[item.id];
            return (
              <div key={item.id} className="pink-card p-5 space-y-3">
                <p className="text-xs font-bold text-pink-400 uppercase tracking-widest">Q{i + 1}</p>
                <p className="text-gray-800 font-semibold text-sm leading-snug">{item.text}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-3 your-answer-card">
                    <p className="text-xs font-bold text-pink-500 mb-1">{c?.userName}</p>
                    {myAns?.type === 'image' ? (
                      <ImageAnswer path={myAns.value} />
                    ) : (
                      <p className="text-gray-700 text-xs leading-relaxed">{myAns?.value ?? '—'}</p>
                    )}
                  </div>
                  <div className="rounded-xl p-3 partner-answer-card">
                    <p className="text-xs font-bold text-blue-400 mb-1">{partnerName}</p>
                    {partnerAns?.type === 'image' ? (
                      <ImageAnswer path={partnerAns.value} />
                    ) : (
                      <p className="text-gray-700 text-xs leading-relaxed">{partnerAns?.value ?? '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => sessionId && router.push(`/discuss/${sessionId}`)}
            className="pink-button w-full"
          >
            <ChatIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />Discuss with {partnerName}
          </button>
        </div>
      </main>
    );
  }

  // ── Answering state ──
  if (!current) return <main className="min-h-screen flex items-center justify-center home-bg"><p className="text-pink-400 animate-pulse">Loading…</p></main>;

  const answered = !!answers[current.id] || (answerType === 'image' ? !!imgPath : !!text.trim());

  return (
    <main className="min-h-screen flex flex-col home-bg">
      {/* Header */}
      <div className="px-4 pt-10 pb-3 flex items-center gap-3">
        <button type="button" onClick={() => router.push('/explore')} className="text-pink-400 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full back-btn-glass">←</button>
        <div className="flex-1">
          <p className="font-bold text-pink-600 text-sm">{packName}</p>
        </div>
        <span className="text-pink-400 text-sm">{index + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4">
        <div className="h-1.5 bg-pink-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 progress-fill"
            style={{ '--progress-w': `${((index + 1) / total) * 100}%` } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 max-w-sm mx-auto w-full space-y-4">
        {/* Question card */}
        <div className="pink-card p-6">
          <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-3">Question {index + 1}</p>
          <p className="text-gray-800 font-semibold text-lg leading-snug">{current.text}</p>
        </div>

        {/* Answer section */}
        {answerType === 'image' ? (
          <div className="space-y-3">
            <input ref={fileRef} type="file" accept="image/*" aria-label="Upload a photo as your answer" className="hidden" onChange={handleImagePick} />
            {imgPreview ? (
              <div className="pink-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPreview} alt="Your upload" className="w-full max-h-64 object-cover" />
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full pink-card p-8 flex flex-col items-center gap-3 text-pink-400">
                <CameraIcon className="w-10 h-10 mx-auto" />
                <p className="font-semibold text-sm">{uploading ? 'Uploading…' : 'Tap to take or choose a photo'}</p>
              </button>
            )}
            {imgPreview && (
              <button type="button" onClick={() => { setImgPath(''); setImgPreview(''); }}
                className="text-pink-400 text-xs underline text-center w-full">
                Choose a different photo
              </button>
            )}
          </div>
        ) : isWYR ? (
          <div className="grid grid-cols-2 gap-3">
            {(['option_a', 'option_b'] as const).map(opt => (
              <button key={opt} type="button"
                onClick={() => pickWYR(opt, String(current.metadata[opt] ?? ''))}
                className={`p-4 rounded-2xl text-sm font-semibold text-center option-btn leading-snug ${answers[current.id]?.value === String(current.metadata[opt]) ? 'option-picked' : 'option-default'}`}>
                {String(current.metadata[opt] ?? '')}
              </button>
            ))}
          </div>
        ) : isQuiz ? (
          <div className="space-y-2">
            {(current.metadata.options as string[]).map((opt, i) => (
              <button key={i} type="button" onClick={() => pickQuiz(opt)}
                className={`w-full p-3 rounded-2xl text-sm font-semibold text-left option-btn ${answers[current.id]?.value === opt ? 'option-picked' : 'option-default'}`}>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            rows={5}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your answer here… your partner won't see it until they answer too."
            className="w-full pink-card p-4 text-gray-700 text-sm leading-relaxed placeholder-pink-200 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        )}

        {/* Next / Submit button (not shown for auto-advance types) */}
        {!isWYR && !isQuiz && (
          <button type="button" onClick={submitAnswer}
            disabled={!answered || submitting || uploading}
            className="pink-button w-full disabled:opacity-50">
            {submitting ? 'Saving…' : index < total - 1 ? 'Next →' : 'Finish activity'}
          </button>
        )}

        <p className="text-pink-300 text-xs text-center">
          Your answers are private until {partnerName} completes the activity
        </p>
      </div>
    </main>
  );
}

function ImageAnswer({ path }: { path: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    fetch(`/api/upload?path=${encodeURIComponent(path)}`)
      .then(r => r.json())
      .then(d => setUrl(d.url ?? ''));
  }, [path]);
  if (!url) return <p className="text-xs text-gray-400 italic">Loading image…</p>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Answer" className="w-full rounded-lg object-cover max-h-32" />;
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center home-bg"><p className="text-pink-400 animate-pulse">Loading…</p></main>}>
      <ActivityContent />
    </Suspense>
  );
}
