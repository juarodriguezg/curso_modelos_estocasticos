# Guía de despliegue

Cómo poner en marcha la plataforma del curso desde cero, cómo desplegar una versión nueva y qué revisar cuando algo falla. Complementa a `docs/MANUAL_TECNICO.md`, que describe la arquitectura y el código.

---

## 1. Cómo está desplegado el sistema

| Pieza | Servicio | Notas |
|---|---|---|
| Aplicación Next.js | Vercel | Despliega automáticamente cada push. La rama `main` va a producción; cualquier otra rama genera un *preview*. |
| Base de datos | PostgreSQL gestionado (hoy en Aiven) | Prisma se conecta con `DATABASE_URL`. Requiere SSL (`sslmode=require`). |
| Tareas programadas | Vercel Cron | Definidas en `vercel.json`. Hoy solo hay una: finalizar cursos cuyo periodo terminó. |
| Archivos estáticos | Carpeta `public/` | Se publican junto con la aplicación; no hay almacenamiento externo de archivos. |

Las migraciones de base de datos **no** se aplican durante el build de Vercel: se aplican a mano con `prisma migrate deploy` (sección 6). El build solo ejecuta `prisma generate` y `next build`.

---

## 2. Requisitos

- **Node.js 20** o superior (Next.js 16 exige al menos 20.9). En Vercel: *Settings → General → Node.js Version*.
- **PostgreSQL 15** o superior.
- Cliente de PostgreSQL (`psql`, `pg_dump`, `pg_restore`) de la misma versión mayor que el servidor o más nueva, para respaldos.
- Acceso de escritura al repositorio de GitHub y al proyecto de Vercel.
- Docker, solo para desarrollo local.

---

## 3. Variables de entorno

| Variable | Dónde | Obligatoria | Uso |
|---|---|---|---|
| `DATABASE_URL` | Vercel (Production y Preview) y `.env` local | Sí | Cadena de conexión de PostgreSQL para Prisma. |
| `CRON_SECRET` | Vercel (Production) | Sí, en producción | Vercel Cron la envía como `Authorization: Bearer …` a `/api/cron/finalize-courses`. Sin ella el cron responde 401 y los cursos no se finalizan solos. Genérala con `openssl rand -hex 32`. |
| `NODE_ENV` | La define Vercel | No la definas a mano en Vercel | En producción activa la cookie `secure` y reduce el log de Prisma. |
| `JWT_SECRET` | `.env` | No | Heredada; el código actual no la usa (ver manual técnico, sección 6.3). |

Reglas:

- `.env` no se versiona (está en `.gitignore`). Nunca subas cadenas de conexión ni secretos al repositorio.
- Cambiar una variable en Vercel **no** afecta al despliegue actual: aplica a partir del siguiente. Usa *Redeploy* si la necesitas ya.
- Si Preview y Production comparten `DATABASE_URL`, los previews escriben en la base de producción. Para probar cambios de esquema conviene una base aparte para Preview.

---

## 4. Entorno local

```bash
npm install
docker compose up -d
```

`docker compose` levanta PostgreSQL 16 en `localhost:5432` (usuario `curso`, contraseña `curso123`, base `curso_modelos`).

**Importante:** si tu `.env` apunta a la base de producción, no lo uses para trabajar en local. Las variables definidas en la terminal tienen prioridad sobre `.env`, tanto para Prisma como para Next.js, así que basta con exportar la base local en esa terminal:

```bash
export DATABASE_URL="postgresql://curso:curso123@localhost:5432/curso_modelos"
```

Con esa variable activa:

```bash
npx prisma migrate deploy
npm run seed
npm run dev
```

- `migrate deploy` crea todas las tablas en la base vacía.
- `seed` crea el administrador de prueba `admin1@example.com` / `clave123`.
- La aplicación queda en `http://localhost:3000`. Para cargar el temario, entra como administrador a `/perfil` → pestaña **Visibilidad** → **Sincronizar**.

Para comprobar que el build de producción funciona antes de abrir un PR:

```bash
npm run build
```

---

## 5. Primer despliegue (instalación desde cero)

### 5.1 Base de datos

