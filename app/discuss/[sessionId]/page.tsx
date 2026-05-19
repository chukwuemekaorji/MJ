'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getStoredCouple } from '@/lib/coupleStore';
import { BackIcon, SendIcon, CheckIcon, ReplyIcon, XIcon } from '@/components/icons';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_by: string[] | null;
  reply_to_id: string | null;
  reply_to: { content: string; sender_id: string } | null;
  reactions: Record<string, string[]> | null;
};

type ReplyTo = { id: string; content: string; senderName: string };

type Session = {
  id: string; content_type: string;
  response_user_a: unknown; response_user_b: unknown;
};

// ── Per-message bubble with swipe + long press ──────────────────────────────
function MessageBubble({
  msg, isMe, myName, partnerName, onReply, onReact,
}: {
  msg: Message;
  isMe: boolean;
  myName: string;
  partnerName: string;
  onReply: (msg: Message) => void;
  onReact: (id: string, emoji: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const bubbleRef  = useRef<HTMLDivElement>(null);
  const arrowRef   = useRef<HTMLDivElement>(null);
  const startX     = useRef(0);
  const startY     = useRef(0);
  const swipeDist  = useRef(0);
  const longTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSwipe   = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    startX.current   = e.touches[0].clientX;
    startY.current   = e.touches[0].clientY;
    swipeDist.current = 0;
    didSwipe.current  = false;
    longTimer.current = setTimeout(() => {
      if (!didSwipe.current) setShowPicker(true);
    }, 500);
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; }
    }
    if (dx > 0 && Math.abs(dy) < 35) {
      didSwipe.current  = true;
      swipeDist.current = Math.min(dx, 72);
      if (bubbleRef.current) {
        bubbleRef.current.style.transform  = `translateX(${swipeDist.current}px)`;
        bubbleRef.current.style.transition = 'none';
      }
      if (arrowRef.current) {
        arrowRef.current.style.opacity = String(Math.min(swipeDist.current / 60, 1));
      }
    }
  }

  function onTouchEnd() {
    if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; }
    if (swipeDist.current > 60) onReply(msg);
    swipeDist.current = 0;
    if (bubbleRef.current) {
      bubbleRef.current.style.transform  = '';
      bubbleRef.current.style.transition = 'transform 0.2s ease-out';
    }
    if (arrowRef.current) arrowRef.current.style.opacity = '0';
  }

  const read = isMe && (msg.read_by ?? []).some(id => id !== msg.sender_id);
  const hasReactions = msg.reactions && Object.values(msg.reactions).some(u => u.length > 0);
  const replyName = msg.reply_to
    ? (msg.reply_to.sender_id === msg.sender_id ? (isMe ? myName : partnerName) : (isMe ? partnerName : myName))
    : '';

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}>

      {/* Emoji picker overlay */}
      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className={`absolute bottom-full mb-2 z-50 emoji-picker ${isMe ? 'right-0' : 'left-0'}`}>
            {REACTION_EMOJIS.map(e => (
              <button key={e} type="button"
                onClick={() => { onReact(msg.id, e); setShowPicker(false); }}
                className="text-xl leading-none hover:scale-125 transition-transform">
                {e}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Reply-to preview strip */}
      {msg.reply_to && (
        <div className="reply-preview max-w-[75%]">
          <p className="text-xs font-bold text-pink-500">{replyName}</p>
          <p className="text-xs text-gray-500 truncate">{msg.reply_to.content}</p>
        </div>
      )}

      {/* Swipe row: reply arrow + bubble */}
      <div className={`flex items-center gap-1 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div ref={arrowRef} className="reply-arrow">
          <ReplyIcon className="w-4 h-4 text-pink-400" />
        </div>

        <div
          ref={bubbleRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed select-none msg-bubble ${isMe ? 'msg-mine' : 'msg-theirs'} ${msg.reply_to ? 'rounded-tl-sm' : ''}`}
        >
          {msg.content}
        </div>
      </div>

      {/* Reactions */}
      {hasReactions && (
        <div className={`flex gap-1 flex-wrap mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          {Object.entries(msg.reactions ?? {}).map(([emoji, users]) =>
            users.length > 0 ? (
              <button key={emoji} type="button"
                onClick={() => onReact(msg.id, emoji)}
                className="reaction-chip">
                {emoji} <span className="text-pink-400 text-xs">{users.length}</span>
              </button>
            ) : null
          )}
        </div>
      )}

      {/* Read ticks */}
      {isMe && (
        <div className="flex items-center mt-0.5 mr-1">
          <CheckIcon className={`w-3 h-3 ${read ? 'text-pink-400' : 'text-pink-200'}`} />
          <CheckIcon className={`w-3 h-3 -ml-1.5 ${read ? 'text-pink-400' : 'text-pink-200'}`} />
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function DiscussPage() {
  const router = useRouter();
  const params = useParams();
  const sid    = params.sessionId as string;
  const couple = useRef(getStoredCouple());
  const c      = couple.current;

  const [session,       setSession]       = useState<Session | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [newMessage,    setNewMessage]    = useState('');
  const [sending,       setSending]       = useState(false);
  const [replyTo,       setReplyTo]       = useState<ReplyTo | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd     = useRef<HTMLDivElement>(null);

  const myName      = c?.userName ?? '';
  const partnerName = myName === 'Maryjane' ? 'Chukwuemeka' : 'Maryjane';

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
    const msgIv    = setInterval(fetchMessages, 3000);
    const typingIv = setInterval(fetchTyping, 2000);
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
    if (typingDebounce.current) clearTimeout(typingDebounce.current);
    typingDebounce.current = setTimeout(() => {
      fetch(`/api/sessions/${sid}/typing`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ coupleId: c.coupleId, userId: c.userId }),
      });
    }, 300);
  }

  function handleReply(msg: Message) {
    const senderName = msg.sender_id === c?.userId ? myName : partnerName;
    setReplyTo({ id: msg.id, content: msg.content, senderName });
  }

  async function handleReact(messageId: string, emoji: string) {
    if (!c) return;
    await fetch(`/api/sessions/${sid}/chat`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messageId, userId: c.userId, emoji }),
    });
    fetchMessages();
  }

  async function sendMessage() {
    if (!newMessage.trim() || !c || sending) return;
    const msg     = newMessage;
    const rId     = replyTo?.id ?? null;
    setNewMessage('');
    setReplyTo(null);
    setSending(true);
    await fetch(`/api/sessions/${sid}/chat`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ coupleId: c.coupleId, senderId: c.userId, content: msg, replyToId: rId }),
    });
    setSending(false);
    fetchMessages();
  }

  return (
    <main className="min-h-screen flex flex-col daily-page-bg">

      {/* Header */}
      <div className="px-4 pt-10 pb-4 daily-header-revealed text-white">
        <div className="flex items-center gap-3 mb-2">
          <button type="button" onClick={() => router.back()} aria-label="Go back"
            className="w-8 h-8 rounded-full back-btn-glass flex items-center justify-center">
            <BackIcon className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-bold text-lg serif-heading flex-1">Discuss</h1>
        </div>
        <p className="text-white/75 text-sm">Your private conversation with {partnerName}</p>
      </div>

      {/* Answers recap */}
      {session && (
        <div className="px-4 pt-4 max-w-sm mx-auto w-full">
          <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-2">Both answered</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl p-3 your-answer-card">
              <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-1">{myName}</p>
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
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {messages.length === 0 && (
            <p className="text-pink-300 text-sm text-center mt-8">Start the conversation about this topic</p>
          )}
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={msg.sender_id === c?.userId}
              myName={myName}
              partnerName={partnerName}
              onReply={handleReply}
              onReact={handleReact}
            />
          ))}

          {/* Typing indicator */}
          {partnerTyping && (
            <div className="flex items-start">
              <div className="msg-theirs px-4 py-3 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-300 bounce-dot delay-0" />
                <span className="w-2 h-2 rounded-full bg-pink-300 bounce-dot delay-1" />
                <span className="w-2 h-2 rounded-full bg-pink-300 bounce-dot delay-2" />
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Reply bar */}
        {replyTo && (
          <div className="reply-bar">
            <ReplyIcon className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <div className="flex-1 min-w-0 pl-2 border-l-2 border-pink-400">
              <p className="text-xs font-bold text-pink-600">{replyTo.senderName}</p>
              <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
              <XIcon className="w-4 h-4 text-pink-300" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-pink-100 py-4 flex gap-2 bg-white/60">
          <input
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
