/**
 * HackQuest – Forensics Branch
 * 4 challenges (progressive difficulty)
 *
 * All briefings/debriefings are in Spanish. Military/spy narrative tone.
 * Flags follow the pattern HACKQUEST{...}.
 */

import type { ChallengeData } from "@/types/game";

export const forensicsChallenges = [
  // ================================================================
  // 1. File Signatures
  // ================================================================
  {
    slug: "forensics-magic-bytes",
    title: "File Signatures",
    description:
      "Identifica archivos con extensiones falsificadas analizando sus magic bytes (firmas de archivo) para revelar su verdadero formato.",
    branch: "FORENSICS",
    difficulty: "EASY",
    type: "PUZZLE",
    timeLimitSeconds: 480,
    basePoints: 100,
    requiredRank: "SCRIPT_KIDDIE",
    isFree: true,
    orderInBranch: 1,

    briefing: `
OPERACIÓN: FALSE COLORS
CLASIFICACIÓN: RESTRINGIDA
AGENTE: TÚ
OBJETIVO: Dispositivo USB incautado a sospechoso en el aeropuerto de Barajas

El equipo de campo ha incautado un USB a un sospechoso en el aeropuerto.
El dispositivo contiene archivos con extensiones aparentemente inofensivas
(.txt, .jpg, .doc) pero inteligencia sospecha que ocultan contenido diferente.

Tu misión: analiza los primeros bytes de cada archivo para determinar
su formato real. Los archivos con contenido falsificado son los objetivos.
Busca la flag oculta en el archivo real.

No te fíes de las extensiones. Los bytes no mienten.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – FALSE COLORS

TÉCNICA UTILIZADA: Análisis de File Signatures (Magic Bytes)

Cada formato de archivo tiene una firma única en sus primeros bytes.
Los sistemas operativos a menudo ignoran la extensión y usan estos bytes
para determinar el tipo real del archivo. Los atacantes falsifican extensiones
para evadir filtros y engañar a usuarios.

FIRMAS COMUNES:
  PNG:  89 50 4E 47 0D 0A 1A 0A  (‰PNG....)
  JPG:  FF D8 FF E0               (ÿØÿà)
  PDF:  25 50 44 46               (%PDF)
  ZIP:  50 4B 03 04               (PK..)
  EXE:  4D 5A                     (MZ)
  GIF:  47 49 46 38               (GIF8)
  RAR:  52 61 72 21               (Rar!)
  ELF:  7F 45 4C 46               (.ELF)

HERRAMIENTAS:
  file archivo.txt              (Linux: detecta tipo real)
  xxd archivo.txt | head -2     (ver bytes en hex)
  hexdump -C archivo.txt | head (alternativa)
  binwalk archivo.txt           (extrae archivos embebidos)

CASO PRÁCTICO:
  Un archivo llamado "informe.txt" con bytes iniciales "FF D8 FF"
  es en realidad un JPEG renombrado.

DEFENSA:
  Validar magic bytes en el servidor, no solo la extensión.
  Usar antivirus con análisis de contenido real.
  Sandboxing de archivos recibidos de fuentes externas.
    `.trim(),

    flag: "HACKQUEST{m4g1c_byt3s_f0und}",

    phases: [
      {
        name: "Examinar los archivos sospechosos",
        description:
          "Usa el comando 'file' para determinar el tipo real de cada archivo en el USB.",
        expectedCommands: ["file *", "file suspicious.txt", "file imagen.jpg"],
        hints: [
          "El comando 'file' en Linux lee los magic bytes y determina el tipo real del archivo.",
          "Ejecuta: file * para analizar todos los archivos del directorio.",
          "Los archivos cuyo tipo no coincide con su extensión son los sospechosos.",
        ],
      },
      {
        name: "Inspeccionar los magic bytes manualmente",
        description:
          "Usa xxd o hexdump para ver los primeros bytes del archivo sospechoso y confirmar su tipo real.",
        expectedCommands: [
          "xxd suspicious.txt | head -3",
          "hexdump -C suspicious.txt | head",
        ],
        hints: [
          "xxd muestra el contenido en hexadecimal: xxd archivo | head -3",
          "Los primeros bytes revelan el tipo: FF D8 FF = JPEG, 89 50 4E 47 = PNG, 25 50 44 46 = PDF.",
          "hexdump -C suspicious.txt | head te muestra los bytes en hex y ASCII simultáneamente.",
        ],
      },
      {
        name: "Extraer el contenido real",
        description:
          "Renombra el archivo con su extensión correcta y extrae la flag oculta.",
        expectedCommands: [
          "cp suspicious.txt real_file.pdf",
          "binwalk -e suspicious.txt",
        ],
        hints: [
          "Una vez identificado el tipo real, renombra el archivo con la extensión correcta.",
          "Si es un ZIP: cp suspicious.txt archivo.zip && unzip archivo.zip",
          "binwalk -e puede extraer automáticamente archivos embebidos: binwalk -e suspicious.txt",
        ],
      },
    ],
  },

  // ================================================================
  // 2. Metadata Analysis
  // ================================================================
  {
    slug: "forensics-metadata",
    title: "Metadata Analysis",
    description:
      "Extrae metadatos ocultos de documentos e imágenes para obtener información sensible que el autor no pretendía revelar.",
    branch: "FORENSICS",
    difficulty: "EASY",
    type: "PUZZLE",
    timeLimitSeconds: 600,
    basePoints: 120,
    requiredRank: "JUNIOR",
    isFree: true,
    orderInBranch: 2,

    briefing: `
OPERACIÓN: PAPER TRAIL
CLASIFICACIÓN: CONFIDENCIAL
AGENTE: TÚ
OBJETIVO: Documento PDF publicado en el sitio web de ARGOS Industries

Un informante ha señalado que ARGOS Industries ha publicado accidentalmente
un documento PDF en su sitio web corporativo. Aparentemente es un informe
anual inocuo, pero inteligencia cree que los metadatos del documento
contienen información operativa sensible.

Documento objetivo: informe_anual_2024.pdf
URL: https://argos.corp/public/informe_anual_2024.pdf

Tu misión: extrae y analiza todos los metadatos del documento.
La información de interés podría estar en el autor, empresa, comentarios
o datos GPS de imágenes embebidas.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – PAPER TRAIL

TÉCNICA UTILIZADA: Análisis de Metadatos (EXIF / Document Metadata)

Los metadatos son datos sobre datos. Documentos e imágenes almacenan
información que puede revelar identidades, ubicaciones, software usado
e incluso historial de edición.

METADATOS EN IMÁGENES (EXIF):
  - GPS: latitud/longitud exacta de donde se tomó la foto.
  - Dispositivo: modelo de cámara/teléfono, número de serie.
  - Fecha: cuándo se tomó la fotografía.
  - Software: aplicación de edición usada.

METADATOS EN DOCUMENTOS OFFICE/PDF:
  - Autor: nombre del usuario del sistema.
  - Empresa: nombre de la organización.
  - Fecha de creación/modificación.
  - Revisiones y comentarios ocultos.
  - Rutas de archivos del sistema (revelan estructura interna).

HERRAMIENTAS:
  exiftool archivo.pdf          (análisis completo de metadatos)
  exiftool -GPS* foto.jpg       (solo datos GPS)
  pdfinfo documento.pdf         (metadatos PDF básicos)
  strings documento.pdf | grep -i author

CASOS REALES:
  - Fotos de periodistas en zonas de conflicto con GPS activo → revelan ubicación.
  - Documentos de whistleblowers con nombre de autor → identificación del filtrante.
  - Archivos de malware con timestamps de compilación → timezone del atacante.

DEFENSA:
  Usar ExifTool para limpiar metadatos antes de publicar: exiftool -all= archivo.pdf
  Configurar política corporativa de eliminación de metadatos.
    `.trim(),

    flag: "HACKQUEST{m3t4d4t4_l34k3d}",

    phases: [
      {
        name: "Analizar metadatos del documento",
        description:
          "Extrae todos los metadatos del archivo PDF usando ExifTool.",
        expectedCommands: [
          "exiftool informe_anual_2024.pdf",
          "pdfinfo informe_anual_2024.pdf",
        ],
        hints: [
          "ExifTool es la herramienta estándar para análisis de metadatos.",
          "Comando básico: exiftool informe_anual_2024.pdf",
          "Presta atención a campos como Author, Creator, Producer, Comment y Keywords.",
        ],
      },
      {
        name: "Buscar datos GPS en imágenes embebidas",
        description:
          "El PDF contiene imágenes. Extrae las imágenes y analiza sus datos GPS.",
        expectedCommands: [
          "pdfimages informe_anual_2024.pdf imagenes/",
          "exiftool -GPS* imagenes/*.jpg",
        ],
        hints: [
          "Usa pdfimages para extraer las imágenes del PDF: pdfimages -j archivo.pdf carpeta/",
          "Luego analiza las imágenes: exiftool -GPS* carpeta/*.jpg",
          "Las coordenadas GPS revelan la ubicación donde se tomaron las fotos.",
        ],
      },
      {
        name: "Interpretar los metadatos sensibles",
        description:
          "Analiza los metadatos encontrados para extraer la información operativa y la bandera.",
        expectedCommands: [
          "exiftool -Comment informe_anual_2024.pdf",
          "strings informe_anual_2024.pdf | grep HACKQUEST",
        ],
        hints: [
          "Busca campos inusuales en los metadatos: Comment, Keywords, Subject.",
          "A veces la flag está en el campo Comment o en el título del documento.",
          "strings informe_anual_2024.pdf | grep -i 'hackquest\\|flag\\|secret' puede revelarla.",
        ],
      },
    ],
  },

  // ================================================================
  // 3. Steganography
  // ================================================================
  {
    slug: "forensics-stego",
    title: "Steganography",
    description:
      "Descubre y extrae datos ocultos dentro de una imagen usando técnicas de esteganografía LSB y análisis espectral.",
    branch: "FORENSICS",
    difficulty: "MEDIUM",
    type: "PUZZLE",
    timeLimitSeconds: 900,
    basePoints: 200,
    requiredRank: "JUNIOR",
    isFree: false,
    orderInBranch: 3,

    briefing: `
OPERACIÓN: HIDDEN IN PLAIN SIGHT
CLASIFICACIÓN: SECRETO
AGENTE: TÚ
OBJETIVO: Imagen publicada en red social por agente encubierto de PHANTOM Network

Un agente encubierto de PHANTOM Network está usando una cuenta de Instagram
aparentemente normal para transmitir mensajes a su red. Las imágenes que publica
no parecen contener nada relevante, pero el patrón de publicación es sospechoso.

Imagen interceptada: beach_sunset.png

Tu misión: analiza la imagen en busca de datos ocultos mediante técnicas
de esteganografía. Extrae el mensaje oculto que confirma la identidad
del agente y su próxima operación.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – HIDDEN IN PLAIN SIGHT

TÉCNICA UTILIZADA: Esteganografía LSB (Least Significant Bit)

La esteganografía oculta información dentro de otros archivos sin alterar
visiblemente el archivo portador. La técnica LSB modifica el bit menos significativo
de cada byte de color de la imagen para codificar el mensaje oculto.

TÉCNICA LSB:
  Cada pixel tiene 3 canales (R, G, B) con valores 0-255.
  El bit menos significativo de cada canal contribuye mínimamente al color visual.
  Modificando solo ese bit, se pueden almacenar hasta 3 bits por pixel.
  En una imagen de 1920x1080 = 2.073.600 pixels → ~777KB de datos ocultos.

HERRAMIENTAS DE DETECCIÓN Y EXTRACCIÓN:
  steghide extract -sf imagen.png -p ""    (extrae con steghide, sin password)
  steghide extract -sf imagen.jpg -p password
  stegsolve.jar                             (análisis visual de planos de bits)
  zsteg imagen.png                          (análisis LSB en PNG/BMP)
  binwalk -e imagen.png                     (busca archivos embebidos)
  strings imagen.png                        (busca texto legible)

ANÁLISIS ESPECTRAL:
  stegsolve permite ver cada plano de bits individualmente.
  El plano LSB del canal rojo/verde/azul puede revelar patrones.

DETECCIÓN ESTADÍSTICA:
  Las imágenes con LSB steganography tienen distribución estadística anómala
  en los bits menos significativos (chi-square test).

DEFENSA:
  Re-comprimir imágenes antes de publicar (destruye LSB).
  Usar esteganálisis automatizado en perímetros de DLP.
    `.trim(),

    flag: "HACKQUEST{h1dd3n_1n_pl41n_s1ght}",

    phases: [
      {
        name: "Análisis inicial de la imagen",
        description:
          "Realiza un análisis básico de la imagen buscando datos embebidos o strings sospechosos.",
        expectedCommands: [
          "strings beach_sunset.png | grep -i hackquest",
          "binwalk beach_sunset.png",
          "file beach_sunset.png",
        ],
        hints: [
          "Empieza con análisis básico: strings, file y binwalk.",
          "strings beach_sunset.png puede revelar texto oculto directamente.",
          "binwalk detecta archivos embebidos dentro de la imagen.",
        ],
      },
      {
        name: "Extracción con steghide",
        description:
          "Intenta extraer datos ocultos usando steghide con y sin contraseña.",
        expectedCommands: [
          "steghide extract -sf beach_sunset.png -p ''",
          "steghide info beach_sunset.png",
        ],
        hints: [
          "steghide es una de las herramientas más usadas para esteganografía en imágenes.",
          "Prueba sin contraseña: steghide extract -sf beach_sunset.png -p ''",
          "Si hay contraseña, steghide info beach_sunset.png confirma que hay datos ocultos.",
        ],
      },
      {
        name: "Análisis LSB con zsteg",
        description:
          "Usa zsteg para detectar y extraer datos ocultos mediante análisis LSB en todos los planos.",
        expectedCommands: [
          "zsteg beach_sunset.png",
          "zsteg -a beach_sunset.png",
        ],
        hints: [
          "zsteg analiza todos los planos de bits de imágenes PNG/BMP.",
          "Comando: zsteg beach_sunset.png. El flag -a prueba todas las combinaciones.",
          "Busca en la salida líneas con texto ASCII legible que contengan el flag.",
        ],
      },
    ],
  },

  // ================================================================
  // 4. Memory Forensics
  // ================================================================
  {
    slug: "forensics-memory",
    title: "Memory Forensics",
    description:
      "Analiza un volcado de memoria RAM para extraer credenciales, procesos maliciosos y artefactos de una infección de malware.",
    branch: "FORENSICS",
    difficulty: "HARD",
    type: "PUZZLE",
    timeLimitSeconds: 1200,
    basePoints: 350,
    requiredRank: "PENTESTER",
    isFree: false,
    orderInBranch: 4,

    briefing: `
OPERACIÓN: GHOST MEMORY
CLASIFICACIÓN: ALTO SECRETO
AGENTE: TÚ
OBJETIVO: Equipo comprometido del analista senior de TITAN Defense Corp

El CSIRT de TITAN Defense Corp nos ha enviado un volcado de memoria RAM (memory.dmp)
de un equipo que se comportó de forma anómala hace 4 horas.
Sospechamos que un APT ha dejado un implante en memoria que exfiltra documentos clasificados.

Tu misión: analiza el volcado de memoria para:
  1. Identificar el proceso malicioso activo.
  2. Extraer las credenciales en memoria (LSASS).
  3. Recuperar la flag que el malware almacenó en memoria.

El tiempo es crítico. El APT puede limpiar el sistema remotamente en cualquier momento.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – GHOST MEMORY

TÉCNICA UTILIZADA: Memory Forensics con Volatility

El análisis forense de memoria permite examinar el estado del sistema
en el momento de la captura: procesos activos, conexiones de red,
credenciales en memoria, claves de cifrado y artefactos de malware.

HERRAMIENTA PRINCIPAL: Volatility 3
  python3 vol.py -f memory.dmp windows.pslist     (lista de procesos)
  python3 vol.py -f memory.dmp windows.pstree     (árbol de procesos)
  python3 vol.py -f memory.dmp windows.netscan    (conexiones de red)
  python3 vol.py -f memory.dmp windows.cmdline    (líneas de comando)
  python3 vol.py -f memory.dmp windows.dumpfiles  (extraer archivos)
  python3 vol.py -f memory.dmp windows.hashdump   (hashes NTLM)
  python3 vol.py -f memory.dmp windows.malfind    (detectar código inyectado)

DETECCIÓN DE MALWARE EN MEMORIA:
  malfind: detecta regiones de memoria con código ejecutable sospechoso.
  hollowfind: detecta process hollowing (proceso legítimo con código malicioso).
  Buscar procesos con nombres similares a procesos del sistema (svchost.exe vs svch0st.exe).

EXTRACCIÓN DE CREDENCIALES:
  mimikatz puede ejecutarse sobre volcados de memoria.
  windows.hashdump extrae hashes NTLM del registro.
  Las contraseñas en texto plano a veces persisten en memoria.

INDICADORES DE COMPROMISO (IOCs):
  - Procesos con rutas inusuales (C:\\Users\\Temp vs C:\\Windows\\System32).
  - Conexiones a IPs externas desde procesos del sistema.
  - Inyecciones de código en procesos legítimos.

DEFENSA:
  Credential Guard en Windows 10+.
  Endpoint Detection and Response (EDR).
  Monitorización de memoria con YARA rules.
    `.trim(),

    flag: "HACKQUEST{m3m0ry_dump_4n4lys3d}",

    phases: [
      {
        name: "Identificar el perfil del sistema",
        description:
          "Determina el sistema operativo y versión del volcado de memoria para usar el perfil correcto en Volatility.",
        expectedCommands: [
          "python3 vol.py -f memory.dmp windows.info",
          "volatility2 -f memory.dmp imageinfo",
        ],
        hints: [
          "En Volatility 3 no necesitas especificar el perfil. En Volatility 2 sí.",
          "Volatility 3: python3 vol.py -f memory.dmp windows.info",
          "Volatility 2: volatility -f memory.dmp imageinfo → te da el perfil recomendado.",
        ],
      },
      {
        name: "Listar procesos y detectar anomalías",
        description:
          "Examina la lista de procesos en busca de nombres sospechosos, rutas inusuales o procesos huérfanos.",
        expectedCommands: [
          "python3 vol.py -f memory.dmp windows.pslist",
          "python3 vol.py -f memory.dmp windows.pstree",
          "python3 vol.py -f memory.dmp windows.malfind",
        ],
        hints: [
          "Busca procesos con nombres similares a los del sistema pero con typos: svch0st, lsasss, etc.",
          "Compara la ruta del ejecutable: un svchost legítimo está en C:\\Windows\\System32.",
          "windows.malfind detecta regiones de memoria con código ejecutable y permisos de escritura.",
        ],
      },
      {
        name: "Extraer artefactos y credenciales",
        description:
          "Extrae el proceso malicioso y las credenciales almacenadas en memoria para obtener la bandera.",
        expectedCommands: [
          "python3 vol.py -f memory.dmp windows.dumpfiles --pid 1337",
          "python3 vol.py -f memory.dmp windows.hashdump",
        ],
        hints: [
          "Una vez identificado el PID del proceso malicioso, extrae su memoria: windows.dumpfiles --pid PID",
          "windows.hashdump extrae los hashes NTLM de los usuarios del sistema.",
          "Busca strings en el volcado del proceso malicioso: strings proceso.dmp | grep HACKQUEST",
        ],
      },
    ],
  },
];
