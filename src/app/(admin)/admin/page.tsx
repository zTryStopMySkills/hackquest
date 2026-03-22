'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Report types ─────────────────────────────────────────────────────────────

interface AdminReport {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: { id: string; username: string; rank: string };
}

const REPORT_TYPE_COLOR: Record<string, string> = {
  BUG: '#FF3333',
  IMPROVEMENT: '#2196F3',
  CONTENT_ERROR: '#FFB800',
  FEEDBACK: '#00FF41',
  OTHER: '#888',
};

const REPORT_STATUS_COLOR: Record<string, string> = {
  OPEN: '#FFB800',
  IN_REVIEW: '#2196F3',
  RESOLVED: '#00FF41',
  DISMISSED: '#555',
};

// ─── Admin user types ──────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  username: string;
  email: string;
  rank: string;
  points: number;
  elo: number;
  isPremium: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  banReason: string | null;
  isIsolated: boolean;
  isolatedUntil: string | null;
  createdAt: string;
  lastActiveAt: string;
  _count: { challengeAttempts: number; communityMessages: number };
}

interface ActivityData {
  attempts: {
    id: string;
    solved: boolean;
    score: number;
    startedAt: string;
    completedAt: string | null;
    challenge: { title: string; branch: string; difficulty: string };
  }[];
  communityMessages: { id: string; content: string; createdAt: string }[];
  eloHistory: { id: string; elo: number; change: number; reason: string; createdAt: string }[];
  adminLogs: {
    id: string;
    action: string;
    reason: string | null;
    createdAt: string;
    admin: { username: string };
  }[];
  notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }[];
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string; rank: string };
  recipient: { id: string; username: string; rank: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RANK_COLOR: Record<string, string> = {
  SCRIPT_KIDDIE: '#888',
  JUNIOR: '#00FFFF',
  PENTESTER: '#00FF41',
  RED_TEAM: '#FF5722',
  ELITE_HACKER: '#B347EA',
  LEGEND: '#FFB800',
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
  '> Si recibes un enlace sospechoso, analízalo en VirusTotal antes de hacer clic. O simplemente no hagas clic. Más fácil.',
  '> Tu OPSEC es tan fuerte como tu contraseña más débil. Usa un gestor, rookie.',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────


function StatusBadge({ user }: { user: AdminUser }) {
  if (user.isAdmin)     return <span style={{ color: '#FFB800', fontSize: 10, border: '1px solid #FFB800', padding: '1px 6px', borderRadius: 4 }}>ADMIN</span>;
  if (user.isBanned)    return <span style={{ color: '#FF3333', fontSize: 10, border: '1px solid #FF3333', padding: '1px 6px', borderRadius: 4 }}>BANEADO</span>;
  if (user.isIsolated)  return <span style={{ color: '#FF9800', fontSize: 10, border: '1px solid #FF9800', padding: '1px 6px', borderRadius: 4 }}>AISLADO</span>;
  if (user.isPremium)   return <span style={{ color: '#B347EA', fontSize: 10, border: '1px solid #B347EA', padding: '1px 6px', borderRadius: 4 }}>PREMIUM</span>;
  return <span style={{ color: '#00FF41', fontSize: 10, border: '1px solid #00FF41', padding: '1px 6px', borderRadius: 4 }}>ACTIVO</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPanel() {
  const router = useRouter();

  // Auth check
  const [authChecked, setAuthChecked] = useState(false);

  // Users list
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Selected user
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'activity' | 'chat'>('info');
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action modals
  const [banModal, setBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [isolateModal, setIsolateModal] = useState(false);
  const [isolateMinutes, setIsolateMinutes] = useState(60);
  const [notifyModal, setNotifyModal] = useState(false);
  const [notifyType, setNotifyType] = useState<'WARNING' | 'REWARD'>('WARNING');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [pointsModal, setPointsModal] = useState(false);
  const [pointsDelta, setPointsDelta] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Main panel tab (users vs reports)
  const [mainTab, setMainTab] = useState<'users' | 'reports'>('users');

  // Reports
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [reportPage, setReportPage] = useState(1);
  const [reportPages, setReportPages] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportTypeFilter, setReportTypeFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [reportNewStatus, setReportNewStatus] = useState('');
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportActionLoading, setReportActionLoading] = useState(false);

  // ─── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.isAdmin) router.replace('/');
      else setAuthChecked(true);
    });
  }, [router]);

  // ─── Load users ─────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const qs = new URLSearchParams({ page: String(page), q: search });
    const res = await fetch(`/api/admin/users?${qs}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoadingUsers(false);
  }, [page, search]);

  useEffect(() => { if (authChecked) loadUsers(); }, [authChecked, loadUsers]);

  // ─── Select user ────────────────────────────────────────────────────────────
  async function selectUser(u: AdminUser) {
    setSelected(u);
    setDetailTab('info');
    setActivity(null);
    setChats([]);
  }

  async function loadActivity() {
    if (!selected) return;
    setLoadingDetail(true);
    const res = await fetch(`/api/admin/users/${selected.id}/activity`);
    const data = await res.json();
    setActivity(data);
    setLoadingDetail(false);
  }

  async function loadChats() {
    if (!selected) return;
    setLoadingDetail(true);
    const res = await fetch(`/api/admin/users/${selected.id}/chats`);
    const data = await res.json();
    setChats(data.messages ?? []);
    setLoadingDetail(false);
  }

  function switchTab(tab: 'info' | 'activity' | 'chat') {
    setDetailTab(tab);
    if (tab === 'activity' && !activity) loadActivity();
    if (tab === 'chat' && chats.length === 0) loadChats();
  }

  // ─── Actions ────────────────────────────────────────────────────────────────
  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  }

  async function doBan() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${selected.id}/ban`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ban: !selected.isBanned, reason: banReason }),
    });
    const data = await res.json();
    if (data.success) {
      setSelected(prev => prev ? { ...prev, isBanned: data.user.isBanned, banReason: data.user.banReason } : null);
      setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, isBanned: data.user.isBanned, banReason: data.user.banReason } : u));
      showFeedback(data.user.isBanned ? `✓ Usuario baneado` : `✓ Ban levantado`);
    }
    setBanModal(false);
    setBanReason('');
    setActionLoading(false);
  }

  async function doIsolate() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${selected.id}/isolate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isolate: !selected.isIsolated, minutes: isolateMinutes }),
    });
    const data = await res.json();
    if (data.success) {
      setSelected(prev => prev ? { ...prev, isIsolated: data.user.isIsolated, isolatedUntil: data.user.isolatedUntil } : null);
      setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, isIsolated: data.user.isIsolated } : u));
      showFeedback(data.user.isIsolated ? `✓ Usuario aislado ${isolateMinutes}min` : `✓ Aislamiento levantado`);
    }
    setIsolateModal(false);
    setActionLoading(false);
  }

  async function doNotify() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${selected.id}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: notifyType, title: notifyTitle, message: notifyMessage }),
    });
    const data = await res.json();
    if (data.success) showFeedback(`✓ Notificación enviada`);
    setNotifyModal(false);
    setNotifyTitle('');
    setNotifyMessage('');
    setActionLoading(false);
  }

  async function doPoints() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${selected.id}/points`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: pointsDelta }),
    });
    const data = await res.json();
    if (data.success) {
      setSelected(prev => prev ? { ...prev, points: data.user.points } : null);
      setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, points: data.user.points } : u));
      showFeedback(`✓ Puntos ajustados → ${data.user.points}`);
    }
    setPointsModal(false);
    setPointsDelta(0);
    setActionLoading(false);
  }

  async function doDelete() {
    if (!selected) return;
    if (!confirm(`¿Eliminar permanentemente a ${selected.username}? Esta acción NO se puede deshacer.`)) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${selected.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setUsers(prev => prev.filter(u => u.id !== selected.id));
      setSelected(null);
      showFeedback(`✓ Usuario eliminado`);
    }
    setActionLoading(false);
  }

  async function doDeleteMessage(msgId: string) {
    const res = await fetch(`/api/admin/messages/${msgId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setActivity(prev => prev ? {
        ...prev,
        communityMessages: prev.communityMessages.filter(m => m.id !== msgId),
      } : null);
      showFeedback('✓ Mensaje eliminado');
    }
  }

  // ─── Reports ────────────────────────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    const qs = new URLSearchParams({
      page: String(reportPage),
      status: reportStatusFilter,
      type: reportTypeFilter,
    });
    const res = await fetch(`/api/admin/reports?${qs}`);
    const data = await res.json();
    setReports(data.reports ?? []);
    setReportTotal(data.total ?? 0);
    setReportPages(data.pages ?? 1);
    setLoadingReports(false);
  }, [reportPage, reportStatusFilter, reportTypeFilter]);

  useEffect(() => {
    if (authChecked && mainTab === 'reports') loadReports();
  }, [authChecked, mainTab, loadReports]);

  async function doUpdateReport() {
    if (!selectedReport || !reportNewStatus) return;
    setReportActionLoading(true);
    const res = await fetch(`/api/admin/reports/${selectedReport.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: reportNewStatus, adminNote: reportNote }),
    });
    const data = await res.json();
    if (data.success) {
      setSelectedReport(data.report);
      setReports(prev => prev.map(r => r.id === selectedReport.id ? data.report : r));
      showFeedback('✓ Reporte actualizado');
    }
    setReportActionLoading(false);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#00FF41', fontFamily: 'monospace' }}>Verificando acceso...</p>
      </div>
    );
  }

  const randomBanner = ENCRYPTED_BANNERS[Math.floor(Math.random() * ENCRYPTED_BANNERS.length)];
  const randomAnti   = ANTIPHISHING[Math.floor(Math.random() * ANTIPHISHING.length)];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      color: '#C9D1D9',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <header style={{
        padding: '12px 24px',
        borderBottom: '1px solid #1E1E2E',
        background: '#0D0D1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#FF3333', fontSize: 18, fontWeight: 700 }}>⬡</span>
          <span style={{ color: '#FF3333', fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>HACKQUEST</span>
          <span style={{ color: '#444', fontSize: 13 }}>/</span>
          <span style={{ color: '#FFB800', fontSize: 13, letterSpacing: 1 }}>PANEL ROOT</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['users', 'reports'] as const).map(t => (
              <button
                key={t}
                onClick={() => setMainTab(t)}
                style={{
                  background: mainTab === t ? '#111827' : 'transparent',
                  border: `1px solid ${mainTab === t ? (t === 'reports' ? '#FFB800' : '#00FF41') : '#333'}`,
                  color: mainTab === t ? (t === 'reports' ? '#FFB800' : '#00FF41') : '#555',
                  padding: '4px 12px', borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'monospace', fontSize: 11, letterSpacing: 1,
                }}
              >
                {t === 'users' ? `◉ AGENTES (${total})` : `⚑ REPORTES${reportTotal > 0 ? ` (${reportTotal})` : ''}`}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
          >
            ← SALIR
          </button>
        </div>
      </header>

      {/* ── Feedback toast ── */}
      {feedback && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#1A2E1A', border: '1px solid #00FF41',
          color: '#00FF41', padding: '8px 20px', borderRadius: 6,
          fontFamily: 'monospace', fontSize: 13,
        }}>
          {feedback}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── REPORTS PANEL ── */}
        {mainTab === 'reports' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Report list */}
            <aside style={{ width: 340, borderRight: '1px solid #1E1E2E', display: 'flex', flexDirection: 'column', background: '#0D0D1A' }}>
              {/* Filters */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #1E1E2E' }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                  {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'].map(s => (
                    <button key={s} onClick={() => { setReportStatusFilter(s); setReportPage(1); }} style={{
                      background: reportStatusFilter === s ? '#111827' : 'transparent',
                      border: `1px solid ${reportStatusFilter === s ? (REPORT_STATUS_COLOR[s] ?? '#00FF41') : '#333'}`,
                      color: reportStatusFilter === s ? (REPORT_STATUS_COLOR[s] ?? '#00FF41') : '#555',
                      padding: '2px 7px', cursor: 'pointer', borderRadius: 3,
                      fontFamily: 'monospace', fontSize: 10,
                    }}>{s}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['ALL', 'BUG', 'IMPROVEMENT', 'CONTENT_ERROR', 'FEEDBACK', 'OTHER'].map(t => (
                    <button key={t} onClick={() => { setReportTypeFilter(t); setReportPage(1); }} style={{
                      background: reportTypeFilter === t ? '#111827' : 'transparent',
                      border: `1px solid ${reportTypeFilter === t ? (REPORT_TYPE_COLOR[t] ?? '#888') : '#222'}`,
                      color: reportTypeFilter === t ? (REPORT_TYPE_COLOR[t] ?? '#888') : '#444',
                      padding: '2px 6px', cursor: 'pointer', borderRadius: 3,
                      fontFamily: 'monospace', fontSize: 9,
                    }}>{t.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
              {/* List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loadingReports ? (
                  <p style={{ color: '#444', padding: 16, fontSize: 12 }}>Cargando...</p>
                ) : reports.length === 0 ? (
                  <p style={{ color: '#333', padding: 16, fontSize: 12 }}>Sin reportes</p>
                ) : reports.map(r => (
                  <div key={r.id} onClick={() => { setSelectedReport(r); setReportNote(r.adminNote ?? ''); setReportNewStatus(r.status); }} style={{
                    padding: '10px 14px', borderBottom: '1px solid #111', cursor: 'pointer',
                    background: selectedReport?.id === r.id ? '#111827' : 'transparent',
                    borderLeft: selectedReport?.id === r.id ? '2px solid #FFB800' : '2px solid transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ color: REPORT_TYPE_COLOR[r.type] ?? '#888', fontSize: 10, fontWeight: 600 }}>
                        {r.type.replace('_', ' ')}
                      </span>
                      <span style={{ color: REPORT_STATUS_COLOR[r.status] ?? '#555', fontSize: 9, border: `1px solid ${REPORT_STATUS_COLOR[r.status] ?? '#555'}40`, padding: '0 5px', borderRadius: 3 }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ color: '#C9D1D9', fontSize: 12, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.title}
                    </div>
                    <div style={{ color: '#444', fontSize: 10 }}>
                      {r.user.username} · {fmt(r.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination */}
              <div style={{ padding: '8px 16px', borderTop: '1px solid #1E1E2E', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => setReportPage(p => Math.max(1, p - 1))} disabled={reportPage === 1}
                  style={{ background: 'transparent', border: '1px solid #333', color: '#666', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontSize: 11 }}>‹</button>
                <span style={{ color: '#555', fontSize: 11 }}>{reportPage}/{reportPages}</span>
                <button onClick={() => setReportPage(p => Math.min(reportPages, p + 1))} disabled={reportPage === reportPages}
                  style={{ background: 'transparent', border: '1px solid #333', color: '#666', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontSize: 11 }}>›</button>
              </div>
            </aside>

            {/* Report detail */}
            <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {!selectedReport ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 8 }}>
                  <span style={{ color: '#1E1E2E', fontSize: 48 }}>⚑</span>
                  <p style={{ color: '#333', fontSize: 13 }}>Selecciona un reporte para revisar</p>
                </div>
              ) : (
                <div>
                  {/* Report header */}
                  <div style={{ background: '#0D0D1A', border: '1px solid #1E1E2E', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ color: REPORT_TYPE_COLOR[selectedReport.type] ?? '#888', fontSize: 11, border: `1px solid ${REPORT_TYPE_COLOR[selectedReport.type] ?? '#888'}40`, padding: '2px 8px', borderRadius: 4 }}>
                            {selectedReport.type.replace('_', ' ')}
                          </span>
                          <span style={{ color: REPORT_STATUS_COLOR[selectedReport.status] ?? '#555', fontSize: 11, border: `1px solid ${REPORT_STATUS_COLOR[selectedReport.status] ?? '#555'}40`, padding: '2px 8px', borderRadius: 4 }}>
                            {selectedReport.status}
                          </span>
                        </div>
                        <h2 style={{ margin: 0, color: '#C9D1D9', fontSize: 18 }}>{selectedReport.title}</h2>
                        <div style={{ marginTop: 6, fontSize: 11, color: '#444' }}>
                          <span style={{ color: RANK_COLOR[selectedReport.user.rank] ?? '#888' }}>{selectedReport.user.username}</span>
                          {' · '}{fmt(selectedReport.createdAt)}
                          {selectedReport.resolvedAt && ` · Resuelto: ${fmt(selectedReport.resolvedAt)}`}
                        </div>
                      </div>
                    </div>
                    {/* Description */}
                    <div style={{ background: '#0A0A14', border: '1px solid #1E1E2E', borderRadius: 4, padding: 16, fontSize: 13, color: '#C9D1D9', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {selectedReport.description}
                    </div>
                    {selectedReport.adminNote && (
                      <div style={{ marginTop: 12, background: '#1A1A0A', border: '1px solid #FFB80030', borderRadius: 4, padding: '10px 14px', fontSize: 12, color: '#FFB800' }}>
                        Nota admin: {selectedReport.adminNote}
                      </div>
                    )}
                  </div>

                  {/* Action panel */}
                  <div style={{ background: '#0D0D1A', border: '1px solid #1E1E2E', borderRadius: 8, padding: 20 }}>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 12, letterSpacing: 1 }}>ACTUALIZAR REPORTE</div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Estado</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const).map(s => (
                          <button key={s} onClick={() => setReportNewStatus(s)} style={{
                            background: reportNewStatus === s ? `${REPORT_STATUS_COLOR[s]}15` : 'transparent',
                            border: `1px solid ${reportNewStatus === s ? REPORT_STATUS_COLOR[s] : '#333'}`,
                            color: reportNewStatus === s ? REPORT_STATUS_COLOR[s] : '#555',
                            padding: '4px 10px', cursor: 'pointer', borderRadius: 4,
                            fontFamily: 'monospace', fontSize: 11,
                          }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Nota para el usuario (opcional)</label>
                      <textarea
                        value={reportNote}
                        onChange={e => setReportNote(e.target.value)}
                        placeholder="Explica la resolución o el motivo del cierre..."
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' as const }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ModalBtn
                        label={reportActionLoading ? '...' : '✓ ACTUALIZAR'}
                        onClick={doUpdateReport}
                        primary
                        loading={reportActionLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* ── Left: user list ── */}
        {mainTab === 'users' && <>
        <aside style={{
          width: 320,
          borderRight: '1px solid #1E1E2E',
          display: 'flex',
          flexDirection: 'column',
          background: '#0D0D1A',
        }}>
          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E1E2E' }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="> buscar agente..."
              style={{
                width: '100%', background: '#0A0A14', border: '1px solid #1E1E2E',
                color: '#00FF41', padding: '6px 10px', borderRadius: 4,
                fontFamily: 'monospace', fontSize: 12, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingUsers ? (
              <p style={{ color: '#444', padding: 16, fontSize: 12 }}>Cargando...</p>
            ) : users.map(u => (
              <div
                key={u.id}
                onClick={() => selectUser(u)}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #111',
                  cursor: 'pointer',
                  background: selected?.id === u.id ? '#111827' : 'transparent',
                  borderLeft: selected?.id === u.id ? '2px solid #00FF41' : '2px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: RANK_COLOR[u.rank] ?? '#888', fontSize: 12, fontWeight: 600 }}>
                    {u.username}
                  </span>
                  <StatusBadge user={u} />
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#555' }}>
                  <span>{u.points.toLocaleString()} pts</span>
                  <span>ELO {u.elo}</span>
                  <span style={{ color: '#333' }}>{u.rank}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid #1E1E2E', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ background: 'transparent', border: '1px solid #333', color: '#666', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontSize: 11 }}>
              ‹
            </button>
            <span style={{ color: '#555', fontSize: 11 }}>{page}/{pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              style={{ background: 'transparent', border: '1px solid #333', color: '#666', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontSize: 11 }}>
              ›
            </button>
          </div>
        </aside>

        {/* ── Right: detail ── */}
        {mainTab === 'users' && <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 8 }}>
              <span style={{ color: '#1E1E2E', fontSize: 64 }}>⬡</span>
              <p style={{ color: '#333', fontSize: 13 }}>Selecciona un agente para inspeccionar</p>
            </div>
          ) : (
            <div>
              {/* User header */}
              <div style={{
                background: '#0D0D1A', border: '1px solid #1E1E2E', borderRadius: 8,
                padding: '20px 24px', marginBottom: 20,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h2 style={{ margin: 0, color: RANK_COLOR[selected.rank] ?? '#888', fontSize: 20 }}>
                      {selected.username}
                    </h2>
                    <StatusBadge user={selected} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
                    <span>{selected.email}</span>
                    <span>•</span>
                    <span style={{ color: RANK_COLOR[selected.rank] }}>{selected.rank}</span>
                    <span>•</span>
                    <span>{selected.points.toLocaleString()} pts</span>
                    <span>•</span>
                    <span>ELO {selected.elo}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#444' }}>
                    Registrado: {fmt(selected.createdAt)} · Última actividad: {fmt(selected.lastActiveAt)}
                  </div>
                  {selected.banReason && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#FF3333' }}>
                      Motivo ban: {selected.banReason}
                    </div>
                  )}
                  {selected.isIsolated && selected.isolatedUntil && (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#FF9800' }}>
                      Aislado hasta: {fmt(selected.isolatedUntil)}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {!selected.isAdmin && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                    <ActionBtn
                      label={selected.isBanned ? '↑ Levantar ban' : '⊘ Banear'}
                      color={selected.isBanned ? '#00FF41' : '#FF3333'}
                      onClick={() => setBanModal(true)}
                    />
                    <ActionBtn
                      label={selected.isIsolated ? '↑ Levantar aislamiento' : '◉ Aislar temp.'}
                      color={selected.isIsolated ? '#00FF41' : '#FF9800'}
                      onClick={() => setIsolateModal(true)}
                    />
                    <ActionBtn
                      label="⚑ Advertencia / Recompensa"
                      color="#2196F3"
                      onClick={() => setNotifyModal(true)}
                    />
                    <ActionBtn
                      label="± Ajustar puntos"
                      color="#B347EA"
                      onClick={() => setPointsModal(true)}
                    />
                    <ActionBtn
                      label="✕ Eliminar cuenta"
                      color="#FF3333''"
                      onClick={doDelete}
                      danger
                    />
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {(['info', 'activity', 'chat'] as const).map(tab => (
                  <button key={tab} onClick={() => switchTab(tab)} style={{
                    background: detailTab === tab ? '#111827' : 'transparent',
                    border: `1px solid ${detailTab === tab ? '#00FF41' : '#1E1E2E'}`,
                    color: detailTab === tab ? '#00FF41' : '#555',
                    padding: '6px 16px', cursor: 'pointer', borderRadius: '4px 4px 0 0',
                    fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    {tab === 'info' ? '⊙ Info' : tab === 'activity' ? '◈ Actividad' : '◎ Chats'}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ background: '#0D0D1A', border: '1px solid #1E1E2E', borderRadius: '0 8px 8px 8px', padding: 20 }}>
                {detailTab === 'info' && <InfoTab user={selected} />}
                {detailTab === 'activity' && (
                  loadingDetail
                    ? <p style={{ color: '#444', fontSize: 12 }}>Cargando actividad...</p>
                    : activity
                      ? <ActivityTab data={activity} onDeleteMsg={doDeleteMessage} />
                      : <p style={{ color: '#444', fontSize: 12 }}>Sin datos</p>
                )}
                {detailTab === 'chat' && (
                  loadingDetail
                    ? <p style={{ color: '#444', fontSize: 12 }}>Descifrado en curso...</p>
                    : <ChatTab messages={chats} userId={selected.id} banner={randomBanner} antiPhishing={randomAnti} />
                )}
              </div>
            </div>
          )}
        </main>}
        </>}
      </div>

      {/* ── Modals ── */}
      {banModal && (
        <Modal title={selected?.isBanned ? 'Levantar ban' : 'Banear usuario'} onClose={() => setBanModal(false)}>
          {!selected?.isBanned && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Motivo (opcional)</label>
              <input value={banReason} onChange={e => setBanReason(e.target.value)}
                placeholder="Conducta inapropiada, trampa, etc..."
                style={inputStyle} />
            </div>
          )}
          <p style={{ color: selected?.isBanned ? '#00FF41' : '#FF3333', fontSize: 13, marginBottom: 16 }}>
            {selected?.isBanned
              ? `¿Levantar el ban de ${selected.username}?`
              : `¿Banear a ${selected?.username}? No podrá iniciar sesión.`}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <ModalBtn label="Cancelar" onClick={() => setBanModal(false)} />
            <ModalBtn label="Confirmar" onClick={doBan} primary loading={actionLoading} />
          </div>
        </Modal>
      )}

      {isolateModal && (
        <Modal title={selected?.isIsolated ? 'Levantar aislamiento' : 'Aislar temporalmente'} onClose={() => setIsolateModal(false)}>
          {!selected?.isIsolated && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Duración (minutos)</label>
              <input type="number" value={isolateMinutes} min={1} max={43200}
                onChange={e => setIsolateMinutes(Number(e.target.value))}
                style={inputStyle} />
            </div>
          )}
          <p style={{ color: '#FF9800', fontSize: 13, marginBottom: 16 }}>
            {selected?.isIsolated
              ? `Levantar aislamiento de ${selected.username}`
              : `El usuario no podrá chatear ni unirse a partidas por ${isolateMinutes} min`}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <ModalBtn label="Cancelar" onClick={() => setIsolateModal(false)} />
            <ModalBtn label="Confirmar" onClick={doIsolate} primary loading={actionLoading} />
          </div>
        </Modal>
      )}

      {notifyModal && (
        <Modal title="Enviar notificación" onClose={() => setNotifyModal(false)}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Tipo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['WARNING', 'REWARD'] as const).map(t => (
                <button key={t} onClick={() => setNotifyType(t)} style={{
                  background: notifyType === t ? (t === 'WARNING' ? '#1A0A0A' : '#0A1A0A') : 'transparent',
                  border: `1px solid ${notifyType === t ? (t === 'WARNING' ? '#FF3333' : '#00FF41') : '#333'}`,
                  color: notifyType === t ? (t === 'WARNING' ? '#FF3333' : '#00FF41') : '#666',
                  padding: '4px 12px', cursor: 'pointer', borderRadius: 4, fontFamily: 'monospace', fontSize: 12,
                }}>
                  {t === 'WARNING' ? '⚑ Advertencia' : '★ Recompensa'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Título</label>
            <input value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)}
              placeholder="Título de la notificación..."
              style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>Mensaje</label>
            <textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)}
              placeholder="Detalle del aviso o recompensa..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <ModalBtn label="Cancelar" onClick={() => setNotifyModal(false)} />
            <ModalBtn label="Enviar" onClick={doNotify} primary loading={actionLoading} />
          </div>
        </Modal>
      )}

      {pointsModal && (
        <Modal title="Ajustar puntos" onClose={() => setPointsModal(false)}>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>
            Puntos actuales: <span style={{ color: '#B347EA' }}>{selected?.points.toLocaleString()}</span>
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>
              Delta (usa número negativo para quitar puntos)
            </label>
            <input type="number" value={pointsDelta}
              onChange={e => setPointsDelta(Number(e.target.value))}
              style={inputStyle} />
            {pointsDelta !== 0 && selected && (
              <p style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                Resultado: {Math.max(0, (selected.points + pointsDelta)).toLocaleString()} pts
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <ModalBtn label="Cancelar" onClick={() => setPointsModal(false)} />
            <ModalBtn label="Aplicar" onClick={doPoints} primary loading={actionLoading} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBtn({ label, color, onClick, danger }: { label: string; color: string; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? `${color}15` : 'transparent',
        border: `1px solid ${danger ? '#FF3333' : color}`,
        color: danger ? '#FF3333' : color,
        padding: '5px 10px', cursor: 'pointer', borderRadius: 4,
        fontFamily: 'monospace', fontSize: 11, textAlign: 'left',
        transition: 'background 0.1s',
      }}
    >
      {label}
    </button>
  );
}

function InfoTab({ user }: { user: AdminUser }) {
  const rows = [
    ['ID', user.id],
    ['Rank', user.rank],
    ['Puntos', user.points.toLocaleString()],
    ['ELO', String(user.elo)],
    ['Premium', user.isPremium ? 'Sí' : 'No'],
    ['Admin', user.isAdmin ? 'Sí' : 'No'],
    ['Baneado', user.isBanned ? `Sí — ${user.banReason ?? 'Sin motivo'}` : 'No'],
    ['Aislado', user.isIsolated ? `Sí${user.isolatedUntil ? ` hasta ${fmt(user.isolatedUntil)}` : ''}` : 'No'],
    ['Retos resueltos', String(user._count.challengeAttempts)],
    ['Mensajes chat', String(user._count.communityMessages)],
    ['Registro', fmt(user.createdAt)],
    ['Última actividad', fmt(user.lastActiveAt)],
  ];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '1px solid #111' }}>
            <td style={{ color: '#555', padding: '6px 12px 6px 0', width: 160 }}>{k}</td>
            <td style={{ color: '#C9D1D9', padding: '6px 0', fontFamily: 'monospace' }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActivityTab({ data, onDeleteMsg }: { data: ActivityData; onDeleteMsg: (id: string) => void }) {
  const [tab, setTab] = useState<'attempts' | 'chat' | 'elo' | 'admin'>('attempts');

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['attempts', 'chat', 'elo', 'admin'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? '#111' : 'transparent',
            border: `1px solid ${tab === t ? '#00FF41' : '#333'}`,
            color: tab === t ? '#00FF41' : '#555',
            padding: '4px 12px', cursor: 'pointer', borderRadius: 4,
            fontFamily: 'monospace', fontSize: 11,
          }}>
            {t === 'attempts' ? 'Retos' : t === 'chat' ? 'Chat público' : t === 'elo' ? 'ELO' : 'Acciones admin'}
          </button>
        ))}
      </div>

      {tab === 'attempts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.attempts.length === 0 && <p style={{ color: '#444', fontSize: 12 }}>Sin intentos registrados</p>}
          {data.attempts.map(a => (
            <div key={a.id} style={{ background: '#111', borderRadius: 4, padding: '8px 12px', fontSize: 12 }}>
              <span style={{ color: a.solved ? '#00FF41' : '#FF5722', marginRight: 8 }}>
                {a.solved ? '✓' : '✗'}
              </span>
              <span style={{ color: '#C9D1D9' }}>{a.challenge.title}</span>
              <span style={{ color: '#555', marginLeft: 8 }}>{a.challenge.branch} · {a.challenge.difficulty}</span>
              <span style={{ color: '#444', float: 'right' }}>{fmt(a.startedAt)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.communityMessages.length === 0 && <p style={{ color: '#444', fontSize: 12 }}>Sin mensajes</p>}
          {data.communityMessages.map(m => (
            <div key={m.id} style={{ background: '#111', borderRadius: 4, padding: '8px 12px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ color: '#888', marginRight: 8 }}>{fmt(m.createdAt)}</span>
                <span style={{ color: '#C9D1D9' }}>{m.content}</span>
              </div>
              <button onClick={() => onDeleteMsg(m.id)} style={{
                background: 'transparent', border: '1px solid #FF3333', color: '#FF3333',
                padding: '2px 6px', cursor: 'pointer', borderRadius: 3, fontSize: 10, marginLeft: 8, flexShrink: 0,
              }}>
                ✕ Borrar
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'elo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.eloHistory.length === 0 && <p style={{ color: '#444', fontSize: 12 }}>Sin historial ELO</p>}
          {data.eloHistory.map(e => (
            <div key={e.id} style={{ background: '#111', borderRadius: 4, padding: '8px 12px', fontSize: 12 }}>
              <span style={{ color: e.change >= 0 ? '#00FF41' : '#FF5722', marginRight: 8 }}>
                {e.change >= 0 ? '+' : ''}{e.change}
              </span>
              <span style={{ color: '#C9D1D9' }}>ELO: {e.elo}</span>
              <span style={{ color: '#555', marginLeft: 8 }}>— {e.reason}</span>
              <span style={{ color: '#444', float: 'right' }}>{fmt(e.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.adminLogs.length === 0 && <p style={{ color: '#444', fontSize: 12 }}>Sin acciones de admin</p>}
          {data.adminLogs.map(l => (
            <div key={l.id} style={{ background: '#111', borderRadius: 4, padding: '8px 12px', fontSize: 12 }}>
              <span style={{ color: '#FFB800', marginRight: 8 }}>{l.action}</span>
              <span style={{ color: '#888' }}>por {l.admin.username}</span>
              {l.reason && <span style={{ color: '#555', marginLeft: 8 }}>— {l.reason}</span>}
              <span style={{ color: '#444', float: 'right' }}>{fmt(l.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatTab({ messages, userId, banner, antiPhishing }: {
  messages: ChatMessage[];
  userId: string;
  banner: string;
  antiPhishing: string;
}) {
  return (
    <div>
      {/* Encrypted channel banner */}
      <div style={{
        background: '#0A1A0A', border: '1px solid #00FF4140',
        borderRadius: 6, padding: '10px 16px', marginBottom: 16,
        fontFamily: 'monospace', fontSize: 11,
      }}>
        <p style={{ color: '#00FF41', margin: '0 0 4px' }}>{banner}</p>
        <p style={{ color: '#FF9800', margin: 0 }}>{antiPhishing}</p>
      </div>

      {messages.length === 0 && (
        <p style={{ color: '#444', fontSize: 12 }}>No hay mensajes privados registrados para este agente.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.map(m => {
          const isMine = m.sender.id === userId;
          return (
            <div key={m.id} style={{
              display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                background: isMine ? '#0A1A2E' : '#0D1A0D',
                border: `1px solid ${isMine ? '#2196F330' : '#00FF4120'}`,
                borderRadius: 6, padding: '8px 12px', maxWidth: '70%',
              }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
                  <span style={{ color: RANK_COLOR[m.sender.rank] ?? '#888' }}>{m.sender.username}</span>
                  <span style={{ color: '#333' }}> → </span>
                  <span style={{ color: RANK_COLOR[m.recipient.rank] ?? '#888' }}>{m.recipient.username}</span>
                  <span style={{ color: '#333', marginLeft: 8 }}>{fmt(m.createdAt)}</span>
                </div>
                <p style={{ margin: 0, color: '#C9D1D9', fontSize: 13 }}>{m.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#0D0D1A', border: '1px solid #1E1E2E', borderRadius: 8,
        padding: 24, minWidth: 360, maxWidth: 480, width: '90%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#C9D1D9', fontFamily: 'monospace', fontSize: 14 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalBtn({ label, onClick, primary, loading }: { label: string; onClick: () => void; primary?: boolean; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      background: primary ? '#00FF4115' : 'transparent',
      border: `1px solid ${primary ? '#00FF41' : '#333'}`,
      color: primary ? '#00FF41' : '#666',
      padding: '6px 16px', cursor: loading ? 'wait' : 'pointer', borderRadius: 4,
      fontFamily: 'monospace', fontSize: 12,
    }}>
      {loading ? '...' : label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0A0A14', border: '1px solid #1E1E2E',
  color: '#C9D1D9', padding: '6px 10px', borderRadius: 4,
  fontFamily: 'monospace', fontSize: 12, outline: 'none',
  boxSizing: 'border-box',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