1. Crea un servicio PostgreSQL gestionado (Aiven, Neon, Supabase, Railway…).
2. Copia la cadena de conexión con `sslmode=require`.
3. Si el proveedor filtra por IP, permite el acceso desde Vercel. Las funciones de Vercel no tienen IP fija, así que normalmente hay que permitir cualquier origen y confiar en la contraseña y el SSL.

### 5.2 Proyecto en Vercel

1. *Add New → Project* e importa el repositorio de GitHub.
2. Framework: **Next.js** (lo detecta solo). Deja los comandos por defecto: Vercel usa `npm install` y `npm run build`, y ambos ejecutan `prisma generate`.
3. Define `DATABASE_URL` y `CRON_SECRET` (sección 3).
4. Despliega. El primer despliegue puede fallar en tiempo de ejecución hasta que la base tenga las tablas (paso siguiente); el build en sí no necesita la base.

### 5.3 Esquema y datos iniciales

Desde tu máquina, con `DATABASE_URL` apuntando a la base de producción:

```bash
npx prisma migrate deploy
npm run seed
```

`seed` crea `admin1@example.com` con la contraseña `clave123`, que es pública porque está en el repositorio. No hay pantalla para cambiar contraseñas, así que:

1. Inicia sesión con ese usuario y copia el token de sesión. Está en `localStorage` del navegador, con la clave `token`.
2. Crea el administrador real:

   ```bash
   curl -X POST https://TU_DOMINIO/api/admin/create-user -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"email":"correo@unal.edu.co","password":"UNA_CLAVE_SEGURA","name":"Nombre Apellido","role":"admin"}'
   ```

3. Entra con el administrador nuevo y elimina `admin1@example.com` desde `/perfil` → **Usuarios**.

### 5.4 Configuración académica

En este orden:

1. `/perfil` → **Visibilidad** → **Sincronizar**: crea los temas del temario.
2. `/admin/dashboard` (**Asignaturas**): crea la asignatura y, en su detalle, usa **Asociar temas existentes**.
3. `/admin/dashboard/periodos` (**Periodos**): crea el periodo actual con sus fechas reales de inicio y fin.
4. `/admin/dashboard/cursos` (**Cursos**): crea un curso por grupo y matricula a los estudiantes, uno a uno o con **Importar CSV**. El CSV lleva las columnas `Correo`, `Documento`, `Nombre` y `Apellidos`. Cada estudiante nuevo entra con su documento como contraseña.

---

## 6. Desplegar una versión nueva

### 6.1 Flujo normal

1. Trabaja en una rama y súbela. Vercel crea un preview.
2. Abre un PR hacia `main`.
3. Revisa si el PR trae migraciones nuevas en `prisma/migrations/`:
   - **No trae:** fusiona el PR y listo.
   - **Sí trae:** sigue la sección 6.2 **antes** de fusionar.
4. Cuando Vercel marque el despliegue de producción como **Ready**, haz la verificación de la sección 9.

### 6.2 Cuando hay migraciones

1. **Respaldo** (sección 7).
2. Mira qué falta por aplicar:

   ```bash
   npx prisma migrate status
   ```

   Solo deben aparecer como pendientes las migraciones del PR. Si aparece otra, detente y averigua de dónde sale.
3. Aplica:

   ```bash
   npx prisma migrate deploy
   ```

4. Fusiona el PR.

Este orden (migrar primero, desplegar después) funciona porque las migraciones del proyecto son **aditivas**: agregan tablas y columnas sin borrar nada, así que el código que sigue en producción no se rompe con ellas. Si alguna vez una migración borra o renombra columnas, hay que partirla en dos: una aditiva que se aplica antes del despliegue, y otra que borra lo viejo y se aplica después, cuando ya ningún código lo use.

Reglas para migraciones:

- Nunca ejecutes `prisma migrate dev` contra producción: puede proponer reiniciar la base.
- Las migraciones se crean en local con `npx prisma migrate dev --name nombre` contra la base de Docker y se versionan en el PR.
- Si un script mueve datos (como `prisma/backfill-courses.js`), ejecútalo primero con `--dry-run` y después de aplicar la migración. Los scripts disponibles están en el manual técnico, sección 8.

### 6.3 Revertir

- **Solo código:** en Vercel, *Deployments* → el despliegue anterior → **Promote to Production**. Es instantáneo y no toca la base.
- **Base de datos:** Prisma no deshace migraciones. Si una migración aditiva causa problemas, normalmente basta con revertir el código; las tablas nuevas no estorban. Restaurar el respaldo (sección 7) es el último recurso, porque se pierde todo lo escrito después del respaldo.

