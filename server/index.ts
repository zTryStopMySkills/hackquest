/**
 * HackQuest — Socket.IO server
 * Run separately: npx tsx server/index.ts
 * Handles real-time matchmaking and match progress broadcasts.
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'hackquest-dev-secret-change-in-production';
const PORT = Number(process.env.SOCKET_PORT ?? 3001);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.NEXTAUTH_URL || 'http://localhost:3000', credentials: true },
});

// Map userId → socket.id
const userSockets = new Map<string, string>();
// Map matchId → Set<userId>
const matchRooms = new Map<string, Set<string>>();
// Map duelMatchId → Set<userId> (spectators included)
const duelRooms = new Map<string, Set<string>>();
// Map duelMatchId → active sabotage effects per userId
const activeSabotages = new Map<string, Map<string, { type: string; expiresAt: number }>>();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('No autenticado'));
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    socket.data.userId   = payload.userId;
    socket.data.username = payload.username;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const { userId, username } = socket.data as { userId: string; username: string };
  userSockets.set(userId, socket.id);
  console.log(`[socket] ${username} conectado (${socket.id})`);

  // ── Join a match room ────────────────────────────────────────────────────
  socket.on('match:join', async ({ matchId }: { matchId: string }) => {
    socket.join(matchId);
    if (!matchRooms.has(matchId)) matchRooms.set(matchId, new Set());
    matchRooms.get(matchId)!.add(userId);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: { include: { user: { select: { username: true, rank: true, elo: true } } } },
        challenge: { select: { title: true, difficulty: true, timeLimitSeconds: true } },
      },
    });

    if (match) {
      io.to(matchId).emit('match:state', {
        matchId,
        status: match.status,
        players: match.players.map(p => ({
          userId: p.userId,
          username: p.user.username,
          rank: p.user.rank,
          progress: p.progress,
          solved: p.solved,
        })),
        challenge: match.challenge,
      });
    }
  });

  // ── Player progress update ───────────────────────────────────────────────
  socket.on('match:progress', async ({ matchId, progress, phase }: { matchId: string; progress: number; phase: number }) => {
    await prisma.matchPlayer.updateMany({
      where: { matchId, userId },
      data: { progress },
    });
    socket.to(matchId).emit('match:player_update', { userId, username, progress, phase });
  });

  // ── Match solved ─────────────────────────────────────────────────────────
  socket.on('match:solved', async ({ matchId }: { matchId: string }) => {
    const room = matchRooms.get(matchId);
    io.to(matchId).emit('match:winner', { userId, username });

    // Mark match finished
    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'FINISHED', finishedAt: new Date() },
    });
  });

  // ── Leave match ──────────────────────────────────────────────────────────
  socket.on('match:leave', ({ matchId }: { matchId: string }) => {
    socket.leave(matchId);
    matchRooms.get(matchId)?.delete(userId);
    socket.to(matchId).emit('match:player_left', { userId, username });
  });

  // ── Duel: join room ──────────────────────────────────────────────────────
  socket.on('duel:join', async ({ matchId }: { matchId: string }) => {
    socket.join(`duel:${matchId}`);
    if (!duelRooms.has(matchId)) duelRooms.set(matchId, new Set());
    duelRooms.get(matchId)!.add(userId);

    const duel = await prisma.duelMatch.findUnique({
      where: { matchId },
      include: {
        match: { select: { status: true, timeLimit: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (duel) {
      socket.emit('duel:state', { matchId, duel });
    }
  });

  // ── Duel: phase completed ─────────────────────────────────────────────────
  socket.on('duel:phase_complete', async ({
    matchId,
    phase,
    commandLog,
  }: { matchId: string; phase: number; commandLog: string[] }) => {
    const duel = await prisma.duelMatch.findUnique({ where: { matchId } });
    if (!duel) return;

    const isA = duel.attackerAId === userId;
    const isB = duel.attackerBId === userId;
    if (!isA && !isB) return;

    await prisma.duelEvent.create({
      data: {
        duelMatchId: duel.id,
        actorId: userId,
        type: 'PHASE_COMPLETE',
        payload: { phase, commandLog },
      },
    });

    // Narrative intel line to opponent
    const narratives = [
      `[INTERCEPT] Agente ${username} ha comprometido la Fase ${phase + 1} del objetivo.`,
      `[ALERT] Actividad sospechosa detectada — ${username} avanza al siguiente vector.`,
      `[INTEL] Fase ${phase + 1} neutralizada por ${username}. Contramedidas insuficientes.`,
      `[LOG] ${username}: acceso obtenido en Fase ${phase + 1}. Escalando privilegios...`,
    ];
    const message = narratives[phase % narratives.length];

    io.to(`duel:${matchId}`).emit('duel:intel', {
      actorId: userId,
      phase,
      message,
      timestamp: Date.now(),
    });

    io.to(`duel:${matchId}`).emit('duel:opponent_progress', {
      userId,
      phase,
      completedAt: new Date().toISOString(),
    });
  });

  // ── Duel: sabotage ────────────────────────────────────────────────────────
  socket.on('duel:sabotage', async ({
    matchId,
    type,
  }: { matchId: string; type: string }) => {
    const duel = await prisma.duelMatch.findUnique({ where: { matchId } });
    if (!duel) return;

    const isA = duel.attackerAId === userId;
    const isB = duel.attackerBId === userId;
    if (!isA && !isB) return;

    const charges = isA ? duel.sabotagesA : duel.sabotagesB;
    if (charges <= 0) {
      socket.emit('duel:error', { message: 'Sin cargas de sabotaje disponibles' });
      return;
    }

    // Deduct charge
    await prisma.duelMatch.update({
      where: { id: duel.id },
      data: isA ? { sabotagesA: duel.sabotagesA - 1 } : { sabotagesB: duel.sabotagesB - 1 },
    });

    await prisma.duelEvent.create({
      data: {
        duelMatchId: duel.id,
        actorId: userId,
        type: 'SABOTAGE_USED',
        payload: { sabotageType: type },
      },
    });

    // Determine duration
    const durations: Record<string, number> = {
      NOISE_INJECTION: 8000,
      HONEYPOT_TRIGGER: 0,
      IDS_ALERT: 0,
      INTEL_BLACKOUT: 30000,
    };

    const targetId = isA ? duel.attackerBId : duel.attackerAId;
    const targetSocketId = userSockets.get(targetId);

    if (targetSocketId) {
      io.to(targetSocketId).emit('duel:sabotage_incoming', {
        type,
        duration: durations[type] ?? 0,
        fromUsername: username,
      });
    }

    // Track active effects for honeypot
    if (type === 'HONEYPOT_TRIGGER') {
      if (!activeSabotages.has(matchId)) activeSabotages.set(matchId, new Map());
      activeSabotages.get(matchId)!.set(targetId, {
        type: 'HONEYPOT_TRIGGER',
        expiresAt: Date.now() + 60000,
      });
    }

    socket.emit('duel:sabotage_ack', { type, remainingCharges: charges - 1 });
    io.to(`duel:${matchId}`).emit('duel:intel', {
      actorId: userId,
      message: `[WARFARE] ${username} lanzó ${type.replace(/_/g, ' ')} contra el objetivo enemigo.`,
      timestamp: Date.now(),
    });
  });

  // ── Duel: leave ───────────────────────────────────────────────────────────
  socket.on('duel:leave', ({ matchId }: { matchId: string }) => {
    socket.leave(`duel:${matchId}`);
    duelRooms.get(matchId)?.delete(userId);
  });

  socket.on('disconnect', () => {
    userSockets.delete(userId);
    console.log(`[socket] ${username} desconectado`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[socket] Servidor Socket.IO escuchando en puerto ${PORT}`);
});
