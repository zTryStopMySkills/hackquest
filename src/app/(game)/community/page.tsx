'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import GameLayout from '@/components/layout/GameLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  displayName: string;
  content: string;
  rank: string;
  userId: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RANK_META: Record<string, { color: string; label: string; glow: string }> = {
  SCRIPT_KIDDIE: { color: '#888888', label: 'SK',     glow: 'rgba(136,136,136,0.3)' },
  JUNIOR:        { color: '#00FFFF', label: 'JR',     glow: 'rgba(0,255,255,0.3)'   },
  PENTESTER:     { color: '#00FF41', label: 'PT',     glow: 'rgba(0,255,65,0.4)'    },
  RED_TEAM:      { color: '#FF5722', label: 'RT',     glow: 'rgba(255,87,34,0.4)'   },
  ELITE_HACKER:  { color: '#B347EA', label: 'EH',     glow: 'rgba(179,71,234,0.4)'  },
  LEGEND:        { color: '#FFB800', label: 'LGD',    glow: 'rgba(255,184,0,0.5)'   },
};

const RULES = [
  'Sin enlaces ni URLs',
  'Sin números de teléfono',
  'Sin correos electrónicos',
  'Máximo 300 caracteres por mensaje',
  'Cooldown de 5s entre mensajes',
  'Respeta a los demás agentes',
];

