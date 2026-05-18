'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple, storeCouple } from '@/lib/coupleStore';

export default function LandingPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = getStoredCouple();
    if (stored) router.replace('/home');
    else setChecking(false);
  }, [router]);

  async function handleJoin() {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    const res = await fetch(`/api/couple?code=${encodeURIComponent(code.toUpperCase())}`);
    const data = await res.json();

    if (!res.ok) {
      setError('Code not found. Check with your partner and try again.');
      setLoading(false);
      return;
    }

    storeCouple({ coupleId: data.coupleId, code: code.toUpperCase() });
    router.push('/home');
  }

  if (checking) return null;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(160deg, #FCEAF2 0%, #F8DDE8 45%, #E8A8C4 100%)',
      }}
    >
      <div className="w-full max-w-sm text-center space-y-10">

        {/* Logo */}
        <div className="space-y-3">
          <h1
            className="text-9xl font-bold"
            style={{
              fontFamily: 'Georgia, serif',
              color: '#E8A8C4',
              textShadow: '0 4px 24px rgba(232,168,196,0.5)',
            }}
          >
            MJ
          </h1>
          <p className="text-pink-600 font-semibold text-xl tracking-wide">
            Maryjane &amp; Chukwuemeka
          </p>
          <p className="text-pink-400 text-sm">Your love. Your game. ✨</p>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="COUPLE CODE"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            maxLength={10}
            className="w-full text-center text-2xl font-bold tracking-[0.3em] rounded-2xl px-4 py-5 border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-700 placeholder-pink-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)' }}
          />
          {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={loading || !code.trim()}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FF4FA3 0%, #E8A8C4 100%)',
              boxShadow: '0 4px 20px rgba(255,79,163,0.4)',
            }}
          >
            {loading ? 'Connecting…' : 'Enter →'}
          </button>
        </div>

        <p className="text-pink-300 text-xs">Ask your partner for the couple code 💌</p>
      </div>
    </main>
  );
}
