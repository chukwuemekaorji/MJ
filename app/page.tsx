'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getStoredCouple, storeCouple } from '@/lib/coupleStore';

type User = { id: string; displayName: string };
type Step = 'code' | 'identity';

function HeartSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.456 3.068-5.191 5.5-5.191 1.998 0 4.035.987 5.5 3 1.465-2.013 3.502-3 5.5-3 2.432 0 5.5 1.735 5.5 5.191 0 4.105-5.37 8.863-11 14.402z" />
    </svg>
  );
}

function SparkSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [coupleId, setCoupleId] = useState('');

  useEffect(() => {
    const stored = getStoredCouple();
    if (stored) router.replace('/home');
    else setChecking(false);
  }, [router]);

  async function handleCode() {
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
    setCoupleId(data.coupleId);
    setUsers(data.users ?? []);
    setLoading(false);
    setStep('identity');
  }

  function handleIdentity(user: User) {
    storeCouple({ coupleId, code: code.toUpperCase(), userId: user.id, userName: user.displayName });
    router.push('/home');
  }

  if (checking) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden landing-bg">

      {/* Floating decorations */}
      <HeartSvg className="absolute top-16 left-8 w-8 h-8 text-white opacity-20 animate-float" />
      <HeartSvg className="absolute top-32 right-10 w-5 h-5 text-white opacity-15 animate-float-alt" />
      <SparkSvg className="absolute top-24 left-1/3 w-4 h-4 text-white opacity-20 animate-shimmer" />
      <HeartSvg className="absolute bottom-40 left-12 w-6 h-6 text-white opacity-15 animate-float-alt" />
      <HeartSvg className="absolute bottom-56 right-8 w-10 h-10 text-white opacity-10 animate-float" />
      <SparkSvg className="absolute bottom-32 right-1/3 w-5 h-5 text-white opacity-20 animate-shimmer" />
      <SparkSvg className="absolute top-1/2 left-6 w-3 h-3 text-white opacity-25 animate-shimmer" />

      {step === 'code' && (
        <div className="w-full max-w-sm text-center space-y-8 animate-fade-up">

          {/* Couple photo */}
          <div className="relative mx-auto w-36 h-36 animate-float">
            <div className="absolute inset-0 rounded-full animate-pulse-glow photo-glow" />
            <div className="relative w-36 h-36 rounded-full overflow-hidden photo-frame">
              <Image src="/couple1.png" alt="Maryjane & Chukwuemeka" fill style={{ objectFit: 'cover' }} priority />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white flex items-center justify-center animate-heartbeat heart-badge-shadow">
              <HeartSvg className="w-5 h-5 text-pink-500" />
            </div>
          </div>

          {/* Branding */}
          <div className="space-y-2">
            <h1 className="text-7xl font-bold text-white mj-logo">MJ</h1>
            <p className="text-white/90 font-semibold text-xl tracking-wide">Maryjane &amp; Chukwuemeka</p>
            <p className="text-white/70 text-sm">Together, every single day 💕</p>
          </div>

          {/* Code input */}
          <div className="space-y-4">
            <div className="glass-card p-1">
              <input
                type="text"
                placeholder="COUPLE CODE"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleCode()}
                maxLength={10}
                className="w-full text-center text-2xl font-bold tracking-[0.3em] px-4 py-4 rounded-2xl bg-transparent text-white placeholder-white/40 focus:outline-none"
              />
            </div>
            {error && <p className="text-white/90 text-sm font-medium bg-white/10 rounded-xl px-4 py-2">{error}</p>}
            <button
              type="button"
              onClick={handleCode}
              disabled={loading || !code.trim()}
              className="pink-button w-full disabled:opacity-50 enter-btn"
            >
              {loading ? 'Connecting…' : 'Enter →'}
            </button>
          </div>

          <p className="text-white/50 text-xs">Ask your partner for the couple code 💌</p>
        </div>
      )}

      {step === 'identity' && (
        <div className="w-full max-w-sm text-center space-y-8 animate-fade-up">
          <div className="space-y-2">
            <HeartSvg className="w-10 h-10 text-white mx-auto animate-heartbeat" />
            <h2 className="text-3xl font-bold text-white serif-heading">Which one are you?</h2>
            <p className="text-white/70 text-sm">Tap your name to continue</p>
          </div>
          <div className="space-y-4">
            {users.map((user, i) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleIdentity(user)}
                className={`w-full py-5 rounded-3xl font-bold text-lg transition-transform active:scale-95 flex items-center justify-center gap-3 ${i === 0 ? 'identity-btn-primary' : 'identity-btn-secondary'}`}
              >
                <HeartSvg className="w-5 h-5" />
                {user.displayName}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
