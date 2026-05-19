'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BackIcon, SendIcon, CheckIcon } from '@/components/icons';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_by: string[] | null;
};
type Session = {
  id: string; content_type: string;
  response_user_a: unknown; response_user_b: unknown;
  content?: { text: string };
};

export default function DiscussPage() {
  const router  = useRouter();
  const params  = useParams();
  const sid     = params.sessionId as string;
  const couple  = useRef(getStoredCouple());
  const c       = couple.current;

  const [session,        setSession]        = useState<Session | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [newMessage,     setNewMessage]     = useState('');
  const [sending,        setSending]        = useState(false);
  const [partnerTyping,  setPartnerTyping]  = useState(false);
  const typingTimeout    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd      = useRef<HTMLDivElement>(null);
  const inputRef         = useRef<HTMLInputElement>(null);

  const partnerName = c?.userName === 'Maryjane' ? 'Chukwuemeka' : 'Maryjane';

  const fetchMessages = useCallback(async () => {
    if (!c) return;
    const res  = await fetch(`/api/sessions/${sid}/chat?userId=${c.userId}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, [sid, c]);

  const fetchTyping = useCallback(async () => {
    if (!c) return;
    const res  = await fetch(`/api/sessions/${sid}/typing?userId=${c.userId}`);
    const data = await res.json();
    setPartnerTyping(!!data.typing);
  }, [sid, c]);

  useEffect(() => {
    if (!c) { router.replace('/'); return; }
    fetchSession();
    fetchMessages();
    const msgIv     = setInterval(fetchMessages, 3000);
    const typingIv  = setInterval(fetchTyping,   2000);
    return () => { clearInterval(msgIv); clearInterval(typingIv); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  async function fetchSession() {
    if (!c) return;
    const res  = await fetch(`/api/sessions?sessionId=${sid}&coupleId=${c.coupleId}&userId=${c.userId}&contentId=_`);
    const data = await res.json();
    if (data.session) setSession(data.session);
  }

  function handleTyping(val: string) {
    setNewMessage(val);
    if (!c) return;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    // Debounce: send typing signal at most once per 1.5s
    typingTimeout.current = setTimeout(() => {
      fetch(`/api/sessions/${sid}/typing`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ coupleId: c.coupleId, userId: c.userId }),
      });
    }, 300);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !c || sending) return;
    const msg = newMessage;
    setNewMessage('');
    setSending(true);
    await fetch(`/api/sessions/${sid}/chat`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ coupleId: c.coupleId, senderId: c.userId, content: msg }),
    });
    setSending(false);
    fetchMessages();
  }

  function isRead(msg: Message) {
    if (!c || msg.sender_id !== c.userId) return false;
    const readBy = msg.read_by ?? [];
    return readBy.some(id => id !== c.userId);
  }

  return (
    <main className="min-h-screen flex flex-col daily-page-bg">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 daily-header-revealed text-white">
        <div className="flex items-center gap-3 mb-2">
          <button type="button" onClick={() => router.back()} aria-label="Go back" className="w-8 h-8 rounded-full back-btn-glass flex items-center justify-center">
            <BackIcon className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-bold text-lg serif-heading">Discuss</h1>
        </div>
        <p className="text-white/75 text-sm">Your private conversation with {partnerName}</p>
      </div>

      {/* Answers recap */}
      {session && (
        <div className="px-4 pt-4 max-w-sm mx-auto w-full">
          <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-2">Both answered</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl p-3 your-answer-card">
              <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-1">{c?.userName}</p>
              <p className="text-gray-700 text-xs leading-relaxed">
                {typeof session.response_user_a === 'object'
                  ? (session.response_user_a as Record<string, unknown>)?.text as string ?? JSON.stringify(session.response_user_a)
                  : String(session.response_user_a ?? '')}
              </p>
            </div>
            <div className="rounded-2xl p-3 partner-answer-card">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">{partnerName}</p>
              <p className="text-gray-700 text-xs leading-relaxed">
                {typeof session.response_user_b === 'object'
                  ? (session.response_user_b as Record<string, unknown>)?.text as string ?? JSON.stringify(session.response_user_b)
                  : String(session.response_user_b ?? '')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-4">
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {messages.length === 0 && (
            <p className="text-pink-300 text-sm text-center mt-8">Start the conversation about this topic</p>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === c?.userId;
            const read  = isRead(msg);
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${isMe ? 'msg-mine' : 'msg-theirs'}`}>
                  {msg.content}
                </div>
                {isMe && (
                  <div className="flex items-center gap-0.5 mt-0.5 mr-1">
                    <CheckIcon className={`w-3 h-3 ${read ? 'text-pink-400' : 'text-pink-200'}`} />
                    <CheckIcon className={`w-3 h-3 -ml-1.5 ${read ? 'text-pink-400' : 'text-pink-200'}`} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {partnerTyping && (
            <div className="flex items-start">
              <div className="msg-theirs px-4 py-3 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full bg-pink-300 bounce-dot delay-0`} />
                <span className={`w-2 h-2 rounded-full bg-pink-300 bounce-dot delay-1`} />
                <span className={`w-2 h-2 rounded-full bg-pink-300 bounce-dot delay-2`} />
              </div>
            </div>
          )}

          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="border-t border-pink-100 py-4 flex gap-2 bg-white/60">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Message ${partnerName}…`}
            className="flex-1 text-sm px-4 py-3 rounded-2xl bg-pink-50 text-gray-700 placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            aria-label="Send message"
            className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40 send-btn"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
