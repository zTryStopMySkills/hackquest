export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Catalogue of all techniques — slug must match Challenge.slug in DB
const ALL_TECHNIQUES = [
  // WEB_HACKING
  { id: 1,  slug: 'sql-injection',           name: 'SQL Injection',              branch: 'WEB_HACKING',  severity: 'CRITICAL', cvss: 9.8, description: 'Inyección de código SQL para manipular bases de datos y extraer información sensible.' },
  { id: 2,  slug: 'xss-reflected',           name: 'XSS Reflected',              branch: 'WEB_HACKING',  severity: 'HIGH',     cvss: 7.4, description: 'Cross-site scripting reflejado en parámetros de URL, permite ejecutar JS en el navegador de la víctima.' },
  { id: 3,  slug: 'xss-stored',              name: 'XSS Stored',                 branch: 'WEB_HACKING',  severity: 'HIGH',     cvss: 8.1, description: 'XSS almacenado persistente en base de datos, afecta a todos los usuarios que visiten la página.' },
  { id: 4,  slug: 'csrf',                    name: 'CSRF',                       branch: 'WEB_HACKING',  severity: 'MEDIUM',   cvss: 6.5, description: 'Falsificación de solicitudes entre sitios, fuerza al navegador a ejecutar acciones no deseadas.' },
  { id: 5,  slug: 'path-traversal',          name: 'Path Traversal',             branch: 'WEB_HACKING',  severity: 'HIGH',     cvss: 7.5, description: 'Acceso a archivos fuera del directorio raíz del servidor web.' },
  { id: 6,  slug: 'ssrf',                    name: 'SSRF',                       branch: 'WEB_HACKING',  severity: 'HIGH',     cvss: 8.6, description: 'Server-Side Request Forgery: el servidor realiza solicitudes a recursos internos bajo control del atacante.' },
  { id: 7,  slug: 'xxe-injection',           name: 'XXE Injection',              branch: 'WEB_HACKING',  severity: 'HIGH',     cvss: 7.1, description: 'XML External Entity: explotación del parser XML para leer archivos o hacer SSRF.' },
  { id: 8,  slug: 'idor',                    name: 'IDOR',                       branch: 'WEB_HACKING',  severity: 'MEDIUM',   cvss: 6.5, description: 'Insecure Direct Object Reference: acceso a objetos sin validar autorización.' },
  { id: 9,  slug: 'jwt-forgery',             name: 'JWT Forgery',                branch: 'WEB_HACKING',  severity: 'CRITICAL', cvss: 9.1, description: 'Falsificación de tokens JWT mediante algoritmo none, RS256→HS256 o secretos débiles.' },
  { id: 10, slug: 'template-injection',      name: 'Template Injection',         branch: 'WEB_HACKING',  severity: 'CRITICAL', cvss: 9.3, description: 'Server-Side Template Injection: código arbitrario ejecutado en el motor de plantillas.' },
  { id: 11, slug: 'http-request-smuggling',  name: 'HTTP Request Smuggling',     branch: 'WEB_HACKING',  severity: 'HIGH',     cvss: 7.4, description: 'Desincronización entre frontend y backend para bypassear controles de seguridad.' },
  { id: 12, slug: 'oauth-bypass',            name: 'OAuth Bypass',               branch: 'WEB_HACKING',  severity: 'HIGH',     cvss: 8.0, description: 'Bypass de flujos OAuth2 para tomar cuentas ajenas o obtener tokens con más permisos.' },
  // NETWORKS
  { id: 13, slug: 'arp-spoofing',            name: 'ARP Spoofing',               branch: 'NETWORKS',     severity: 'HIGH',     cvss: 7.8, description: 'Envenenamiento de caché ARP para interceptar tráfico de red (MITM).' },
  { id: 14, slug: 'dns-poisoning',           name: 'DNS Poisoning',              branch: 'NETWORKS',     severity: 'HIGH',     cvss: 7.5, description: 'Corrupción de caché DNS para redirigir tráfico hacia servidores maliciosos.' },
  { id: 15, slug: 'port-scanning',           name: 'Port Scanning',              branch: 'NETWORKS',     severity: 'LOW',      cvss: 3.1, description: 'Enumeración de servicios activos y puertos abiertos en un host objetivo.' },
  { id: 16, slug: 'mitm-ssl-strip',          name: 'MITM con SSL Strip',         branch: 'NETWORKS',     severity: 'CRITICAL', cvss: 9.0, description: 'Downgrade de HTTPS a HTTP en un ataque MITM para capturar credenciales en claro.' },
  { id: 17, slug: 'smb-relay',              name: 'SMB Relay',                  branch: 'NETWORKS',     severity: 'CRITICAL', cvss: 9.1, description: 'Relay de autenticación NTLM sobre SMB para ejecutar comandos como el usuario capturado.' },
  { id: 18, slug: 'wifi-deauth',             name: 'Wifi Deauth',                branch: 'NETWORKS',     severity: 'MEDIUM',   cvss: 6.1, description: 'Inyección de frames 802.11 deauthentication para desconectar clientes WiFi.' },
  { id: 19, slug: 'bgp-hijacking',           name: 'BGP Hijacking',              branch: 'NETWORKS',     severity: 'CRITICAL', cvss: 9.6, description: 'Secuestro de prefijos BGP para redirigir tráfico de Internet a escala global.' },
  { id: 20, slug: 'vlan-hopping',            name: 'VLAN Hopping',               branch: 'NETWORKS',     severity: 'HIGH',     cvss: 7.8, description: 'Salto entre VLANs mediante switch spoofing o double tagging para acceder a segmentos aislados.' },
  // CRYPTOGRAPHY
  { id: 21, slug: 'padding-oracle',          name: 'Padding Oracle',             branch: 'CRYPTOGRAPHY', severity: 'HIGH',     cvss: 7.5, description: 'Ataque a cifrados de bloque con padding predecible para descifrar datos sin la clave.' },
  { id: 22, slug: 'bit-flipping',            name: 'Bit Flipping',               branch: 'CRYPTOGRAPHY', severity: 'MEDIUM',   cvss: 5.9, description: 'Modificación de bits en texto cifrado CTR/CBC para alterar el plaintext sin conocer la clave.' },
  { id: 23, slug: 'hash-length-extension',   name: 'Hash Length Extension',      branch: 'CRYPTOGRAPHY', severity: 'HIGH',     cvss: 7.2, description: 'Extensión de hashes inseguros (MD5/SHA1 sin HMAC) para forjar firmas.' },
  { id: 24, slug: 'rsa-low-exponent',        name: 'RSA Low Exponent',           branch: 'CRYPTOGRAPHY', severity: 'HIGH',     cvss: 7.4, description: 'Factorización RSA cuando el exponente público es demasiado pequeño.' },
  { id: 25, slug: 'timing-attack',           name: 'Timing Attack',              branch: 'CRYPTOGRAPHY', severity: 'MEDIUM',   cvss: 5.3, description: 'Medición de tiempos de respuesta para inferir claves secretas o datos privados.' },
  { id: 26, slug: 'cbc-iv-reuse',            name: 'CBC IV Reuse',               branch: 'CRYPTOGRAPHY', severity: 'HIGH',     cvss: 7.7, description: 'Reutilización de IV en modo CBC que permite distinguir plaintexts idénticos.' },
  // FORENSICS
  { id: 27, slug: 'steganografia-lsb',       name: 'Esteganografía LSB',         branch: 'FORENSICS',    severity: 'LOW',      cvss: 2.5, description: 'Datos ocultos en los bits menos significativos de imágenes o audio.' },
  { id: 28, slug: 'analisis-memoria',        name: 'Análisis de Memoria',        branch: 'FORENSICS',    severity: 'HIGH',     cvss: 7.0, description: 'Extracción de artefactos forenses de volcados de RAM: contraseñas, claves, procesos.' },
  { id: 29, slug: 'metadata-exif',           name: 'Metadata EXIF',              branch: 'FORENSICS',    severity: 'MEDIUM',   cvss: 5.1, description: 'Extracción de metadatos EXIF de imágenes: GPS, cámara, timestamps.' },
  { id: 30, slug: 'recuperacion-archivos',   name: 'Recuperación de Archivos',   branch: 'FORENSICS',    severity: 'MEDIUM',   cvss: 5.5, description: 'Recuperación de ficheros eliminados mediante análisis de filesystem y file carving.' },
  { id: 31, slug: 'log-analysis',            name: 'Log Analysis',               branch: 'FORENSICS',    severity: 'LOW',      cvss: 3.2, description: 'Análisis de logs del sistema para reconstruir la actividad del atacante.' },
  // SYSTEMS
  { id: 32, slug: 'buffer-overflow',         name: 'Buffer Overflow',            branch: 'SYSTEMS',      severity: 'CRITICAL', cvss: 9.8, description: 'Desbordamiento de buffer para sobrescribir el puntero de retorno y tomar control del flujo.' },
  { id: 33, slug: 'format-string',           name: 'Format String',              branch: 'SYSTEMS',      severity: 'CRITICAL', cvss: 9.2, description: 'Explotación de strings de formato no controlados para leer y escribir memoria arbitraria.' },
  { id: 34, slug: 'rop-chains',              name: 'ROP Chains',                 branch: 'SYSTEMS',      severity: 'CRITICAL', cvss: 9.5, description: 'Return-Oriented Programming para bypass de NX/DEP encadenando gadgets existentes.' },
  { id: 35, slug: 'privilege-escalation',    name: 'Privilege Escalation',       branch: 'SYSTEMS',      severity: 'HIGH',     cvss: 8.8, description: 'Elevación de privilegios en sistemas Linux/Windows mediante SUID, sudo, services.' },
  { id: 36, slug: 'heap-overflow',           name: 'Heap Overflow',              branch: 'SYSTEMS',      severity: 'CRITICAL', cvss: 9.1, description: 'Desbordamiento en el heap para corromper estructuras de gestión de memoria dinámica.' },
  { id: 37, slug: 'use-after-free',          name: 'UAF (Use-After-Free)',       branch: 'SYSTEMS',      severity: 'CRITICAL', cvss: 9.3, description: 'Acceso a memoria después de ser liberada para ejecutar código arbitrario.' },
  { id: 38, slug: 'kernel-exploits',         name: 'Kernel Exploits',            branch: 'SYSTEMS',      severity: 'CRITICAL', cvss: 9.9, description: 'Explotación de vulnerabilidades en el kernel del sistema operativo para ring-0.' },
];

const TOTAL = ALL_TECHNIQUES.length; // 38 definidas; 120 es el total con técnicas futuras

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Fetch user's pokedex entries (by technique slug via join)
  const entries = await prisma.pokedexEntry.findMany({
    where: { userId: session.userId },
    include: { technique: { select: { slug: true } } },
  });

  const unlockedSlugs = new Set(entries.map(e => e.technique.slug));

  const techniques = ALL_TECHNIQUES.map(t => ({
    ...t,
    unlocked: unlockedSlugs.has(t.slug),
  }));

  const unlockedCount = techniques.filter(t => t.unlocked).length;

  return NextResponse.json({ techniques, unlockedCount, total: 120 });
}