const COOLDOWN_SEC = 5;
const MAX_CHARS = 300;
const POLL_INTERVAL = 3000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showNickModal, setShowNickModal] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [nickError, setNickError] = useState('');
  const [currentNick, setCurrentNick] = useState('');
  const [myUserId, setMyUserId] = useState('');
  const [invites, setInvites] = useState<Set<string>>(new Set());

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<number>(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Load current user ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setMyUserId(data.user.id);
          setCurrentNick(data.user.chatNickname || data.user.username);
        }
      })
      .catch(() => {});

    const saved = localStorage.getItem('hq_invites');
    if (saved) {
      try { setInvites(new Set(JSON.parse(saved))); } catch {}
    }
  }, []);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (initial = false) => {
    const url = initial
      ? '/api/community/messages'
      : `/api/community/messages?after=${lastTimestampRef.current}`;

    const res = await fetch(url).catch(() => null);
    if (!res?.ok) return;

    const data = await res.json();
    if (!data.messages?.length) return;

    const newest = data.messages[data.messages.length - 1];
    lastTimestampRef.current = new Date(newest.createdAt).getTime();

    if (initial) {
      setMessages(data.messages);
    } else {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newOnes = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
        return newOnes.length ? [...prev, ...newOnes] : prev;
      });
    }
  }, []);

  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(() => loadMessages(false), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || cooldown > 0 || sending) return;
    setError('');
    setSending(true);

    const res = await fetch('/api/community/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error || 'Error al enviar');
      if (res.status === 429) startCooldown(COOLDOWN_SEC);
      return;
    }

    setInput('');
    setMessages((prev) => {
      if (prev.find((m) => m.id === data.message.id)) return prev;
      return [...prev, data.message];
    });
    lastTimestampRef.current = new Date(data.message.createdAt).getTime();
    startCooldown(COOLDOWN_SEC);
  }

  function startCooldown(secs: number) {
    setCooldown(secs);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Change nickname ────────────────────────────────────────────────────────
  async function saveNickname() {
    setNickError('');
    const res = await fetch('/api/community/nickname', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickInput }),
    });
    const data = await res.json();
    if (!res.ok) { setNickError(data.error); return; }
    setCurrentNick(data.nickname);
    setShowNickModal(false);
    setNickInput('');
    showToast(`Alias cambiado a ${data.nickname}`);
  }

  // ── Invite ────────────────────────────────────────────────────────────────
  function toggleInvite(userId: string, name: string) {
    setInvites((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
        showToast(`${name} eliminado de invitaciones`);
      } else {
        next.add(userId);
        showToast(`${name} añadido a tus invitaciones`);
      }
      localStorage.setItem('hq_invites', JSON.stringify([...next]));
      return next;
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const charsLeft = MAX_CHARS - input.length;

  return (
    <GameLayout username="Agente_47" rank="PENTESTER" elo={1547} eloState="STABLE" points={12480} streak={3}>
      <div className="flex flex-col h-[calc(100vh-64px)] p-4 gap-3">

        {/* Header */}
        <div className="panel-classified px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-matrix-green/40 text-[10px] font-mono tracking-widest">[SYS]</span>
              <h1
                className="text-matrix-green font-mono font-bold text-sm tracking-widest uppercase"
                style={{ textShadow: '0 0 6px rgba(0,255,65,0.6)' }}
              >
                Canal Comunitario
              </h1>
              <span className="text-[9px] font-mono text-matrix-green/40 border border-matrix-green/20 px-1.5 py-0.5">
                CIFRADO
              </span>
              <span className="text-[9px] font-mono text-neon-cyan/60 border border-neon-cyan/20 px-1.5 py-0.5">
                ANÓNIMO
              </span>
            </div>
            <p className="text-matrix-green/30 text-[10px] font-mono mt-0.5">
              Mejoras · Feedback · Partidas · Comunidad // Sin datos personales
            </p>
          </div>
          <button
            onClick={() => setShowRules((v) => !v)}
            className="text-[10px] font-mono text-neon-amber/60 hover:text-neon-amber border border-neon-amber/20 hover:border-neon-amber/50 px-2 py-1 transition-colors"
          >
            [REGLAS]
          </button>
        </div>

        {/* Rules panel */}
        {showRules && (
          <div className="panel shrink-0 px-4 py-3 border-l-2 border-neon-amber/60">
            <p className="text-neon-amber text-[10px] font-mono font-bold mb-2 tracking-widest">
              // PROTOCOLO DEL CANAL //
            </p>
            <div className="grid grid-cols-2 gap-1">
              {RULES.map((r, i) => (
                <p key={i} className="text-matrix-green/50 text-[10px] font-mono flex items-center gap-1.5">
                  <span className="text-neon-red/60">[✗]</span> {r}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto panel space-y-0 min-h-0"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#00FF4120 transparent' }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-matrix-green/20 font-mono">
              <p className="text-3xl">[~]</p>
              <p className="text-xs tracking-widest uppercase">Canal vacío — sé el primero en transmitir</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.userId === myUserId;
              const rank = RANK_META[msg.rank] ?? RANK_META.SCRIPT_KIDDIE;
              const invited = invites.has(msg.userId);

              return (
                <div
                  key={msg.id}
                  className={`group flex items-start gap-2 px-3 py-2 border-b border-military-border/20 hover:bg-military-accent/20 transition-colors ${
                    isMine ? 'bg-matrix-green/3' : ''
                  }`}
                >
                  {/* Rank badge */}
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 border shrink-0 mt-0.5"
                    style={{
                      color: rank.color,
                      borderColor: `${rank.color}40`,
                      backgroundColor: `${rank.color}08`,
                      textShadow: `0 0 4px ${rank.glow}`,
                    }}
                  >
                    {rank.label}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: rank.color, textShadow: `0 0 4px ${rank.glow}` }}
                      >
                        {msg.displayName}
                      </span>
                      {isMine && (
                        <span className="text-[9px] font-mono text-matrix-green/30">(TÚ)</span>
                      )}
                      <span className="text-[10px] font-mono text-matrix-green/25">
                        {formatTime(msg.createdAt)} · {relativeTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-matrix-green/80 text-xs font-mono leading-relaxed mt-0.5 break-words">
                      {msg.content}
                    </p>
                  </div>

                  {/* Invite button */}
                  {!isMine && (
                    <button
                      onClick={() => toggleInvite(msg.userId, msg.displayName)}
                      className={`opacity-0 group-hover:opacity-100 shrink-0 text-[9px] font-mono px-1.5 py-0.5 border transition-all ${
                        invited
                          ? 'text-matrix-green border-matrix-green/50 bg-matrix-green/10'
                          : 'text-matrix-green/40 border-matrix-green/20 hover:border-matrix-green/50 hover:text-matrix-green'
                      }`}
                    >
                      {invited ? '[✓ INVITADO]' : '[+ INVITAR]'}
                    </button>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="panel-classified shrink-0 p-3 space-y-2">
          {/* Nickname bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-matrix-green/30 text-[10px] font-mono">ALIAS:</span>
              <span
                className="text-matrix-green text-[10px] font-mono font-bold"
                style={{ textShadow: '0 0 4px rgba(0,255,65,0.4)' }}
              >
                {currentNick || '...'}
              </span>
              <button
                onClick={() => { setNickInput(currentNick); setNickError(''); setShowNickModal(true); }}
                className="text-[9px] font-mono text-matrix-green/40 hover:text-matrix-green border border-matrix-green/20 hover:border-matrix-green/40 px-1.5 py-0.5 transition-colors"
              >
                [CAMBIAR]
              </button>
            </div>
            {invites.size > 0 && (
              <span className="text-[9px] font-mono text-neon-amber/60 border border-neon-amber/20 px-1.5 py-0.5">
                [{invites.size}] INVITACIONES PENDIENTES
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-neon-red text-[10px] font-mono flex items-center gap-1">
              <span>[ERR]</span> {error}
            </p>
          )}

          {/* Text input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value.slice(0, MAX_CHARS)); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje... (Enter para enviar)"
                disabled={cooldown > 0 || sending}
                rows={2}
                className="w-full bg-military-dark border border-military-border/60 text-matrix-green/90 font-mono text-xs px-3 py-2 resize-none focus:outline-none focus:border-matrix-green/50 disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-matrix-green/20"
                style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}
              />
              {/* Char counter */}
              <span
                className={`absolute bottom-2 right-2 text-[9px] font-mono ${
                  charsLeft < 50 ? 'text-neon-red/70' : 'text-matrix-green/25'
                }`}
              >
                {charsLeft}
              </span>
            </div>

            <button
              onClick={sendMessage}
              disabled={!input.trim() || cooldown > 0 || sending}
              className="px-4 font-mono text-xs font-bold border transition-all duration-150 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                color: '#00FF41',
                borderColor: '#00FF41',
                backgroundColor: input.trim() && cooldown === 0 ? 'rgba(0,255,65,0.08)' : 'transparent',
                boxShadow: input.trim() && cooldown === 0 ? '0 0 10px rgba(0,255,65,0.2)' : 'none',
              }}
            >
              {sending ? '[...]' : cooldown > 0 ? `[${cooldown}s]` : '[ENVIAR]'}
            </button>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between">
            <p className="text-matrix-green/20 text-[9px] font-mono">
              Enter = enviar · Shift+Enter = nueva línea
            </p>
            {cooldown > 0 && (
              <div className="flex items-center gap-1.5">
                <div
                  className="h-1 rounded-full bg-neon-amber/30 overflow-hidden"
                  style={{ width: '60px' }}
                >
                  <div
                    className="h-full bg-neon-amber/70 transition-all duration-1000"
                    style={{ width: `${(cooldown / COOLDOWN_SEC) * 100}%` }}
                  />
                </div>
                <span className="text-neon-amber/60 text-[9px] font-mono">
                  cooldown {cooldown}s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-[9px] font-mono text-matrix-green/15 tracking-widest shrink-0">
          © 2025 ★ zTryStopMySkills ★ — HackQuest — Todos los derechos reservados
        </p>
      </div>

      {/* Nickname modal */}
      {showNickModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-military-dark/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNickModal(false); }}
        >
          <div
            className="panel-classified w-full max-w-sm p-6 space-y-4"
            style={{ boxShadow: '0 0 40px rgba(0,255,65,0.15)' }}
          >
            <div>
              <p className="text-matrix-green/40 text-[10px] font-mono tracking-widest">[SYS] CAMBIO DE IDENTIDAD</p>
              <h2 className="text-matrix-green font-mono font-bold text-sm mt-1">
                Elige tu alias en el canal
              </h2>
              <p className="text-matrix-green/40 text-[10px] font-mono mt-1">
                3–20 caracteres · Letras, números, _ y -
              </p>
            </div>

            <input
              type="text"
              value={nickInput}
              onChange={(e) => { setNickInput(e.target.value); setNickError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
              placeholder="nuevo_alias"
              maxLength={20}
              className="w-full bg-military-dark border border-military-border text-matrix-green font-mono text-sm px-3 py-2 focus:outline-none focus:border-matrix-green/60 placeholder:text-matrix-green/20"
            />

            {nickError && (
              <p className="text-neon-red text-[10px] font-mono">[ERR] {nickError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={saveNickname}
                disabled={!nickInput.trim()}
                className="flex-1 btn-hack py-2 text-xs disabled:opacity-40"
              >
                [APLICAR]
              </button>
              <button
                onClick={() => setShowNickModal(false)}
                className="px-4 py-2 text-xs font-mono text-matrix-green/50 border border-military-border hover:border-matrix-green/30 hover:text-matrix-green/80 transition-colors"
              >
                [CANCELAR]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 font-mono text-xs text-matrix-green border border-matrix-green/40 bg-military-dark/90"
          style={{ boxShadow: '0 0 20px rgba(0,255,65,0.2)' }}
        >
          [OK] {toast}
        </div>
      )}
    </GameLayout>
  );
}
