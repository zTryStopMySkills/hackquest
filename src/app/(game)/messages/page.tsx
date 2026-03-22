'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Contact {
  id: string;
  username: string;
  rank: string;
  unreadCount: number;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { username: string; rank: string };
}

const RANK_COLOR: Record<string, string> = {
  SCRIPT_KIDDIE: '#888', JUNIOR: '#00FFFF', PENTESTER: '#00FF41',
  RED_TEAM: '#FF5722', ELITE_HACKER: '#B347EA', LEGEND: '#FFB800',
};

const ENCRYPTED_BANNERS = [
  '> CANAL CIFRADO CON AES-256-GCM — tus datos viajan en sombras',
  '> PROTOCOLO TLS 1.3 ACTIVO — ni Dios lee esto… bueno, casi nadie',
  '> END-TO-END ENCRYPTION ENABLED — si alguien lo lee, no eres tú',
  '> ZERO-KNOWLEDGE CHANNEL — ni el servidor sabe lo que dices (mentira)',
];

const ANTIPHISHING = [
  '> Pro tip: si alguien te pide tu contraseña "para verificar tu cuenta", eres la víctima del CTF ahora mismo.',
  '> Regla #1 del hacker listo: no doxes tus datos ni caigas en phishing. Regla #2: lo mismo.',
  '> Si recibes un enlace sospechoso, analízalo en VirusTotal antes de hacer clic. O simplemente no hagas clic.',
  '> Tu OPSEC es tan fuerte como tu contraseña más débil. Usa un gestor, rookie.',
];

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState('');
  const [bannerIdx] = useState(() => Math.floor(Math.random() * ENCRYPTED_BANNERS.length));
  const [phishingIdx] = useState(() => Math.floor(Math.random() * ANTIPHISHING.length));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setMyId(d.id); });
    fetchContacts();
  }, []);

  const fetchContacts = useCallback(async () => {
    const res = await fetch('/api/messages');
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts ?? []);
    }
  }, []);

  const openChat = useCallback(async (contact: Contact) => {
    setActiveContact(contact);
    const res = await fetch(`/api/messages/${contact.id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
      // Mark contact as read locally
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unreadCount: 0 } : c));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !activeContact || sending) return;
    setSending(true);
    const res = await fetch(`/api/messages/${activeContact.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setInput('');
      fetchContacts();
    }
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const totalUnread = contacts.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Contacts sidebar */}
      <div className="w-72 shrink-0 border-r border-military-border flex flex-col bg-military-panel/50">
        <div className="px-4 py-3 border-b border-military-border">
          <p className="text-matrix-green text-xs font-mono font-bold tracking-widest">
            MENSAJES CIFRADOS
            {totalUnread > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-neon-red/20 text-neon-red border border-neon-red/30 text-[10px] rounded-sm">
                {totalUnread}
              </span>
            )}
          </p>
        </div>

        {contacts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-matrix-green/20 text-xs font-mono text-center">
              Sin conversaciones.<br />
              Habla con agentes desde el leaderboard.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => openChat(contact)}
                className={`w-full px-4 py-3 border-b border-military-border/40 text-left hover:bg-military-accent/20 transition-colors ${activeContact?.id === contact.id ? 'bg-military-accent/30' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: RANK_COLOR[contact.rank] ?? '#00FF41' }}
                  >
                    {contact.username}
                  </span>
                  {contact.unreadCount > 0 && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-neon-red/20 text-neon-red border border-neon-red/30 rounded-sm font-mono">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
                {contact.lastMessage && (
                  <p className="text-matrix-green/30 text-[10px] font-mono truncate">
                    {contact.lastMessage.content}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-matrix-green/20 text-xs font-mono tracking-widest">&gt; SELECCIONA UN CONTACTO</p>
              <p className="text-matrix-green/10 text-[10px] font-mono mt-2">
                Todos los mensajes están cifrados end-to-end
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-military-border bg-military-panel/50 flex items-center gap-3">
              <span
                className="text-sm font-bold font-mono"
                style={{ color: RANK_COLOR[activeContact.rank] ?? '#00FF41' }}
              >
                {activeContact.username}
              </span>
              <span className="text-matrix-green/30 text-[10px] font-mono">
                {activeContact.rank.replace(/_/g, ' ')}
              </span>
              <div className="ml-auto text-[10px] font-mono text-matrix-green/30">
                {ENCRYPTED_BANNERS[bannerIdx]}
              </div>
            </div>

            {/* Anti-phishing banner */}
            <div className="px-4 py-2 bg-neon-amber/5 border-b border-neon-amber/20">
              <p className="text-neon-amber/60 text-[10px] font-mono">{ANTIPHISHING[phishingIdx]}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.senderId === myId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-sm border text-sm font-mono`}
                      style={{
                        backgroundColor: isMe ? 'rgba(0,255,65,0.05)' : 'rgba(255,255,255,0.03)',
                        borderColor: isMe ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      {!isMe && (
                        <p className="text-[10px] font-bold mb-1" style={{ color: RANK_COLOR[msg.sender.rank] ?? '#00FF41' }}>
                          {msg.sender.username}
                        </p>
                      )}
                      <p className="text-matrix-green/80 leading-relaxed break-words">{msg.content}</p>
                      <p className="text-matrix-green/20 text-[9px] mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-military-border bg-military-panel/50 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="> mensaje cifrado..."
                maxLength={1000}
                className="flex-1 bg-military-dark border border-military-border text-matrix-green text-xs font-mono px-3 py-2 focus:outline-none focus:border-matrix-green/50 placeholder-matrix-green/20"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="px-4 py-2 border border-matrix-green/40 text-matrix-green text-xs font-mono font-bold hover:bg-matrix-green/10 disabled:opacity-30 transition-colors"
              >
                {sending ? '[...]' : '[SEND]'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
