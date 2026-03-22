/**
 * HackQuest – Cryptography Branch
 * 4 challenges (progressive difficulty)
 *
 * All briefings/debriefings are in Spanish. Military/spy narrative tone.
 * Flags follow the pattern HACKQUEST{...}.
 */

import type { ChallengeData } from "@/types/game";

export const cryptographyChallenges = [
  // ================================================================
  // 1. Caesar Cipher
  // ================================================================
  {
    slug: "crypto-caesar",
    title: "Caesar Cipher",
    description:
      "Descifra un mensaje interceptado cifrado con el cifrado César. Encuentra el desplazamiento correcto para revelar el contenido oculto.",
    branch: "CRYPTOGRAPHY",
    difficulty: "TRIVIAL",
    type: "PUZZLE",
    timeLimitSeconds: 300,
    basePoints: 50,
    requiredRank: "SCRIPT_KIDDIE",
    isFree: true,
    orderInBranch: 1,

    briefing: `
OPERACIÓN: ANCIENT SCROLL
CLASIFICACIÓN: ABIERTA
AGENTE: TÚ
OBJETIVO: Mensaje interceptado de la red CIPHER Corp

Hemos interceptado un mensaje cifrado transmitido por un operativo de CIPHER Corp.
El análisis de patrones indica que se ha usado un cifrado por sustitución simple,
posiblemente un cifrado César con un desplazamiento desconocido.

Mensaje interceptado:
  "KDFFXHVW{f4354u_fu4fu3q}"

Tu misión: determina el desplazamiento y descifra el mensaje.
El texto descifrado es la bandera. No se necesitan herramientas avanzadas, solo lógica.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – ANCIENT SCROLL

TÉCNICA UTILIZADA: Cifrado César (Caesar Cipher)

El cifrado César es uno de los métodos de cifrado más antiguos y simples.
Desplaza cada letra del alfabeto un número fijo de posiciones.
Con solo 25 posibles desplazamientos, es trivialmente rompible por fuerza bruta.

MECÁNICA:
  Texto: A B C D E F G H ...
  +3:    D E F G H I J K ...

  "HELLO" con shift 3 → "KHOOR"
  "KHOOR" con shift -3 (o +23) → "HELLO"

PARA ROMPERLO:
  1. Prueba los 25 desplazamientos posibles (fuerza bruta).
  2. Análisis de frecuencia: en español, la 'E' es la letra más común.
  3. Herramientas online: dcode.fr/cipher-identifier

EJEMPLO PYTHON:
  def caesar_decrypt(text, shift):
      return ''.join(
          chr((ord(c) - ord('A') - shift) % 26 + ord('A'))
          if c.isalpha() else c for c in text.upper()
      )

IMPACTO HISTÓRICO:
  Julio César lo usó para comunicaciones militares con shift 3.
  En la era moderna, ROT13 (shift 13) se usa en foros para ocultar spoilers.

DEFENSA MODERNA:
  Usar AES-256 o ChaCha20 para cifrado simétrico.
  El cifrado por sustitución simple es completamente inseguro.
    `.trim(),

    flag: "HACKQUEST{c4354r_cr4ck3d}",

    phases: [
      {
        name: "Identificar el tipo de cifrado",
        description:
          "Analiza el mensaje cifrado para confirmar que se trata de un cifrado por sustitución simple.",
        expectedCommands: ["dcode caesar", "python3 -c \"print('caesar')\""],
        hints: [
          "Observa que la estructura del mensaje cifrado conserva mayúsculas, minúsculas y símbolos no alfabéticos.",
          "En un cifrado César, cada letra se desplaza el mismo número de posiciones. Los números y símbolos no cambian.",
          "El mensaje 'KDFFXHVW{...' parece un flag de HackQuest con las letras desplazadas. Compara K con H.",
        ],
      },
      {
        name: "Fuerza bruta del desplazamiento",
        description:
          "Prueba todos los desplazamientos posibles hasta encontrar el texto legible.",
        expectedCommands: [
          "python3 -c \"for i in range(26): print(i, ''.join(chr((ord(c)-65-i)%26+65) if c.isalpha() else c for c in 'KDFFXHVW'))\"",
        ],
        hints: [
          "Solo hay 25 posibles desplazamientos. Pruébalos todos con un bucle simple.",
          "En Python: for i in range(26): print(i, caesar_decrypt(mensaje, i))",
          "El desplazamiento correcto es 3. HACKQUEST = KDFFXHVW con shift +3.",
        ],
      },
      {
        name: "Descifrar el mensaje completo",
        description:
          "Aplica el desplazamiento correcto a todo el mensaje para obtener la bandera.",
        expectedCommands: ["python3 decrypt.py", "rot13 KDFFXHVW"],
        hints: [
          "Con shift 3 confirmado, aplícalo a todo el mensaje incluyendo el contenido entre llaves.",
          "Recuerda que los números y símbolos como {} no se cifran en el César clásico.",
          "Resultado: HACKQUEST{c4354r_cr4ck3d}",
        ],
      },
    ],
  },

  // ================================================================
  // 2. Base64 & Encodings
  // ================================================================
  {
    slug: "crypto-base64",
    title: "Base64 & Encodings",
    description:
      "Decodifica múltiples capas de codificación para extraer el mensaje oculto. Base64, hexadecimal y URL encoding combinados.",
    branch: "CRYPTOGRAPHY",
    difficulty: "EASY",
    type: "PUZZLE",
    timeLimitSeconds: 480,
    basePoints: 100,
    requiredRank: "SCRIPT_KIDDIE",
    isFree: true,
    orderInBranch: 2,

    briefing: `
OPERACIÓN: LAYER CAKE
CLASIFICACIÓN: RESTRINGIDA
AGENTE: TÚ
OBJETIVO: Archivo cifrado interceptado en servidor FTP de DATACORE LLC

Hemos capturado un archivo de texto del servidor FTP de DATACORE.
El analista de inteligencia confirma que el contenido está codificado
en múltiples capas para dificultar su análisis rápido.

Contenido interceptado:
  "SEFDS1FVRVNUe2I0czNfNjRfZDNjMGQzZH0="

Tu misión: decodifica todas las capas y extrae el mensaje original.
Identifica cada esquema de codificación antes de proceder.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – LAYER CAKE

TÉCNICA UTILIZADA: Análisis de Encodings (Base64, Hex, URL)

Las codificaciones NO son cifrado. Son transformaciones reversibles sin clave.
Se usan frecuentemente para ofuscar datos o transmitirlos por canales de texto.

BASE64:
  Codifica datos binarios en ASCII usando 64 caracteres (A-Z, a-z, 0-9, +, /).
  Se reconoce por el padding con '=' al final.
  Comando: echo "dato" | base64 -d
  Python: import base64; base64.b64decode("dato")

HEXADECIMAL:
  Representa bytes como pares de dígitos hex (00-FF).
  Se reconoce porque solo contiene 0-9 y a-f/A-F.
  Python: bytes.fromhex("48656c6c6f").decode()

URL ENCODING (%xx):
  Codifica caracteres especiales en URLs.
  %20 = espacio, %7B = {, %7D = }
  Python: import urllib.parse; urllib.parse.unquote("%48%4f%4c%41")

HERRAMIENTAS:
  CyberChef (online): "Magic" auto-detecta y aplica decodificaciones en cadena.
  Python: combinación de base64, binascii, urllib.parse

REGLA PRÁCTICA:
  Si termina en '=': prueba Base64.
  Si son pares de hex: prueba hex decode.
  Si tiene %XX: prueba URL decode.
    `.trim(),

    flag: "HACKQUEST{b4s3_64_d3c0d3d}",

    phases: [
      {
        name: "Identificar la codificación",
        description:
          "Analiza el string interceptado para determinar qué tipo de codificación se ha aplicado.",
        expectedCommands: ["file encoded.txt", "echo 'SEFDS1FVRVNUe2I0czNfNjRfZDNjMGQzZH0=' | base64 -d"],
        hints: [
          "El string termina en '='. Esto es característico del padding de Base64.",
          "Base64 usa solo los caracteres A-Z, a-z, 0-9, + y /. Verifica que el string los cumpla.",
          "Prueba: echo 'SEFDS1FVRVNUe2I0czNfNjRfZDNjMGQzZH0=' | base64 -d",
        ],
      },
      {
        name: "Primera decodificación Base64",
        description:
          "Decodifica la primera capa Base64 y analiza el resultado para detectar capas adicionales.",
        expectedCommands: [
          "echo 'SEFDS1FVRVNUe2I0czNfNjRfZDNjMGQzZH0=' | base64 -d",
          "python3 -c \"import base64; print(base64.b64decode('SEFDS1FVRVNUe2I0czNfNjRfZDNjMGQzZH0=').decode())\"",
        ],
        hints: [
          "En Linux: echo 'STRING' | base64 -d",
          "En Python: import base64; base64.b64decode('STRING').decode()",
          "El resultado de la primera decodificación debería ser legible directamente.",
        ],
      },
      {
        name: "Verificar el resultado final",
        description:
          "Confirma que el mensaje decodificado tiene el formato de flag esperado.",
        expectedCommands: ["echo resultado", "python3 -c \"print('HACKQUEST{b4s3_64_d3c0d3d}')\""],
        hints: [
          "El flag sigue el patrón HACKQUEST{...}.",
          "Si el resultado no tiene ese formato, puede haber más capas de codificación.",
          "La decodificación Base64 directa revela: HACKQUEST{b4s3_64_d3c0d3d}",
        ],
      },
    ],
  },

  // ================================================================
  // 3. Hash Cracking
  // ================================================================
  {
    slug: "crypto-hash",
    title: "Hash Cracking",
    description:
      "Crack un hash MD5 de una contraseña usando un ataque de diccionario y tablas rainbow para recuperar las credenciales de acceso.",
    branch: "CRYPTOGRAPHY",
    difficulty: "MEDIUM",
    type: "PUZZLE",
    timeLimitSeconds: 900,
    basePoints: 200,
    requiredRank: "JUNIOR",
    isFree: false,
    orderInBranch: 3,

    briefing: `
OPERACIÓN: RAINBOW STORM
CLASIFICACIÓN: CONFIDENCIAL
AGENTE: TÚ
OBJETIVO: Base de datos de usuarios de SENTINEL Corp (volcado parcial)

Hemos obtenido un volcado parcial de la base de datos de SENTINEL Corp.
Los passwords están almacenados como hashes MD5 sin salt.
El analista de inteligencia ha identificado el hash del administrador principal:

  HASH: 5f4dcc3b5aa765d61d8327deb882cf99

Tu misión: recupera la contraseña en texto plano correspondiente a ese hash.
La contraseña recuperada es la bandera (en formato HACKQUEST{contraseña}).
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – RAINBOW STORM

TÉCNICA UTILIZADA: Hash Cracking (MD5 sin salt)

Un hash criptográfico es una función unidireccional: fácil de calcular, imposible
de invertir directamente. Sin embargo, si la contraseña está en un diccionario común
o las tablas rainbow la contienen, el cracking es posible.

TIPOS DE ATAQUE:
  1. Diccionario: prueba palabras de una wordlist (rockyou.txt, etc.)
  2. Fuerza bruta: prueba todas las combinaciones posibles.
  3. Tablas Rainbow: tablas precomputadas de hash → contraseña.

HERRAMIENTAS:
  hashcat -m 0 hash.txt rockyou.txt          (MD5 con diccionario)
  john --wordlist=rockyou.txt hash.txt       (John the Ripper)
  hashcat -m 0 -a 3 hash.txt ?a?a?a?a?a?a   (fuerza bruta 6 chars)

IDENTIFICAR TIPO DE HASH:
  MD5: 32 chars hex
  SHA1: 40 chars hex
  SHA256: 64 chars hex
  bcrypt: empieza por $2b$

  hash-identifier, hashid, o hashcat --identify

EL PROBLEMA DEL SALT:
  Un salt es un valor aleatorio único por usuario que se añade antes de hashear.
  Sin salt, hashes idénticos = misma contraseña (detectable).
  Con salt, aunque dos usuarios tengan la misma contraseña, sus hashes son distintos.

DEFENSA:
  Usar bcrypt, Argon2 o scrypt con salt aleatorio por usuario.
  Nunca usar MD5 o SHA1 para almacenar contraseñas.
    `.trim(),

    flag: "HACKQUEST{h4sh_cr4ck3d_md5}",

    phases: [
      {
        name: "Identificar el tipo de hash",
        description:
          "Determina el algoritmo de hash utilizado analizando la longitud y formato del hash.",
        expectedCommands: [
          "hash-identifier 5f4dcc3b5aa765d61d8327deb882cf99",
          "hashid 5f4dcc3b5aa765d61d8327deb882cf99",
        ],
        hints: [
          "El hash tiene 32 caracteres hexadecimales. ¿Qué algoritmo produce hashes de 32 chars?",
          "MD5 produce hashes de 32 caracteres hexadecimales. SHA1 produce 40.",
          "Usa hash-identifier o hashid para confirmarlo: hash-identifier 5f4dcc3b5aa765d61d8327deb882cf99",
        ],
      },
      {
        name: "Ataque de diccionario",
        description:
          "Usa hashcat o John the Ripper con la wordlist rockyou.txt para crackear el hash.",
        expectedCommands: [
          "hashcat -m 0 5f4dcc3b5aa765d61d8327deb882cf99 rockyou.txt",
          "john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt",
        ],
        hints: [
          "Guarda el hash en un archivo: echo '5f4dcc3b5aa765d61d8327deb882cf99' > hash.txt",
          "Hashcat modo 0 es para MD5: hashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt",
          "Este hash corresponde a una contraseña muy común. Rockyou.txt la contiene.",
        ],
      },
      {
        name: "Recuperar la contraseña",
        description:
          "Verifica la contraseña crackeada y confírmala como la bandera del reto.",
        expectedCommands: [
          "hashcat -m 0 5f4dcc3b5aa765d61d8327deb882cf99 rockyou.txt --show",
          "echo -n 'password' | md5sum",
        ],
        hints: [
          "Usa --show con hashcat para ver el resultado: hashcat -m 0 hash.txt rockyou.txt --show",
          "Verifica: echo -n 'TU_CONTRASEÑA' | md5sum debe dar el hash original.",
          "El hash 5f4dcc3b5aa765d61d8327deb882cf99 corresponde a la contraseña 'password'.",
        ],
      },
    ],
  },

  // ================================================================
  // 4. RSA Weakness
  // ================================================================
  {
    slug: "crypto-rsa",
    title: "RSA Weakness",
    description:
      "Explota una implementación débil de RSA con exponente público e=3 y mensaje sin padding para recuperar el texto plano de un mensaje cifrado.",
    branch: "CRYPTOGRAPHY",
    difficulty: "HARD",
    type: "PUZZLE",
    timeLimitSeconds: 1200,
    basePoints: 350,
    requiredRank: "PENTESTER",
    isFree: false,
    orderInBranch: 4,

    briefing: `
OPERACIÓN: BROKEN LOCK
CLASIFICACIÓN: ALTO SECRETO
AGENTE: TÚ
OBJETIVO: Canal de comunicación cifrado de QUANTUM Finance

El departamento de criptoanalysis ha interceptado un mensaje RSA
transmitido por el director financiero de QUANTUM Finance.

Parámetros interceptados:
  e = 3 (exponente público)
  n = [módulo de 2048 bits]
  c = [ciphertext interceptado]

El analista confirma que el mensaje fue cifrado SIN padding (textbook RSA).
Con e=3 y mensaje corto, existe un ataque matemático directo.

Tu misión: recupera el mensaje en texto plano. No necesitas factorizar n.
Piensa en lo que significa cifrar con e=3 sin padding.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – BROKEN LOCK

TÉCNICA UTILIZADA: RSA con e pequeño sin padding (Cube Root Attack)

RSA textbook: c = m^e mod n

VULNERABILIDAD CON e=3 SIN PADDING:
Si el mensaje m es suficientemente pequeño tal que m^3 < n,
entonces c = m^3 (sin la reducción modular mod n).
Por tanto: m = cbrt(c) (raíz cúbica exacta de c).

Este ataque es posible porque sin PKCS#1 o OAEP padding:
  - El mensaje ocupa menos bits que el módulo.
  - La operación modular no se activa.
  - c es simplemente m elevado a 3.

CÓDIGO DE EXPLOTACIÓN:
  from sympy import integer_nthroot
  c = [CIPHERTEXT_INTERCEPTADO]
  m, exact = integer_nthroot(c, 3)
  if exact:
      print(bytes.fromhex(hex(m)[2:]).decode())

OTROS ATAQUES RSA CONOCIDOS:
  - Wiener Attack: d pequeño → recuperar clave privada.
  - Franklin-Reiter: misma clave, mensajes relacionados.
  - Broadcast Attack (Håstad): mismo m, distintos n, e=3.
  - Fermat Factoring: p y q cercanos.

DEFENSA:
  Usar siempre OAEP padding (PKCS#1 v2.1) para cifrado RSA.
  e=65537 es el exponente público estándar seguro.
  Nunca usar "textbook RSA" en producción.
    `.trim(),

    flag: "HACKQUEST{rs4_3_3_w34k_k3y}",

    phases: [
      {
        name: "Analizar los parámetros RSA",
        description:
          "Examina los parámetros del sistema RSA para identificar la debilidad explotable.",
        expectedCommands: [
          "python3 -c \"e=3; print('RSA con e pequeño sin padding es vulnerable al cube root attack')\"",
          "openssl rsa -pubin -in pubkey.pem -text -noout",
        ],
        hints: [
          "Con e=3 y sin padding, si el mensaje es pequeño, m^3 < n y puedes calcular la raíz cúbica de c directamente.",
          "El cifrado RSA textbook: c = m^e mod n. Si m es pequeño y e=3, la mod n no se aplica realmente.",
          "Busca el 'cube root attack' o 'small exponent attack' para RSA.",
        ],
      },
      {
        name: "Implementar el ataque de raíz cúbica",
        description:
          "Calcula la raíz cúbica entera del ciphertext para recuperar el mensaje original.",
        expectedCommands: [
          "python3 -c \"from sympy import integer_nthroot; m, exact = integer_nthroot(c, 3); print(exact, m)\"",
        ],
        hints: [
          "En Python: from sympy import integer_nthroot",
          "m, exact = integer_nthroot(c, 3). Si exact es True, el ataque funciona.",
          "Importante: necesitas aritmética de precisión arbitraria. Python la tiene nativa.",
        ],
      },
      {
        name: "Decodificar el mensaje",
        description:
          "Convierte el entero recuperado a texto para obtener la bandera.",
        expectedCommands: [
          "python3 -c \"print(bytes.fromhex(hex(m)[2:]).decode())\"",
          "python3 exploit_rsa.py",
        ],
        hints: [
          "El mensaje m es un entero. Conviértelo a bytes: bytes.fromhex(hex(m)[2:])",
          "Luego decodifica los bytes a string ASCII: .decode('ascii') o .decode('utf-8')",
          "Script completo: from sympy import integer_nthroot; m,_ = integer_nthroot(c,3); print(bytes.fromhex(hex(m)[2:]).decode())",
        ],
      },
    ],
  },
];
