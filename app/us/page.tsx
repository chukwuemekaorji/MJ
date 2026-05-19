'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple, clearCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import { EditIcon } from '@/components/icons';

type UserInfo = { id: string; display_name: string; avatar_color: string; avatar_url?: string };

const AVATAR_COLORS = ['#FF4FA3','#C2185B','#FF7096','#F06292','#E91E63','#FF9FB2','#AD1457','#F48FB1'];

function breakdown(dateStr: string) {
  const from = new Date(dateStr);
  const now  = new Date();
  let y = now.getFullYear() - from.getFullYear();
  let m = now.getMonth()    - from.getMonth();
  let d = now.getDate()     - from.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const totalDays = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 86400000));
  const heartbeats = totalDays * 24 * 60 * 70;
  return { years: Math.max(0, y), months: Math.max(0, m), days: Math.max(0, d), heartbeats, totalDays };
}

function AvatarCircle({ user, overlap }: { user: UserInfo; overlap?: 'left' | 'right' }) {
  const ml = overlap === 'right' ? '-ml-4' : '';
  const zIndex = overlap === 'right' ? 'z-0' : 'z-10';
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <div className={`w-16 h-16 rounded-full border-4 border-white overflow-hidden flex-shrink-0 relative ${ml} ${zIndex}`}>
      {user.avatar_url ? (
        <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xl avatar-${user.avatar_color.replace('#', '')}`}>
          {user.display_name[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function UsPage() {
  const router    = useRouter();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [ready,        setReady]        = useState(false);
  const [me,           setMe]           = useState<UserInfo | null>(null);
  const [partner,      setPartner]      = useState<UserInfo | null>(null);
  const [editing,      setEditing]      = useState(false);
  const [pickedColor,  setPickedColor]  = useState('');
  const [avatarUrl,    setAvatarUrl]    = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [anniversary, setAnniversary] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [newDate,     setNewDate]     = useState('');
  const [savingDate,  setSavingDate]  = useState(false);

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }
    setReady(true);
    loadData(stored.coupleId, stored.userId);
  }, [router]);

  async function loadData(coupleId: string, myId: string) {
    const meRes  = await fetch(`/api/users/${myId}`);
    const meData = await meRes.json();
    if (meData.user) {
      setMe(meData.user);
      setPickedColor(meData.user.avatar_color ?? '#FF4FA3');
      setAvatarUrl(meData.user.avatar_url ?? '');
    }
    const coupleRes  = await fetch(`/api/couple?code=MJ2025`);
    const coupleData = await coupleRes.json();
    if (coupleData.users) {
      const partnerUser = coupleData.users.find((u: { id: string }) => u.id !== myId);
      if (partnerUser) {
        const pData = await fetch(`/api/users/${partnerUser.id}`).then(r => r.json());
        if (pData.user) setPartner(pData.user);
      }
    }
    const annData = await fetch(`/api/couple/anniversary?coupleId=${coupleId}`).then(r => r.json());
    if (annData.date) { setAnniversary(annData.date); setNewDate(annData.date); }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await fetch('/api/upload', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, folder: 'avatars' }),
    });
    const { signedUrl, path } = await res.json();
    await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'content-type': file.type } });
    const readRes = await fetch(`/api/upload?path=${encodeURIComponent(path)}`);
    const { url } = await readRes.json();
    setAvatarUrl(url ?? '');
    setUploading(false);
  }

  async function saveAvatar() {
    const stored = getStoredCouple();
    if (!stored || !me) return;
    setSaving(true);
    await fetch(`/api/users/${stored.userId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ avatar_color: pickedColor, avatar_url: avatarUrl || null }),
    });
    setMe(prev => prev ? { ...prev, avatar_color: pickedColor, avatar_url: avatarUrl || undefined } : prev);
    setSaving(false);
    setEditing(false);
  }

  async function saveAnniversary() {
    const stored = getStoredCouple();
    if (!stored || !newDate) return;
    setSavingDate(true);
    await fetch('/api/couple/anniversary', {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ coupleId: stored.coupleId, date: newDate }),
    });
    setAnniversary(newDate);
    setSavingDate(false);
    setEditingDate(false);
  }

  const stats = anniversary ? breakdown(anniversary) : null;
  const sinceLabel = anniversary
    ? new Date(anniversary).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  if (!ready) return null;

  return (
    <main className="min-h-screen pb-24 home-bg">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-4xl font-bold home-title">Us</h1>
        <button type="button" onClick={() => setEditing(e => !e)} className="flex items-center gap-1 text-pink-500 text-sm font-semibold">
          <EditIcon className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className="px-4 max-w-sm mx-auto space-y-4">

        {/* ── Love card ── */}
        <div className="love-card p-6 space-y-5">

          {/* Overlapping avatars */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center">
              {me      && <AvatarCircle user={me}      overlap="left"  />}
              {partner && <AvatarCircle user={partner} overlap="right" />}
            </div>
            {sinceLabel && (
              <p className="text-white/60 text-sm font-medium">Together since {sinceLabel}</p>
            )}
            {!sinceLabel && (
              <button type="button" onClick={() => setEditingDate(true)} className="text-pink-400 text-sm underline">
                Set your anniversary →
              </button>
            )}
          </div>

          {/* Years / Months / Days */}
          {stats && (
            <div className="love-card-inner p-4">
              <div className="grid grid-cols-3 divide-x divide-white/10">
                {[
                  { val: stats.years,  lbl: stats.years  === 1 ? 'Year'  : 'Years'  },
                  { val: stats.months, lbl: stats.months === 1 ? 'Month' : 'Months' },
                  { val: stats.days,   lbl: stats.days   === 1 ? 'Day'   : 'Days'   },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="flex flex-col items-center py-1">
                    <span className="love-stat-val">{val}</span>
                    <span className="love-stat-lbl">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heartbeats */}
          {stats && stats.heartbeats > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-heartbeat">🤍</span>
              <p className="text-white/70 text-sm leading-snug">
                Still in sync after{' '}
                <span className="text-white font-bold">{stats.heartbeats.toLocaleString()}</span>
                {' '}heartbeats.
              </p>
            </div>
          )}

          {/* MJ branding */}
          <div className="flex justify-end">
            <span className="text-white/30 text-sm font-bold tracking-widest serif-heading">MJ</span>
          </div>
        </div>

        {/* ── Edit avatar (own only) ── */}
        {editing && me && (
          <div className="pink-card p-5 space-y-4 animate-slide-up">
            <p className="text-sm font-bold text-pink-600">Your avatar</p>
            <div>
              <p className="text-xs text-gray-500 mb-2">Pick a colour</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c} type="button" aria-label={`Pick colour ${c}`}
                    onClick={() => setPickedColor(c)}
                    className={`w-9 h-9 rounded-full border-2 transition-transform active:scale-90 swatch-${c.replace('#', '')} ${pickedColor === c ? 'border-gray-800 scale-[1.15]' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Or upload a photo</p>
              <input ref={fileRef} type="file" accept="image/*" aria-label="Upload profile photo" className="hidden" onChange={handlePhotoUpload} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full py-3 rounded-xl bg-pink-50 text-pink-500 text-sm font-semibold border border-pink-200 active:scale-95 transition-transform">
                {uploading ? 'Uploading…' : avatarUrl ? '✓ Photo uploaded — tap to change' : '📷 Choose from camera or gallery'}
              </button>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl text-pink-400 text-sm font-medium bg-pink-50">Cancel</button>
              <button type="button" onClick={saveAvatar} disabled={saving} className="flex-1 py-2 rounded-xl text-white text-sm font-bold pink-button disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* ── Anniversary ── */}
        <div className="pink-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">Anniversary</p>
              <p className="text-pink-400 text-xs mt-0.5">
                {sinceLabel ?? 'Not set yet'}
              </p>
            </div>
            <button type="button" onClick={() => setEditingDate(e => !e)}
              className="text-xs text-pink-500 font-semibold underline">
              {editingDate ? 'Cancel' : sinceLabel ? 'Change' : 'Set date'}
            </button>
          </div>
          {editingDate && (
            <div className="space-y-3 animate-slide-up">
              <input type="date" value={newDate} max={new Date().toISOString().slice(0, 10)}
                onChange={e => setNewDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl bg-pink-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
              <button type="button" onClick={saveAnniversary} disabled={!newDate || savingDate}
                className="w-full py-2 rounded-xl text-white text-sm font-bold pink-button disabled:opacity-50">
                {savingDate ? 'Saving…' : 'Save anniversary'}
              </button>
            </div>
          )}
        </div>

        {/* ── Sign out ── */}
        <button type="button" onClick={() => { clearCouple(); router.replace('/'); }}
          className="w-full py-3 rounded-2xl text-pink-400 text-sm font-medium bg-pink-50">
          Sign out of this device
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
