/**
 * HackQuest — Seed script
 * Crea el usuario root admin si no existe y hace upsert de todos los challenges.
 * Uso: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { webHackingChallenges } from '../src/data/challenges/web-hacking';
import { networksChallenges } from '../src/data/challenges/networks';
import { cryptographyChallenges } from '../src/data/challenges/cryptography';
import { forensicsChallenges } from '../src/data/challenges/forensics';
import { systemsChallenges } from '../src/data/challenges/systems';
import { campaignChapter1 } from '../src/data/challenges/campaign-chapter1';

const prisma = new PrismaClient();

const ADMIN_USERNAME = '★ 𝕫𝕋𝕣𝕪𝕊𝕥𝕠𝕡𝕄𝕪𝕊𝕜𝕚𝕝𝕝★';
const ADMIN_EMAIL    = 'root@hackquest.internal';
const ADMIN_PASSWORD = '1n4zum411%';

// ---------------------------------------------------------------------------
// Helpers para mapear los string literals del front a los enum de Prisma
// ---------------------------------------------------------------------------

type PrismaBranch =
  | 'WEB_HACKING'
  | 'NETWORKS'
  | 'CRYPTOGRAPHY'
  | 'FORENSICS'
  | 'SYSTEMS'
  | 'CAMPAIGN';

type PrismaType = 'PUZZLE' | 'SANDBOX' | 'CAMPAIGN' | 'MULTIPLAYER';

function mapBranch(branch: string): PrismaBranch {
  const map: Record<string, PrismaBranch> = {
    CAMPAIGN: 'CAMPAIGN',
    WEB_HACKING: 'WEB_HACKING',
    NETWORK: 'NETWORKS',
    NETWORKS: 'NETWORKS',
    CRYPTOGRAPHY: 'CRYPTOGRAPHY',
    FORENSICS: 'FORENSICS',
    SYSTEMS: 'SYSTEMS',
  };
  const mapped = map[branch];
  if (!mapped) throw new Error(`Branch desconocida: ${branch}`);
  return mapped;
}

function mapType(type: string): PrismaType {
  const map: Record<string, PrismaType> = {
    CAMPAIGN: 'CAMPAIGN',
    PUZZLE: 'PUZZLE',
    SANDBOX: 'SANDBOX',
    MULTIPLAYER: 'MULTIPLAYER',
  };
  const mapped = map[type];
  if (!mapped) throw new Error(`ChallengeType desconocido: ${type}`);
  return mapped;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // -----------------------------------------------------------------------
  // 1. Admin user
  // -----------------------------------------------------------------------
  const existing = await prisma.user.findUnique({ where: { username: ADMIN_USERNAME } });

  if (existing) {
    console.log(`[seed] Admin "${ADMIN_USERNAME}" ya existe — actualizando isAdmin=true.`);
    await prisma.user.update({
      where: { id: existing.id },
      data:  { isAdmin: true, isPremium: true },
    });
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await prisma.user.create({
      data: {
        username:     ADMIN_USERNAME,
        email:        ADMIN_EMAIL,
        passwordHash,
        isAdmin:      true,
        isPremium:    true,
        rank:         'LEGEND',
        points:       999999,
        elo:          9999,
        eloState:     'ON_FIRE',
        profileTitle: 'THE_ONE',
        bannerType:   'THE_ONE_RED',
        skillBranches: {
          createMany: {
            data: [
              { branch: 'WEB_HACKING',  level: 99, xp: 999999 },
              { branch: 'NETWORKS',     level: 99, xp: 999999 },
              { branch: 'CRYPTOGRAPHY', level: 99, xp: 999999 },
              { branch: 'FORENSICS',    level: 99, xp: 999999 },
              { branch: 'SYSTEMS',      level: 99, xp: 999999 },
            ],
          },
        },
      },
    });

    console.log(`[seed] ✅ Admin creado: "${admin.username}" (id: ${admin.id})`);
    console.log(`[seed]    Email    : ${ADMIN_EMAIL}`);
    console.log(`[seed]    Password : ${ADMIN_PASSWORD}`);
  }

  // -----------------------------------------------------------------------
  // 2. Challenges — upsert de todas las ramas
  // -----------------------------------------------------------------------
  const allChallenges = [
    ...webHackingChallenges,
    ...networksChallenges,
    ...cryptographyChallenges,
    ...forensicsChallenges,
    ...systemsChallenges,
    ...campaignChapter1.challenges,
  ];

  console.log(`[seed] Procesando ${allChallenges.length} challenges...`);

  for (const ch of allChallenges) {
    await prisma.challenge.upsert({
      where: { slug: ch.slug },
      create: {
        slug:             ch.slug,
        title:            ch.title,
        description:      ch.description,
        branch:           mapBranch(ch.branch),
        difficulty:       ch.difficulty,
        type:             mapType(ch.type),
        timeLimitSeconds: ch.timeLimitSeconds,
        basePoints:       ch.basePoints,
        phases:           ch.phases as any,
        flag:             ch.flag,
        briefing:         ch.briefing,
        debriefing:       ch.debriefing,
        hints:            (ch.hints ?? []) as any,
        requiredRank:     ch.requiredRank,
        isFree:           ch.isFree,
        orderInBranch:    ch.orderInBranch,
      },
      update: {
        title: ch.title,
        flag:  ch.flag,
      },
    });
    console.log(`[seed]   ✓ ${ch.slug}`);
  }

  console.log(`[seed] ✅ ${allChallenges.length} challenges procesados correctamente.`);

  // -----------------------------------------------------------------------
  // 3. DuelScenarios
  // -----------------------------------------------------------------------
  const duelScenarios = [
    // WEB targets — JUNIOR
    {
      slug: 'corpsite-v2',
      title: 'CorpSite v2.3',
      description: 'Portal corporativo de MegaCorp Industries. SSL activo, WAF básico.',
      targetType: 'web',
      requiredRank: 'JUNIOR',
      briefing: 'Objetivo: comprometer el portal web de MegaCorp Industries. Inteligencia previa indica credenciales débiles en /admin y un endpoint de API sin parchear.',
      flag: 'HACKQUEST{corpsite_pwned_2024}',
      hints: ['Intenta enumerar directorios con gobuster', 'El panel /admin usa autenticación básica', 'Busca parámetros GET vulnerables a SQLi'],
      phases: [
        { id: 0, title: 'Reconocimiento', description: 'Escanea puertos y servicios del objetivo.', expectedCommands: ['nmap'] },
        { id: 1, title: 'Enumeración web', description: 'Descubre rutas y endpoints ocultos.', expectedCommands: ['gobuster', 'dirb', 'ffuf'] },
        { id: 2, title: 'Explotación', description: 'Explota la vulnerabilidad SQLi en el endpoint de login.', expectedCommands: ['sqlmap', 'exploit'] },
        { id: 3, title: 'Exfiltración', description: 'Extrae la flag del servidor comprometido.', expectedCommands: ['cat', 'ls', 'find'] },
      ],
    },
    {
      slug: 'bankportal-alpha',
      title: 'BankPortal Alpha',
      description: 'Entorno de staging del sistema bancario de FinSecure Ltd.',
      targetType: 'web',
      requiredRank: 'PENTESTER',
      briefing: 'Sistema de staging de FinSecure Ltd expuesto accidentalmente. Contiene datos ficticios pero el sistema de autenticación es el mismo que producción.',
      flag: 'HACKQUEST{bank_alpha_breach}',
      hints: ['JWT con algoritmo HS256 y secret débil', 'Prueba IDOR en /api/accounts/{id}', 'El endpoint /api/transfer no valida el origen'],
      phases: [
        { id: 0, title: 'OSINT', description: 'Recopila información sobre el target desde fuentes abiertas.', expectedCommands: ['nmap', 'whatweb'] },
        { id: 1, title: 'Bypass de autenticación', description: 'Rompe el mecanismo JWT para acceder como admin.', expectedCommands: ['jwt', 'exploit', 'curl'] },
        { id: 2, title: 'IDOR', description: 'Accede a cuentas de otros usuarios mediante IDOR.', expectedCommands: ['curl', 'exploit', 'burp'] },
        { id: 3, title: 'Transferencia no autorizada', description: 'Explota el endpoint de transferencia para obtener la flag.', expectedCommands: ['exploit', 'curl', 'flag'] },
      ],
    },
    // IP targets — JUNIOR
    {
      slug: 'rogue-ap-192',
      title: '192.168.10.5 — Rogue AP',
      description: 'Punto de acceso no autorizado detectado en la red interna de TechStart.',
      targetType: 'ip',
      requiredRank: 'JUNIOR',
      briefing: 'AP no autorizado conectado a la red interna de TechStart Corp. Firmware desactualizado con vulnerabilidades conocidas. Credenciales de administración por defecto posiblemente activas.',
      flag: 'HACKQUEST{rogue_ap_controlled}',
      hints: ['Las credenciales por defecto son admin:admin', 'El firmware tiene CVE-2021-XXXX publicado', 'Busca el panel de administración en el puerto 8080'],
      phases: [
        { id: 0, title: 'Descubrimiento', description: 'Localiza el dispositivo y sus puertos abiertos.', expectedCommands: ['nmap'] },
        { id: 1, title: 'Identificación', description: 'Identifica el firmware y busca vulnerabilidades conocidas.', expectedCommands: ['nmap', 'searchsploit'] },
        { id: 2, title: 'Acceso inicial', description: 'Accede al panel de administración.', expectedCommands: ['exploit', 'curl', 'hydra'] },
        { id: 3, title: 'Control total', description: 'Obtén control total del dispositivo y extrae la flag.', expectedCommands: ['exploit', 'cat', 'shell'] },
      ],
    },
    {
      slug: 'scada-node-10',
      title: '10.0.0.1 — Nodo SCADA',
      description: 'Controlador industrial Siemens SIMATIC S7 en planta química ficticia.',
      targetType: 'ip',
      requiredRank: 'RED_TEAM',
      briefing: 'Nodo SCADA expuesto en red segmentada de Chemex Industries. Sistema de control de válvulas de presión. El acceso no autorizado podría simular un incidente industrial.',
      flag: 'HACKQUEST{scada_critical_access}',
      hints: ['Protocolo Modbus en puerto 502', 'El PLC responde a comandos sin autenticación', 'Usa módulos de metasploit específicos para SCADA'],
      phases: [
        { id: 0, title: 'Escaneo industrial', description: 'Identifica protocolos industriales activos.', expectedCommands: ['nmap', 'plcscan'] },
        { id: 1, title: 'Enumeración Modbus', description: 'Enumera registros y bobinas del PLC.', expectedCommands: ['modbus', 'exploit', 'msfconsole'] },
        { id: 2, title: 'Lectura de registros', description: 'Lee los valores de configuración del sistema.', expectedCommands: ['read', 'modbus', 'exploit'] },
        { id: 3, title: 'Escritura de control', description: 'Escribe en los registros de control para obtener la flag.', expectedCommands: ['write', 'exploit', 'flag'] },
      ],
    },
    // BASE targets — PENTESTER / ELITE
    {
      slug: 'operation-nightfall',
      title: 'Operation Nightfall HQ',
      description: 'Cuartel general de operaciones de GhostNet. Red interna con múltiples segmentos.',
      targetType: 'base',
      requiredRank: 'PENTESTER',
      briefing: 'HQ de la operación Nightfall. Tres segmentos de red: DMZ, interna y clasificada. Objetivo: obtener acceso al segmento clasificado donde se almacena la flag operacional.',
      flag: 'HACKQUEST{nightfall_hq_breached}',
      hints: ['El pivoting es clave — comprometer la DMZ primero', 'Hay un servidor SMB con credenciales débiles en la red interna', 'El segmento clasificado usa autenticación por certificado'],
      phases: [
        { id: 0, title: 'Brecha DMZ', description: 'Compromete el servidor web en la DMZ.', expectedCommands: ['nmap', 'exploit', 'gobuster'] },
        { id: 1, title: 'Pivoting', description: 'Usa el servidor comprometido para acceder a la red interna.', expectedCommands: ['ssh', 'pivot', 'route'] },
        { id: 2, title: 'Movimiento lateral', description: 'Compromete el servidor SMB con credenciales débiles.', expectedCommands: ['smb', 'exploit', 'impacket'] },
        { id: 3, title: 'Acceso clasificado', description: 'Escala al segmento clasificado y extrae la flag.', expectedCommands: ['exploit', 'escalate', 'cat'] },
      ],
    },
    {
      slug: 'quantumvault-cold',
      title: 'QuantumVault Cold Storage',
      description: 'Infraestructura de almacenamiento cripto de QuantumVault Inc. Air-gapped teórico.',
      targetType: 'base',
      requiredRank: 'ELITE_HACKER',
      briefing: 'Sistema de cold storage de QuantumVault Inc. Supuestamente air-gapped pero con un canal de exfiltración covert descubierto por nuestros analistas. Múltiples capas de seguridad.',
      flag: 'HACKQUEST{quantumvault_keys_exfil}',
      hints: ['El canal covert usa DNS tunneling', 'El HSM tiene un bypass de mantenimiento en el puerto 9999', 'La clave de cifrado se genera con semilla temporal predecible'],
      phases: [
        { id: 0, title: 'Canal covert', description: 'Establece comunicación a través del canal DNS covert.', expectedCommands: ['dns', 'tunnel', 'iodine'] },
        { id: 1, title: 'Bypass HSM', description: 'Explota el puerto de mantenimiento del HSM.', expectedCommands: ['exploit', 'nc', 'socat'] },
        { id: 2, title: 'Predicción de semilla', description: 'Predice la semilla temporal y genera las claves.', expectedCommands: ['python', 'exploit', 'keygen'] },
        { id: 3, title: 'Exfiltración', description: 'Exfiltra las claves y obtén la flag.', expectedCommands: ['exfil', 'dns', 'flag'] },
      ],
    },
  ];

  for (const s of duelScenarios) {
    await (prisma as any).duelScenario.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        title: s.title,
        description: s.description,
        targetType: s.targetType,
        requiredRank: s.requiredRank as any,
        briefing: s.briefing,
        flag: s.flag,
        hints: s.hints,
        phases: s.phases,
      },
      update: {
        title: s.title,
        flag: s.flag,
      },
    });
    console.log(`[seed]   ✓ duel:${s.slug}`);
  }
  console.log(`[seed] ✅ ${duelScenarios.length} DuelScenarios procesados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
