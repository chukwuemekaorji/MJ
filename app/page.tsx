'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getStoredCouple, storeCouple } from '@/lib/coupleStore';
import { HeartFillIcon, StarFillIcon, LockIcon } from '@/components/icons';

type User = { id: string; displayName: string };
type Step = 'code' | 'identity' | 'pin';

export default function LandingPage() {
  const router = useRouter();
  const [step,      setStep]      = useState<Step>('code');
  const [code,      setCode]      = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [checking,  setChecking]  = useState(true);
  const [users,     setUsers]     = useState<User[]>([]);
  const [coupleId,  setCoupleId]  = useState('');
  const [selUser,   setSelUser]   = useState<User | null>(null);
  const [hasPin,    setHasPin]    = useState(false);
  const [pin,       setPin]       = useState('');
  const [pinError,  setPinError]  = useState('');
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = getStoredCouple();
    if (stored) router.replace('/home');
    else setChecking(false);
  }, [router]);

  async function handleCode() {
    if (!code.trim()) return;
    setLoading(true); setError('');
    const res  = await fetch(`/api/couple?code=${encodeURIComponent(code.toUpperCase())}`);
    const data = await res.json();
    if (!res.ok) { setError('Code not found. Check with your partner.'); setLoading(false); return; }
    setCoupleId(data.coupleId);
    setUsers(data.users ?? []);
    setLoading(false);
    setStep('identity');
  }

  async function handleIdentity(user: User) {
    setSelUser(user);
    const res  = await fetch(`/api/couple/pin?userId=${user.id}`);
    const data = await res.json();
    setHasPin(data.hasPin);
    setStep('pin');
    setTimeout(() => pinInputRef.current?.focus(), 100);
  }

  async function handlePin() {
    if (pin.length < 4 || !selUser) return;
    setPinError('');
    const res  = await fetch('/api/couple/pin', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ userId: selUser.id, pin, isNew: !hasPin }),
    });
    const data = await res.json();
    if (!data.valid) { setPinError('Wrong PIN. Try again.'); setPin(''); return; }
    storeCouple({ coupleId, code: code.toUpperCase(), userId: selUser.id, userName: selUser.displayName });
    router.push('/home');
  }

  if (checking) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden landing-bg">
      <HeartFillIcon className="absolute top-16 left-8 w-8 h-8 text-white opacity-20 animate-float" />
      <HeartFillIcon className="absolute top-32 right-10 w-5 h-5 text-white opacity-15 animate-float-alt" />
      <StarFillIcon  className="absolute top-24 left-1/3 w-4 h-4 text-white opacity-20 animate-shimmer" />
      <HeartFillIcon className="absolute bottom-40 left-12 w-6 h-6 text-white opacity-15 animate-float-alt" />
      <HeartFillIcon className="absolute bottom-56 right-8 w-10 h-10 text-white opacity-10 animate-float" />
      <StarFillIcon  className="absolute bottom-32 right-1/3 w-5 h-5 text-white opacity-20 animate-shimmer" />

      {/* Step 1: Code */}
      {step === 'code' && (
        <div className="w-full max-w-sm text-center space-y-8 animate-fade-up">
          <div className="relative mx-auto w-36 h-36 animate-float">
            <div className="absolute inset-0 rounded-full animate-pulse-glow photo-glow" />
            <div className="relative w-36 h-36 rounded-full overflow-hidden photo-frame">
              <Image src="/couple1.png" alt="Maryjane & Chukwuemeka" fill style={{ objectFit: 'cover' }} priority />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white flex items-center justify-center animate-heartbeat heart-badge-shadow">
              <HeartFillIcon className="w-5 h-5 text-pink-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-7xl font-bold text-white mj-logo">MJ</h1>
            <p className="text-white/90 font-semibold text-xl tracking-wide">Maryjane &amp; Chukwuemeka</p>
            <p className="text-white/70 text-sm">Together, every single day</p>
          </div>

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
            <button type="button" onClick={handleCode} disabled={loading || !code.trim()} className="pink-button w-full disabled:opacity-50 enter-btn">
              {loading ? 'Connecting…' : 'Enter'}
            </button>
          </div>
          <p className="text-white/50 text-xs">Ask your partner for the couple code</p>
        </div>
      )}

      {/* Step 2: Identity */}
      {step === 'identity' && (
        <div className="w-full max-w-sm text-center space-y-8 animate-fade-up">
          <div className="space-y-2">
            <HeartFillIcon className="w-10 h-10 text-white mx-auto animate-heartbeat" />
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
                <HeartFillIcon className="w-5 h-5" />
                {user.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: PIN */}
      {step === 'pin' && (
        <div className="w-full max-w-sm text-center space-y-8 animate-fade-up">
          <div className="space-y-2">
            <LockIcon className="w-12 h-12 text-white mx-auto" />
            <h2 className="text-2xl font-bold text-white serif-heading">
              {hasPin ? 'Enter your PIN' : 'Set a PIN to secure your account'}
            </h2>
            <p className="text-white/70 text-sm">
              {hasPin ? `Welcome back, ${selUser?.displayName}` : 'Choose a 4-digit PIN — only you will use this'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-1">
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="• • • •"
                value={pin}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setPin(e.target.value); }}
                onKeyDown={e => e.key === 'Enter' && pin.length === 4 && handlePin()}
                maxLength={4}
                className="w-full text-center text-3xl font-bold tracking-[0.5em] px-4 py-4 rounded-2xl bg-transparent text-white placeholder-white/30 focus:outline-none"
              />
            </div>
            {pinError && <p className="text-white/90 text-sm font-medium bg-white/10 rounded-xl px-4 py-2">{pinError}</p>}
            <button
              type="button"
              onClick={handlePin}
              disabled={pin.length < 4}
              className="pink-button w-full disabled:opacity-50 enter-btn"
            >
              {hasPin ? 'Unlock' : 'Set PIN'}
            </button>
            <button type="button" onClick={() => { setStep('identity'); setPin(''); setPinError(''); }} className="text-white/50 text-sm underline">
              Back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
