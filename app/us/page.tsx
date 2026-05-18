'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredCouple, clearCouple } from '@/lib/coupleStore';
import { BottomNav } from '@/components/BottomNav';
import { EditIcon } from '@/components/icons';

type UserInfo = { id: string; display_name: string; avatar_color: string; avatar_url?: string };

const AVATAR_COLORS = ['#FF4FA3','#C2185B','#FF7096','#F06292','#E91E63','#FF9FB2','#AD1457','#F48FB1'];

function Avatar({ user, size = 'lg', editable, onEdit }: { user: UserInfo; size?: 'sm' | 'lg'; editable?: boolean; onEdit?: () => void }) {
  const s = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-14 h-14 text-lg';
  return (
    <div className="relative inline-block">
      {/* eslint-disable @next/next/no-img-element */}
      {user.avatar_url ? (
        <img src={user.avatar_url} alt={user.display_name} className={`${s} rounded-full object-cover border-4 border-white`} />
      ) : (
        <div className={`${s} rounded-full flex items-center justify-center font-bold text-white border-4 border-white avatar-${user.avatar_color.replace('#', '')}`}>
          {user.display_name[0].toUpperCase()}
        </div>
      )}
      {editable && (
        <button type="button" onClick={onEdit} aria-label="Edit avatar" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center edit-btn-shadow">
          <EditIcon className="w-3.5 h-3.5 text-pink-500" />
        </button>
      )}
    </div>
  );
}

export default function UsPage() {
  const router = useRouter();
  const [ready,       setReady]       = useState(false);
  const [me,          setMe]          = useState<UserInfo | null>(null);
  const [partner,     setPartner]     = useState<UserInfo | null>(null);
  const [editing,     setEditing]     = useState(false);
  const [pickedColor, setPickedColor] = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [daysToget,   setDaysTog]     = useState(0);

  useEffect(() => {
    const stored = getStoredCouple();
    if (!stored) { router.replace('/'); return; }
    setReady(true);
    loadUsers(stored.coupleId, stored.userId);
  }, [router]);

  async function loadUsers(_coupleId: string, myId: string) {
    // Load my info
    const meRes = await fetch(`/api/users/${myId}`);
    const meData = await meRes.json();
    if (meData.user) {
      setMe(meData.user);
      setPickedColor(meData.user.avatar_color ?? '#FF4FA3');
      setAvatarUrl(meData.user.avatar_url ?? '');
    }
    // Load couple to find partner
    const coupleRes  = await fetch(`/api/couple?code=MJ2025`); // refetch couple
    const coupleData = await coupleRes.json();
    if (coupleData.users) {
      const partnerUser = coupleData.users.find((u: { id: string }) => u.id !== myId);
      if (partnerUser) {
        const pRes  = await fetch(`/api/users/${partnerUser.id}`);
        const pData = await pRes.json();
        if (pData.user) setPartner(pData.user);
      }
    }
    // Days together — use fixed date since we know the couple
    const paired = new Date('2026-03-20');
    const now    = new Date();
    setDaysTog(Math.floor((now.getTime() - paired.getTime()) / (1000 * 60 * 60 * 24)));
  }

  async function saveAvatar() {
    const stored = getStoredCouple();
    if (!stored || !me) return;
    setSaving(true);
    await fetch(`/api/users/${stored.userId}`, {
      method:  'PATCH',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ avatar_color: pickedColor, avatar_url: avatarUrl || null }),
    });
    setMe(prev => prev ? { ...prev, avatar_color: pickedColor, avatar_url: avatarUrl || undefined } : prev);
    setSaving(false);
    setEditing(false);
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen pb-24 home-bg">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 text-center">
        <h1 className="text-4xl font-bold home-title">Us</h1>
        <p className="text-pink-400 text-sm mt-1">Maryjane &amp; Chukwuemeka</p>
      </div>

      <div className="px-4 max-w-sm mx-auto space-y-5">

        {/* Couple avatars */}
        <div className="pink-card p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {me && <Avatar user={me} size="lg" editable onEdit={() => setEditing(e => !e)} />}
            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
              <span className="text-pink-400 text-xs font-bold">&amp;</span>
            </div>
            {partner && <Avatar user={partner} size="lg" />}
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-700">{me?.display_name} &amp; {partner?.display_name}</p>
            <p className="text-pink-400 text-sm mt-1">{daysToget} days together</p>
          </div>
        </div>

        {/* Edit avatar */}
        {editing && (
          <div className="pink-card p-5 space-y-4 animate-slide-up">
            <p className="text-sm font-bold text-pink-600">Customise your avatar</p>

            <div>
              <p className="text-xs text-gray-500 mb-2">Pick a colour</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Pick colour ${c}`}
                    onClick={() => setPickedColor(c)}
                    className={`w-9 h-9 rounded-full border-2 transition-transform active:scale-90 swatch-${c.replace('#', '')} ${pickedColor === c ? 'border-gray-800 scale-[1.15]' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Or paste a photo URL</p>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="w-full text-sm px-3 py-2 rounded-xl bg-pink-50 text-gray-700 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl text-pink-400 text-sm font-medium bg-pink-50">Cancel</button>
              <button type="button" onClick={saveAvatar} disabled={saving} className="flex-1 py-2 rounded-xl text-white text-sm font-bold pink-button disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="pink-card p-4 text-center">
            <p className="text-3xl font-bold home-title">{daysToget}</p>
            <p className="text-pink-400 text-xs mt-1">Days together</p>
          </div>
          <div className="pink-card p-4 text-center">
            <p className="text-3xl font-bold home-title">MJ</p>
            <p className="text-pink-400 text-xs mt-1">Your couple code</p>
          </div>
        </div>

        {/* Disconnect */}
        <button
          type="button"
          onClick={() => { clearCouple(); router.replace('/'); }}
          className="w-full py-3 rounded-2xl text-pink-400 text-sm font-medium bg-pink-50"
        >
          Sign out of this device
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