---

## 7. Respaldo y restauración

Carga la cadena de conexión desde `.env` (o pégala a mano):

```bash
export DATABASE_URL=$(grep '^DATABASE_URL' .env | cut -d'"' -f2)
```

Haz el respaldo **fuera del repositorio**, porque contiene datos personales y hashes de contraseña:

```bash
pg_dump "$DATABASE_URL" -Fc -f ~/respaldo_curso_$(date +%F).dump
```

Comprueba que se puede leer:

```bash
pg_restore --list ~/respaldo_curso_AAAA-MM-DD.dump | head
```

Restaurar. Esto reemplaza el contenido actual de la base:

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" ~/respaldo_curso_AAAA-MM-DD.dump
```

Si `pg_dump` responde `server version mismatch`, tu cliente es más viejo que el servidor. Instala el cliente de la versión del servidor desde el repositorio oficial de PostgreSQL, o usa los respaldos automáticos del proveedor (en Aiven: el servicio → pestaña **Backups**).

---

## 8. Tareas programadas (Vercel Cron)

| Ruta | Horario (`vercel.json`) | Qué hace |
|---|---|---|
| `/api/cron/finalize-courses` | `30 5 * * *` (05:30 UTC = 00:30 en Bogotá) | Finaliza los cursos activos cuyo periodo terminó el día anterior o antes. No toca los cursos reactivados a mano después del cierre. |

- Vercel solo ejecuta crons en el despliegue de **producción**.
- En el plan Hobby, Vercel puede ejecutarlo en cualquier momento dentro de esa hora.
- Puedes ver las ejecuciones en *Settings → Cron Jobs*, y los errores en *Logs*.

Para probarlo a mano:

```bash
curl -H "Authorization: Bearer VALOR_DE_CRON_SECRET" https://TU_DOMINIO/api/cron/finalize-courses
```

Responde `{"finalized":[...]}` con los cursos que finalizó; una lista vacía si no había ninguno. Sin el encabezado, responde 401.

---

## 9. Verificación después de desplegar

- [ ] La página de inicio carga y el inicio de sesión funciona con un administrador.
- [ ] `/perfil` muestra las pestañas de administración, y `/admin/dashboard/cursos` lista los cursos con su número de estudiantes.
- [ ] Un estudiante ve sus temas y no ve los que su curso tiene ocultos.
- [ ] *Settings → Cron Jobs* en Vercel muestra el cron, y la prueba con `curl` responde 200.
- [ ] *Logs* de Vercel sin errores de Prisma en los primeros minutos.

---

## 10. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El build falla con `Property 'x' does not exist on type 'PrismaClient'` | El cliente de Prisma no se regeneró y Vercel reutilizó `node_modules` de la caché. | Los scripts `postinstall` y `build` ya ejecutan `prisma generate`; si vuelve a pasar, revisa que no se hayan quitado de `package.json`, o usa *Redeploy* sin caché. |
| Error `P1001: Can't reach database server` | Red, DNS o filtro de IP del proveedor; o la base está apagada. | Revisa la conexión, que el servicio esté encendido y que el filtro de IP permita tu IP o la de Vercel. |
| Errores `relation "..." does not exist` en producción | Se desplegó código con migraciones sin aplicar. | `npx prisma migrate deploy` (sección 6.2). |
| El preview de una rama falla pero producción no | El preview usa la misma base y la rama trae migraciones que aún no se aplicaron. | Esperado mientras la migración esté pendiente; no afecta a producción. |
| El cron responde 401 | Falta `CRON_SECRET` en Production o se cambió sin redesplegar. | Defínela y haz *Redeploy*. |
| Los cursos no se finalizan | El cron no corre (401, o no es el despliegue de producción) o el periodo tiene mal la fecha final. | Prueba el cron con `curl` y revisa las fechas en **Periodos**. |
| `too many connections` en la base | Cada función de Vercel abre conexiones y el plan de la base tiene un límite bajo. | Usa el *connection pooler* del proveedor o añade `connection_limit=1` a `DATABASE_URL`. |
| `pg_dump: server version mismatch` | Cliente más viejo que el servidor. | Sección 7. |
