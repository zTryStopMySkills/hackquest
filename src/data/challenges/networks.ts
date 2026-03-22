/**
 * HackQuest – Networks Branch
 * 4 challenges (progressive difficulty)
 *
 * All briefings/debriefings are in Spanish. Military/spy narrative tone.
 * Flags follow the pattern HACKQUEST{...}.
 */

import type { ChallengeData } from "@/types/game";

// Branch 'NETWORKS' and 'SYSTEMS' are valid Prisma enum values. ChallengeBranch is deprecated.
export const networksChallenges = [
  // ================================================================
  // 1. Port Scanning
  // ================================================================
  {
    slug: "net-port-scan",
    title: "Port Scanning",
    description:
      "Realiza un escaneo completo de puertos sobre el objetivo para identificar servicios expuestos y vectores de ataque potenciales.",
    branch: "NETWORKS",
    difficulty: "EASY",
    type: "PUZZLE",
    timeLimitSeconds: 600,
    basePoints: 100,
    requiredRank: "SCRIPT_KIDDIE",
    isFree: true,
    orderInBranch: 1,

    briefing: `
OPERACIÓN: OPEN PORTS
CLASIFICACIÓN: RESTRINGIDA
AGENTE: TÚ
OBJETIVO: Servidor perimetral 192.168.10.5

Inteligencia ha localizado un servidor de la red interna de KRAKON Corp expuesto en la DMZ.
Necesitamos saber exactamente qué servicios están corriendo antes de proceder.

Tu misión: ejecuta un escaneo silencioso de puertos sobre el objetivo.
Identifica todos los puertos TCP abiertos, banners de servicios y sistema operativo.
Un análisis incompleto comprometerá las fases posteriores de la operación.

El tiempo corre. Actúa con precisión.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – OPEN PORTS

TÉCNICA UTILIZADA: Port Scanning (Escaneo de Puertos)

El escaneo de puertos es la técnica fundamental de reconocimiento activo.
Permite identificar qué servicios están disponibles en un host remoto enviando paquetes TCP/UDP y analizando las respuestas.

TIPOS DE ESCANEO:
- SYN Scan (Stealth): Envía SYN, recibe SYN-ACK sin completar el handshake. Sigiloso.
- Connect Scan: Completa el handshake TCP. Ruidoso pero fiable.
- UDP Scan: Más lento, detecta servicios UDP como DNS y SNMP.
- Version Detection (-sV): Obtiene versiones exactas de los servicios.

HERRAMIENTAS CLAVE:
  nmap -sS -sV -O -T4 192.168.10.5
  nmap -p- --open -sV 192.168.10.5

IMPACTO REAL:
- Identificación de servicios vulnerables sin parchear.
- Descubrimiento de puertos de administración expuestos.
- Fingerprinting del SO para ataques dirigidos.

DEFENSA:
1. Usar firewall para filtrar puertos no necesarios.
2. Cambiar puertos por defecto de servicios críticos.
3. Implementar IDS/IPS para detectar escaneos anómalos.
4. Segmentar la red con VLANs.
    `.trim(),

    flag: "HACKQUEST{p0rt_sc4nn3r_pr0}",

    phases: [
      {
        name: "Escaneo de puertos comunes",
        description:
          "Realiza un escaneo inicial de los 1000 puertos más comunes para obtener una visión rápida del objetivo.",
        expectedCommands: ["nmap -sV 192.168.10.5", "nmap -p 1-1000 192.168.10.5"],
        hints: [
          "Usa nmap para escanear el objetivo. El flag -sV detecta versiones de servicios.",
          "Prueba: nmap -sV 192.168.10.5. Esto escaneará los puertos más comunes.",
          "Comando exacto: nmap -sV -p 1-1000 192.168.10.5",
        ],
      },
      {
        name: "Escaneo completo de puertos",
        description:
          "Amplía el escaneo a todos los 65535 puertos para no perder ningún servicio oculto.",
        expectedCommands: ["nmap -p- 192.168.10.5", "nmap -p 1-65535 192.168.10.5"],
        hints: [
          "Los administradores a veces mueven servicios a puertos altos. Escanea el rango completo.",
          "Usa el flag -p- para escanear todos los puertos: nmap -p- 192.168.10.5",
          "Comando: nmap -p- --open -T4 192.168.10.5",
        ],
      },
      {
        name: "Detección de sistema operativo",
        description:
          "Determina el sistema operativo del objetivo mediante fingerprinting para planificar el vector de ataque.",
        expectedCommands: ["nmap -O 192.168.10.5", "nmap -A 192.168.10.5"],
        hints: [
          "Nmap puede inferir el SO analizando las respuestas TCP/IP.",
          "Usa el flag -O para OS detection. Requiere privilegios root.",
          "Comando completo: nmap -sS -sV -O -A 192.168.10.5",
        ],
      },
    ],
  },

  // ================================================================
  // 2. Sniffing Básico
  // ================================================================
  {
    slug: "net-sniffing",
    title: "Sniffing Básico",
    description:
      "Captura tráfico de red no cifrado en la LAN para interceptar credenciales transmitidas en claro.",
    branch: "NETWORKS",
    difficulty: "EASY",
    type: "PUZZLE",
    timeLimitSeconds: 720,
    basePoints: 120,
    requiredRank: "JUNIOR",
    isFree: true,
    orderInBranch: 2,

    briefing: `
OPERACIÓN: SILENT LISTENER
CLASIFICACIÓN: CONFIDENCIAL
AGENTE: TÚ
OBJETIVO: Red LAN corporativa 10.0.0.0/24

Has conseguido acceso físico a la red interna de VORTEX Labs mediante un adaptador de red.
Inteligencia indica que algún servicio legacy todavía transmite credenciales en texto plano.

Tu misión: coloca la interfaz de red en modo promiscuo y captura el tráfico de la red.
Filtra los paquetes que contengan credenciales. El login de un técnico de mantenimiento
podría estar pasando por este segmento ahora mismo.

No interactúes. No inyectes. Solo escucha y captura.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – SILENT LISTENER

TÉCNICA UTILIZADA: Packet Sniffing (Captura de Paquetes)

El sniffing de paquetes consiste en capturar el tráfico de red que pasa por una interfaz.
En redes con protocolos legacy sin cifrado (FTP, Telnet, HTTP básico), las credenciales
se transmiten en texto plano y son visibles en cualquier captura.

HERRAMIENTAS CLAVE:
  tcpdump -i eth0 -w captura.pcap
  wireshark captura.pcap
  tcpdump -i eth0 port 21 -A   (FTP en claro)
  tcpdump -i eth0 port 23 -A   (Telnet en claro)

FILTROS ÚTILES EN WIRESHARK:
  ftp.request.command == "PASS"
  telnet
  http.authbasic

IMPACTO REAL:
- Robo de credenciales FTP/Telnet/HTTP.
- Interceptación de tokens de sesión no cifrados.
- Exfiltración de datos sensibles en tránsito.

DEFENSA:
1. Reemplazar FTP por SFTP/FTPS, Telnet por SSH.
2. Cifrar todo el tráfico con TLS 1.2+.
3. Segmentar la red con switches gestionados (vs hubs).
4. Usar 802.1X para control de acceso a la red.
    `.trim(),

    flag: "HACKQUEST{p4ck3t_sn1ff3d}",

    phases: [
      {
        name: "Activar modo promiscuo",
        description:
          "Configura la interfaz de red en modo promiscuo para capturar todo el tráfico del segmento.",
        expectedCommands: ["tcpdump -i eth0", "ip link set eth0 promisc on"],
        hints: [
          "En modo promiscuo, la NIC captura todos los paquetes, no solo los dirigidos a tu MAC.",
          "Usa tcpdump con -i para especificar la interfaz: tcpdump -i eth0",
          "Activa modo promiscuo: ip link set eth0 promisc on && tcpdump -i eth0",
        ],
      },
      {
        name: "Capturar tráfico FTP",
        description:
          "Filtra el tráfico del puerto 21 para interceptar las credenciales FTP en texto plano.",
        expectedCommands: ["tcpdump -i eth0 port 21 -A", "tcpdump -i eth0 tcp port 21"],
        hints: [
          "FTP usa el puerto 21 para control y transmite contraseñas en texto plano.",
          "Filtra por puerto: tcpdump -i eth0 port 21",
          "Para ver el contenido en ASCII: tcpdump -i eth0 port 21 -A",
        ],
      },
      {
        name: "Extraer credenciales",
        description:
          "Analiza los paquetes capturados para extraer el usuario y contraseña del técnico.",
        expectedCommands: ["wireshark captura.pcap", "strings captura.pcap | grep PASS"],
        hints: [
          "Las credenciales FTP aparecen en paquetes USER y PASS secuenciales.",
          "Guarda la captura: tcpdump -i eth0 port 21 -w captura.pcap y ábrela en Wireshark.",
          "Filtra en Wireshark: ftp.request.command == 'PASS' para ver las contraseñas.",
        ],
      },
    ],
  },

  // ================================================================
  // 3. ARP Spoofing
  // ================================================================
  {
    slug: "net-arp-spoof",
    title: "ARP Spoofing",
    description:
      "Envenena la caché ARP de los dispositivos en la LAN para redirigir su tráfico a través de tu máquina como intermediario.",
    branch: "NETWORKS",
    difficulty: "MEDIUM",
    type: "PUZZLE",
    timeLimitSeconds: 900,
    basePoints: 200,
    requiredRank: "JUNIOR",
    isFree: false,
    orderInBranch: 3,

    briefing: `
OPERACIÓN: POISON TABLE
CLASIFICACIÓN: SECRETO
AGENTE: TÚ
OBJETIVO: Red LAN 10.0.1.0/24, Gateway: 10.0.1.1

Estás dentro de la red interna de HEXAGON Systems.
El CFO de la empresa (10.0.1.45) va a realizar una transferencia bancaria
a través del portal web interno en los próximos 20 minutos.

Tu misión: envenena la tabla ARP del CFO y del gateway para posicionarte como
intermediario (Man-in-the-Middle). Intercepta la sesión y extrae el token
de autorización de la transferencia. Ese token es tu objetivo.

Actúa rápido. El sistema de monitoreo detecta anomalías cada 30 minutos.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – POISON TABLE

TÉCNICA UTILIZADA: ARP Spoofing / ARP Poisoning

ARP (Address Resolution Protocol) es un protocolo sin autenticación que mapea
direcciones IP a direcciones MAC. Al enviar respuestas ARP falsas, se pueden
modificar las cachés ARP de los dispositivos objetivo para redirigir su tráfico.

MECÁNICA DEL ATAQUE:
1. Enviar ARP reply falso al CFO: "La MAC del gateway es MI_MAC"
2. Enviar ARP reply falso al gateway: "La MAC del CFO es MI_MAC"
3. El tráfico del CFO fluye: CFO → ATACANTE → GATEWAY (MitM establecido)
4. Activar IP forwarding para no interrumpir la comunicación.

HERRAMIENTAS CLAVE:
  arpspoof -i eth0 -t 10.0.1.45 10.0.1.1   (envenenar víctima)
  arpspoof -i eth0 -t 10.0.1.1 10.0.1.45   (envenenar gateway)
  echo 1 > /proc/sys/net/ipv4/ip_forward    (activar reenvío)
  ettercap -T -M arp:remote /10.0.1.45/ /10.0.1.1/

IMPACTO REAL:
- Interceptación de sesiones HTTP/HTTPS (con SSLstrip).
- Robo de credenciales en tránsito.
- Inyección de contenido malicioso en páginas web.

DEFENSA:
1. Usar ARP estático en dispositivos críticos.
2. Implementar Dynamic ARP Inspection (DAI) en switches gestionados.
3. Cifrar todo el tráfico con TLS (mitiga la intercepción).
4. Segmentar la red con VLANs y 802.1X.
    `.trim(),

    flag: "HACKQUEST{4rp_t4bl3_p01s0n3d}",

    phases: [
      {
        name: "Descubrimiento de hosts",
        description:
          "Identifica los hosts activos en la LAN, especialmente la IP del objetivo y el gateway.",
        expectedCommands: ["arp-scan --localnet", "nmap -sn 10.0.1.0/24"],
        hints: [
          "Necesitas conocer las IPs de la víctima y el gateway antes de envenenar.",
          "Usa arp-scan para descubrir hosts en la LAN: arp-scan --localnet",
          "Alternativa con nmap: nmap -sn 10.0.1.0/24 para ping sweep.",
        ],
      },
      {
        name: "Envenenamiento ARP bidireccional",
        description:
          "Envía respuestas ARP falsas tanto a la víctima como al gateway para posicionarte como intermediario.",
        expectedCommands: [
          "arpspoof -i eth0 -t 10.0.1.45 10.0.1.1",
          "arpspoof -i eth0 -t 10.0.1.1 10.0.1.45",
        ],
        hints: [
          "El envenenamiento debe ser bidireccional: envenenar tanto la víctima como el gateway.",
          "arpspoof -i eth0 -t VÍCTIMA GATEWAY (en una terminal)",
          "En otra terminal: arpspoof -i eth0 -t GATEWAY VÍCTIMA. Activa IP forwarding.",
        ],
      },
      {
        name: "Interceptación del token",
        description:
          "Captura el tráfico que fluye a través de tu máquina y extrae el token de autorización de la transferencia.",
        expectedCommands: [
          "tcpdump -i eth0 host 10.0.1.45 -A",
          "ettercap -T -M arp:remote /10.0.1.45/ /10.0.1.1/",
        ],
        hints: [
          "Con el MitM establecido, todo el tráfico de la víctima pasa por ti. Captúralo.",
          "Usa tcpdump para interceptar: tcpdump -i eth0 host 10.0.1.45 -A",
          "Ettercap automatiza el proceso: ettercap -T -M arp:remote /10.0.1.45/ /10.0.1.1/",
        ],
      },
    ],
  },

  // ================================================================
  // 4. Man in the Middle
  // ================================================================
  {
    slug: "net-mitm",
    title: "Man in the Middle",
    description:
      "Ejecuta un ataque Man-in-the-Middle completo combinando ARP spoofing, SSL stripping y captura de credenciales HTTPS.",
    branch: "NETWORKS",
    difficulty: "HARD",
    type: "PUZZLE",
    timeLimitSeconds: 1200,
    basePoints: 350,
    requiredRank: "PENTESTER",
    isFree: false,
    orderInBranch: 4,

    briefing: `
OPERACIÓN: GLASS TUNNEL
CLASIFICACIÓN: ALTO SECRETO
AGENTE: TÚ
OBJETIVO: Ejecutivo nivel C, red corporativa OMNIVEX Group

Tenemos constancia de que el Director de Operaciones de OMNIVEX Group
accede al panel de control de la planta nuclear de Tarragona desde la red Wi-Fi
corporativa. El acceso usa HTTPS pero sospechamos que hay downgrade a HTTP posible.

Tu misión: posiciónate como intermediario en la sesión HTTPS del objetivo.
Usa SSLstrip para degradar la conexión a HTTP e interceptar las credenciales
del panel de control. El código de acceso maestro será tu bandera.

Esta operación tiene una ventana de 20 minutos. Después, el sistema rota credenciales.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – GLASS TUNNEL

TÉCNICA UTILIZADA: Man-in-the-Middle con SSL Stripping

Un ataque MitM completo combina múltiples técnicas:
1. ARP Spoofing para redirigir el tráfico.
2. SSL Stripping para degradar HTTPS a HTTP.
3. Captura y análisis de credenciales en texto plano.

FLUJO DEL ATAQUE:
  Víctima ──HTTP──▶ ATACANTE ──HTTPS──▶ Servidor real
  El atacante actúa como proxy transparente.
  La víctima cree estar en HTTPS pero su conexión al atacante es HTTP.

HERRAMIENTAS CLAVE:
  arpspoof -i eth0 -t VICTIM GATEWAY
  iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
  sslstrip -l 8080
  mitmproxy --mode transparent --ssl-insecure

CONTRAMEDIDA MODERNA: HSTS (HTTP Strict Transport Security)
  Si el sitio implementa HSTS, el navegador rechaza conexiones HTTP.
  SSLstrip2 intenta bypass mediante cambios de dominio (hsts.sinip.es → hsts.sinlp.es).

IMPACTO REAL:
- Robo de credenciales de portales corporativos.
- Secuestro de sesiones autenticadas.
- Inyección de payloads en páginas visitadas.

DEFENSA:
1. HSTS con directiva preload + max-age largo.
2. Certificate Pinning en aplicaciones móviles/desktop.
3. Verificación de certificados en el cliente.
4. Segmentación de red y 802.1X.
    `.trim(),

    flag: "HACKQUEST{m1tm_3st4bl1sh3d}",

    phases: [
      {
        name: "Configuración del entorno MitM",
        description:
          "Establece el envenenamiento ARP bidireccional y activa el reenvío de paquetes IP.",
        expectedCommands: [
          "echo 1 > /proc/sys/net/ipv4/ip_forward",
          "arpspoof -i eth0 -t 192.168.1.50 192.168.1.1",
        ],
        hints: [
          "Sin IP forwarding activado, cortarás la conexión de la víctima. Actívalo primero.",
          "echo 1 > /proc/sys/net/ipv4/ip_forward activa el reenvío de paquetes.",
          "Luego envenena en ambas direcciones con arpspoof en dos terminales paralelas.",
        ],
      },
      {
        name: "Configuración de SSLstrip",
        description:
          "Redirige el tráfico HTTP/HTTPS a través de SSLstrip para degradar las conexiones seguras.",
        expectedCommands: [
          "iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080",
          "sslstrip -l 8080",
        ],
        hints: [
          "Necesitas redirigir el tráfico del puerto 80 a SSLstrip mediante iptables.",
          "Regla iptables: iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080",
          "Luego inicia SSLstrip: sslstrip -l 8080 -w captura_ssl.log",
        ],
      },
      {
        name: "Extracción de credenciales",
        description:
          "Analiza el log de SSLstrip para extraer las credenciales del panel de control.",
        expectedCommands: ["cat sslstrip.log", "grep -i password sslstrip.log"],
        hints: [
          "SSLstrip guarda el tráfico interceptado en un archivo de log.",
          "Revisa el log: cat sslstrip.log | grep -i 'pass\\|user\\|login'",
          "Las credenciales aparecen en los parámetros POST capturados en el log.",
        ],
      },
    ],
  },
];
