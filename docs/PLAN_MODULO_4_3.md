# Plan de implementación — Módulo 4.3 (Gestión de cursos y usuarios)

**Requisitos cubiertos:** RF-CUR-01 a RF-CUR-11 (`docs/REQUISITOS.md`, sección 4.3), más el gancho pendiente de RF-ASG-04 y RF-ASG-05 del módulo 4.1.
**Modelo de datos de referencia:** `docs/ENTIDADES.md` (secciones 4.2 y 5.2).
**Rama sugerida:** `rf_modulo_cursos`, creada a partir de `rf_modulo_asignatura_entidades`.
**Destinatario:** modelo que ejecutará la implementación (Opus). El plan es autosuficiente; ante una duda de negocio, consulta la sección 10 antes de decidir.

---

## 1. Contexto y decisiones ya tomadas por el usuario

1. **Grupo y curso son homólogos.** Hoy `User.grupo` vale 1 o 2. Cada valor se convierte en un `Course` de la asignatura *Modelos Estocásticos*, con `Course.group = "1"` y `"2"`.
2. **El temario actual pertenece a una sola asignatura:** *Modelos Estocásticos*, sin distinción de grupo. Todos los `Topic` con `subjectId = null` se asocian a esa asignatura.
3. **Una asignatura puede tener 2 o 3 cursos (grupos) en el mismo periodo.** No hay tope duro en el sistema. La restricción es solo `@@unique([subjectId, periodId, group])` (RF-CUR-06). Por eso `group` es `String` y el código actual que limita el grupo a `[1, 2]` debe relajarse.
4. **El curso tiene estado `ACTIVE` o `FINALIZED`.** Es parte central de este plan (fase 6).
5. **Migración aditiva y no destructiva**, igual que en 4.1: no se borran `User.grupo`, `Topic.visibleGroup1/2` ni `User.password` en este módulo.
6. **Se mantiene la autenticación por contraseña.** El SSO de Google de `ENTIDADES.md` queda fuera de alcance.

## 2. Estado actual relevante (verificado en el código)

| Pieza | Estado hoy | Impacto |
|---|---|---|
| `User` | `name` único campo de nombre; `role` string (`admin`/`teacher`/`student`); `grupo Int`; `password` obligatorio | Faltan apellido, documento, matrícula |
| `Subject` / `Topic.subjectId` | Implementados (4.1). Los temas existentes tienen `subjectId = null` | El backfill debe asociarlos |
| `Topic.visibleGroup1/2` | Controlan qué ve cada grupo; el admin los alterna desde `/perfil` vía `POST /api/admin/topics` | Se reemplazan por `CourseTopic` |
| Lectores de `user.grupo` | `api/topics/visible`, `api/topics/structure`, `app/temas/[slug]/page.tsx`, `app/perfil/page.tsx`, `api/auth/login`, `api/auth/me`, `api/admin/list-users` | Hay que reescribirlos (fase 5) |
| Escritores de `grupo` | `api/admin/create-user` (valida `[1,2]`), `api/admin/upload-csv` (columnas `Correo, Documento, Nombre, Apellidos, Grupo`; contraseña inicial = documento), `api/admin/topics/sync` (pone `visibleGroup1/2 = true`) | Pasan a recibir un curso |
| `DELETE /api/admin/subjects/[id]` | Tiene el comentario-gancho de RF-ASG-04, sin comprobación real | Se completa en la fase 7 |
| Auth de API | `requireAdmin(req)` con Bearer token; páginas `/admin/*` con `requireAdminPage()` | Se reutilizan tal cual |
| Tests | No hay framework de pruebas | Verificación manual y con `tsc` / `lint` / `build` (sección 9) |
| BD local | `docker-compose.yml` (Postgres 16, usuario `curso`, base `curso_modelos`) | Úsala para todo el desarrollo; **nunca** apuntes `.env` a producción durante el desarrollo |

## 3. Modelo de datos (migración aditiva)

Agrega a `prisma/schema.prisma`:

```prisma
enum CourseStatus {
  ACTIVE
  FINALIZED
}

model AcademicPeriod {
  id        String   @id @default(cuid())
  name      String   @unique              // p. ej. "2026-1S"
  startDate DateTime @db.Date
  endDate   DateTime @db.Date
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  courses   Course[]
}

model Course {
  id            String       @id @default(cuid())
  subjectId     String
  periodId      String
  group         String                      // "1", "2", "3"... (grupo o sección)
  status        CourseStatus @default(ACTIVE)
  finalizedAt   DateTime?
  reactivatedAt DateTime?                   // si existe, el cron no vuelve a finalizar el curso
  exportedAt    DateTime?                   // última exportación .xlsx exitosa (requisito para purgar)
  purgedAt      DateTime?                   // datos purgados; el curso queda como registro histórico
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  subject       Subject      @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  period        AcademicPeriod @relation(fields: [periodId], references: [id], onDelete: Restrict)
  enrollments   CourseEnrollment[]
  topics        CourseTopic[]

  @@unique([subjectId, periodId, group])
  @@index([subjectId])
  @@index([periodId])
  @@index([status])
}

model CourseEnrollment {
  id            String    @id @default(cuid())
  courseId      String
  userId        String
  active        Boolean   @default(true)
  isMonitor     Boolean   @default(false)
  enrolledAt    DateTime  @default(now())
  deactivatedAt DateTime?

  course        Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@unique([courseId, userId])
  @@index([userId])
}

// Estado de un tema dentro de un curso. La ausencia de fila significa
// visible = true y sin fecha (el curso hereda el temario sin duplicarlo, RF-ASG-05).
model CourseTopic {
  id          String    @id @default(cuid())
  courseId    String
  topicId     String
  visible     Boolean   @default(true)      // reemplaza a Topic.visibleGroup1/2
  publishDate DateTime? @db.Date            // informativa; NO restringe el acceso (RF-CUR-03)

  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  topic       Topic     @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@unique([courseId, topicId])
  @@index([topicId])
}
```

Cambios sobre modelos existentes:

```prisma
model User {
  // ...campos actuales sin tocar...
  firstName   String?
  lastName    String?
  documentId  String?  @unique
  enrollments CourseEnrollment[]
}

model Subject { courses Course[] }
model Topic   { courseTopics CourseTopic[] }
```

Reglas de diseño:

- `User.name` **se conserva** y se mantiene sincronizado como `"${firstName} ${lastName}".trim()` al crear o editar con los campos nuevos. Los usuarios existentes quedan con `firstName`/`lastName` en `null` y siguen funcionando con `name`.
- `User → CourseEnrollment` es `Restrict` a propósito (RF-CUR-04: no se pierde el historial). Consecuencia: `api/admin/delete-user` debe devolver `409` si el usuario tiene matrículas, indicando que debe desactivarse la matrícula.
- La migración (`prisma migrate dev --name add_courses`) es solo de esquema. **Los datos se migran con un script aparte** (fase 4), porque necesita parámetros que no deben quedar fijos en SQL.

## 4. Librerías compartidas nuevas (`src/lib/`)

- `dates.ts`: helpers de zona horaria `America/Bogota` (RNF-OPE-01).
  - `todayInBogota(): string` → `"YYYY-MM-DD"` con `new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date())`.
  - `toDateOnly(input: string | Date): Date` para guardar columnas `@db.Date` sin corrimientos de día.
  - `isOutsideRange(date, start, end): boolean`.
- `courses.ts`:
  - `courseLabel(course)` → `"{code} · {periodo} · Grupo {group}"` (se usa también como texto de confirmación al purgar).
  - `assertCourseWritable(course): NextResponse | null` → si `status === "FINALIZED"` devuelve `409 { error: "Curso finalizado: solo lectura" }`. **Todo endpoint que modifique datos de un curso debe llamarlo** (RF-CUR-08). Los módulos 4.4 en adelante también.
  - `getStudentCourses(userId)` → matrículas **activas** con `course { subject, period }`.
  - `getVisibleTopicSlugs(user)` → ver fase 5.
  - Registro de extensión para exportar y comprobar registros: `courseExporters: Array<(courseId, workbook) => Promise<void>>` y `courseRecordCounters: Array<(courseId) => Promise<number>>`. En 4.3 solo se registran matrículas y publicación de temas; los módulos futuros añaden los suyos.

## 5. Fases de implementación

Cada fase termina con `npx tsc --noEmit`, `npm run lint` y un commit independiente. **Las fases 1 a 4 no cambian el comportamiento visible** y son seguras de desplegar. La fase 5 es el punto de corte.

### Fase 1 — Esquema y migración (RF-CUR-01, 02, 06, 10)

1. Editar `prisma/schema.prisma` según la sección 3.
2. Generar la migración con la base local (docker) y revisar el SQL: debe ser solo `CREATE TYPE`, `CREATE TABLE`, `ALTER TABLE ... ADD COLUMN` y los índices.
3. Ejecutar `npx prisma generate`.

### Fase 2 — Períodos académicos (RF-CUR-10, RF-CUR-07)

- `src/app/api/admin/periods/route.ts` — `GET` (lista con conteo de cursos) y `POST`.
- `src/app/api/admin/periods/[id]/route.ts` — `GET`, `PUT` y `DELETE` (este último solo si el periodo no tiene cursos → si no, `409`).
- Validaciones: `name` obligatorio y único; `startDate < endDate` (si no, `400`, RF-CUR-07); fechas ISO válidas.
- Al editar fechas de un periodo con cursos, **devolver `warnings`** si alguna `publishDate` de `CourseTopic` queda fuera del nuevo rango (advertir sin bloquear).
- Todos los endpoints con `requireAdmin`. Formato de `params`: `Promise` (Next 16), como en `subjects/[id]/route.ts`.

### Fase 3 — Cursos y estudiantes (RF-CUR-01, 02, 04, 06, 11)

Endpoints bajo `src/app/api/admin/courses/`:

- `route.ts` — `GET` (filtros `subjectId`, `periodId`, `status`; incluir `subject`, `period`, conteo de matrículas activas) y `POST { subjectId, periodId, group }`. Capturar el error de unicidad (`P2002`) y responder `409` con mensaje claro (RF-CUR-06). Las fechas **no se guardan**: se leen del periodo.
- `[id]/route.ts` — `GET` (detalle), `PUT` (editar `group`, `periodId`; **bloqueado si el curso está finalizado**) y `DELETE`. `DELETE` solo procede si el curso no tiene matrículas (activas o no) ni registros según `courseRecordCounters`; si no, `409` (RF-CUR-11).
- `[id]/students/route.ts` — `GET` (lista con datos del usuario y estado de la matrícula) y `POST` (alta individual).
- `[id]/students/import/route.ts` — `POST` con CSV (reemplaza el uso de grupo en `upload-csv`; mismas columnas `Correo, Documento, Nombre, Apellidos`, **sin** `Grupo`, porque el curso sale de la URL).
- `[id]/students/[enrollmentId]/route.ts` — `PUT` (editar nombre, apellido, correo, documento, `isMonitor`, `active`) y no se expone `DELETE`: se desactiva (RF-CUR-04).

Flujo de alta de estudiante (RF-CUR-02), idéntico para individual e importación. Extraerlo a `src/lib/enroll.ts → enrollStudent(courseId, data)`:

1. Rechazar si `assertCourseWritable` falla.
2. Normalizar `email` a minúsculas; exigir nombre, apellido, correo y documento.
3. Buscar usuario por correo.
   - **Existe y es estudiante:** reutilizarlo. Si no tiene `documentId`, asignarlo; si tiene uno distinto, `409` (conflicto de identidad).
   - **Existe y no es estudiante (admin/teacher):** `400`, no se matricula a administradores.
   - **No existe:** crearlo con `role = "student"`, `firstName`, `lastName`, `name`, `documentId` y contraseña inicial `hash(documentId)` (misma convención que `upload-csv`).
4. Si `documentId` ya pertenece a **otro** usuario → `409`.
5. Matrícula: si no existe, crearla; si existe e inactiva, reactivarla (`active = true`, `deactivatedAt = null`); si existe y está activa, `409` "ya matriculado" (RF-CUR-02).
6. Desactivar (RF-CUR-04): `active = false`, `deactivatedAt = now()`. No tocar la cuenta, y la cuenta sigue activa en otros cursos.
7. Escritura de compatibilidad: si `Number(course.group)` es entero positivo, mantener `user.grupo` con ese valor mientras exista el campo; si el estudiante pasa a otro curso o queda sin matrículas activas, recalcularlo. (Se elimina en la fase 8.)

Cambios en endpoints existentes:

- `api/admin/create-user`: para `role = "student"` exigir `courseId` en vez de `grupo` y delegar en `enrollStudent`. Para admin, sin cambios.
- `api/admin/upload-csv`: marcar como obsoleto; que redirija a la importación por curso o que reciba `courseId` en el form-data.
- `api/admin/delete-user`: `409` si tiene matrículas.

### Fase 4 — Script de backfill de datos existentes

Archivo `prisma/backfill-courses.js` (mismo estilo que `seed.js`), **idempotente**, con `--dry-run`. Parámetros por variables de entorno o argumentos (no fijar valores en el código): `SUBJECT_CODE`, `SUBJECT_NAME`, `PERIOD_NAME`, `PERIOD_START`, `PERIOD_END`.

Pasos dentro de una transacción:

1. Buscar `Subject` por `code`; si no existe, crearlo con los datos recibidos.
2. Buscar o crear el `AcademicPeriod`.
3. `UPDATE Topic SET subjectId = <subject> WHERE subjectId IS NULL`.
4. Para cada valor distinto de `User.grupo > 0`, crear (o reutilizar) el `Course` con `group = String(grupo)`, `status = ACTIVE`.
5. Para cada estudiante con `grupo > 0`, crear su `CourseEnrollment` activa en el curso correspondiente.
6. Para cada tema con `visibleGroup1 = false` crear `CourseTopic(curso "1", visible = false)`; análogo para `visibleGroup2` y el curso `"2"`.
7. Imprimir un resumen (cursos, matrículas, temas asociados, filas `CourseTopic`) y, con `--dry-run`, hacer `rollback`.

Antes de ejecutarlo en producción: respaldo con `pg_dump`. Documentar el comando en `docs/MANUAL_TECNICO.md`.

### Fase 5 — Punto de corte: leer visibilidad y acceso desde cursos (RF-ASG-05, RF-CUR-03)

Requiere que la fase 4 ya se haya ejecutado en producción.

- Nueva función `getVisibleTopicSlugs(user)` en `src/lib/courses.ts`:
  - Admin/teacher: todos los temas.
  - Estudiante: obtener sus matrículas activas; un tema es visible si, para **alguna** de esas matrículas con `course.subjectId === topic.subjectId`, no existe `CourseTopic` con `visible = false`. Dos cursos de la misma asignatura se combinan con "alguno lo permite".
  - Fallback transitorio: si el estudiante no tiene ninguna matrícula y `grupo` es 1 o 2, aplicar la regla antigua con `visibleGroup1/2`. Se elimina en la fase 8.
- Reescribir con esa función: `api/topics/visible`, `api/topics/structure` y `app/temas/[slug]/page.tsx`.
- `api/auth/me` y `api/auth/login`: conservar `grupo` en la respuesta y **añadir** `enrollments: [{ courseId, group, status, isMonitor, subject: { code, name }, period: { name } }]`.
- `api/admin/topics/route.ts` (`POST`): cambiar el cuerpo a `{ topicId, courseId, visible }` y hacer `upsert` en `CourseTopic`; si el curso está finalizado, `assertCourseWritable`. `api/admin/topics/sync`: dejar de escribir `visibleGroup1/2`.
- Endpoint nuevo `api/admin/courses/[id]/topics`: `GET` (todos los temas de la asignatura con su `visible` y `publishDate`) y `PUT` (cambio masivo). Si una `publishDate` queda fuera del rango del periodo, la respuesta incluye `warnings` y **guarda igual** (RF-CUR-07).
- La `publishDate` **solo se muestra**, nunca filtra contenido (RF-CUR-03). La visibilidad la define únicamente `visible`.
- `app/perfil/page.tsx`: en la vista de administrador, reemplazar los botones G1/G2 por un botón por cada curso activo de la asignatura (etiqueta con el grupo). En la vista de estudiante, mostrar sus cursos en lugar de la insignia "Grupo N".

### Fase 6 — Estado del curso: activo / finalizado (RF-CUR-05, 08, 09)

**Finalización manual y reactivación**

- `api/admin/courses/[id]/finalize` (`POST`): `status = FINALIZED`, `finalizedAt = now()`. Si ya estaba finalizado, `409`.
- `api/admin/courses/[id]/reactivate` (`POST`): `status = ACTIVE`, `finalizedAt = null`, `reactivatedAt = now()`. Rechazar si `purgedAt` no es nulo. Debe pedir confirmación explícita en la interfaz.

**Finalización automática**

- `src/app/api/cron/finalize-courses/route.ts` (`GET`):
  - Verificar `Authorization: Bearer ${process.env.CRON_SECRET}`; si no coincide, `401`.
  - Finalizar los cursos `ACTIVE` cuyo `period.endDate < todayInBogota()` y que cumplan `reactivatedAt IS NULL OR reactivatedAt < period.endDate` (así un curso reactivado a mano después de terminar el periodo no se vuelve a finalizar solo).
  - Devolver la lista de cursos finalizados.
- `vercel.json` nuevo: `{ "crons": [{ "path": "/api/cron/finalize-courses", "schedule": "30 5 * * *" }] }` (05:30 UTC = 00:30 en Bogotá). Es un cron diario, compatible con el plan Hobby.
- Documentar la variable `CRON_SECRET` (hay que crearla en Vercel).

**Solo lectura (RF-CUR-08)**

- Aplicar `assertCourseWritable` a: editar curso, alta/edición de estudiantes, importación CSV, cambios de `CourseTopic`.
- En la interfaz, un curso finalizado muestra una insignia, deshabilita los formularios de edición y solo ofrece Exportar, Reactivar y Purgar.
- Los estudiantes **siguen pudiendo leer** el temario de un curso finalizado.

**Exportar y purgar (RF-CUR-09)**

- Dependencia nueva: `exceljs` (preferible a `xlsx`, que ya no se publica en npm).
- `api/admin/courses/[id]/export` (`GET`): solo si el curso está finalizado. Genera el `.xlsx` en memoria y lo devuelve como descarga (sin guardar archivos en disco, porque Vercel tiene el sistema de archivos efímero). Hojas: *Curso* (asignatura, periodo, grupo, fechas, estado), *Estudiantes* (nombre, apellido, correo, documento, monitor, activo, fechas), *Temas* (visibilidad y fecha de publicación) y las que aporten los `courseExporters`. Al terminar con éxito, `exportedAt = now()`.
- `api/admin/courses/[id]/purge` (`POST { confirmation }`):
  - Exige `status = FINALIZED` y `exportedAt` no nulo.
  - `confirmation` debe ser exactamente `courseLabel(course)`; si no, `400`.
  - En una transacción: borrar matrículas y filas de `CourseTopic` del curso (más lo que registren los módulos futuros) y fijar `purgedAt = now()`. El registro `Course` y las cuentas de usuario **se conservan**.
- La interfaz de purgar debe mostrar qué se borra y pedir escribir la etiqueta del curso.

### Fase 7 — Cierre de RF-ASG-04 / RF-ASG-05 en el módulo de asignaturas

- `DELETE /api/admin/subjects/[id]`: sustituir el comentario-gancho por:
  1. Si hay cursos `ACTIVE` → `409 "La asignatura tiene cursos activos"`.
  2. Exigir `confirm: true` en el cuerpo (confirmación explícita).
  3. En una transacción: eliminar primero los cursos `FINALIZED` de la asignatura (las matrículas y `CourseTopic` caen en cascada) y luego desasociar los temas y borrar la asignatura.
- `GET /api/admin/subjects/[id]` y la pantalla de detalle (`SubjectDetailClient.tsx`): mostrar la lista de cursos de la asignatura con enlace al curso. **No agregar más lógica a ese archivo (ya tiene unas 990 líneas)**: crear un componente nuevo `SubjectCoursesPanel.tsx`.

### Fase 8 — Retiro de lo obsoleto (solo cuando 5, 6 y 7 estén estables en producción)

Migración posterior, aparte y revisable: eliminar `User.grupo`, `Topic.visibleGroup1/2` y sus índices; borrar el fallback transitorio y la escritura de compatibilidad de `grupo`; limpiar `login`, `me`, `list-users` y los tipos de `perfil`. No ejecutar esta fase sin confirmación del usuario.

## 6. Interfaz de administración

Todo bajo `/admin/dashboard`, protegido con `requireAdminPage()`, reutilizando `useToast`, el tema claro/oscuro y el estilo de `DashboardClient.tsx`.

- `DashboardClient.tsx`: agregar navegación por pestañas *Asignaturas · Periodos · Cursos*.
- `periodos/page.tsx` + `PeriodsClient.tsx`: tabla con crear/editar/eliminar; aviso de advertencias de fechas.
- `cursos/page.tsx` + `CoursesClient.tsx`: listado con filtros (asignatura, periodo, estado), formulario de alta (asignatura, periodo, grupo; las fechas se muestran como heredadas y de solo lectura) e indicador *Activo / Finalizado*.
- `cursos/[id]/page.tsx` + `CourseDetailClient.tsx` con tres secciones:
  1. *Estudiantes*: tabla, alta individual, importación CSV, activar/desactivar, marca de monitor.
  2. *Temario*: visibilidad y fecha de publicación por tema, con advertencias de rango (RF-CUR-07).
  3. *Estado*: finalizar, reactivar, exportar, purgar, eliminar.
- Todos los formularios con campos asociados a su etiqueta, foco visible y mensajes de error accesibles (RNF-USA-01, WCAG 2.1 AA) y diseño responsive.

## 7. Orden de despliegue y reversión

1. Desplegar las fases 1 a 3 (esquema + APIs nuevas; comportamiento visible sin cambios).
2. Ejecutar `prisma migrate deploy` en producción **antes** del despliegue (o encadenado en el build, decisión del usuario).
3. Respaldo con `pg_dump`, y luego `node prisma/backfill-courses.js --dry-run` seguido de la ejecución real.
4. Desplegar la fase 5 (corte de lectura) y verificar con un estudiante de cada grupo.
5. Desplegar la fase 6 y configurar `CRON_SECRET` en Vercel.
6. Fase 8 solo después de un periodo de estabilidad.

Reversión: las fases 1–7 son aditivas. Si algo falla tras la fase 5, redesplegar el commit anterior; `User.grupo` y `visibleGroup1/2` siguen intactos y vigentes (gracias a la escritura de compatibilidad de la fase 3).

## 8. Matriz de trazabilidad

| Requisito | Fase | Elemento clave |
|---|---|---|
| RF-CUR-01 | 3 | `POST /api/admin/courses` (fechas heredadas del periodo) |
| RF-CUR-02 | 3 | `enrollStudent`: crea o reutiliza cuenta y matricula |
| RF-CUR-03 | 5 | `CourseTopic.publishDate` informativa |
| RF-CUR-04 | 3 | Desactivar matrícula; `User → Enrollment` en `Restrict` |
| RF-CUR-05 | 6 | Cron diario + finalización manual |
| RF-CUR-06 | 1, 3 | `@@unique([subjectId, periodId, group])` + manejo de `P2002` |
| RF-CUR-07 | 2, 5 | `startDate < endDate` bloqueante; fechas fuera de rango solo advierten |
| RF-CUR-08 | 6 | `assertCourseWritable` y reactivación |
| RF-CUR-09 | 6 | Exportar `.xlsx` y purgar con confirmación escrita |
| RF-CUR-10 | 2 | CRUD de periodos |
| RF-CUR-11 | 3 | `DELETE` condicionado a no tener estudiantes ni registros |
| RF-ASG-04 | 7 | Bloqueo por cursos activos + borrado en cascada de finalizados |
| RF-ASG-05 | 5 | Temario heredado vía `Subject`; `CourseTopic` sin duplicar temas |
| RNF-OPE-01 | 4, 6 | `src/lib/dates.ts` con `America/Bogota` |

## 9. Verificación

No hay pruebas automatizadas en el repositorio. Para cada fase:

1. `npx tsc --noEmit`, `npm run lint` y `npm run build` sin errores.
2. Con la base local (docker) y el servidor de desarrollo, comprobar manualmente:
   - Crear dos cursos del mismo periodo y asignatura (grupos 1 y 2) y un tercero; intentar duplicar el grupo → `409`.
   - Periodo con `startDate >= endDate` → `400`.
   - Matricular un estudiante nuevo y luego el mismo correo en otro curso (reutiliza cuenta); repetir en el mismo curso → `409`.
   - Desactivar una matrícula: el estudiante conserva la cuenta y su otro curso.
   - Alternar la visibilidad de un tema en el grupo 1: el estudiante del grupo 2 sigue viéndolo.
   - Finalizar un curso y comprobar que las escrituras devuelven `409`; reactivar.
   - Llamar al cron con y sin `CRON_SECRET`; con un periodo de fecha final pasada, el curso se finaliza, y un curso reactivado después no se vuelve a finalizar.
   - Exportar el `.xlsx`, abrirlo y comprobar las hojas; purgar con confirmación incorrecta (`400`) y correcta.
   - Borrar una asignatura con un curso activo → `409`; con solo finalizados y `confirm: true` → se elimina todo en cascada.
3. Ensayar el backfill con `--dry-run` contra una copia de la base antes de la ejecución real.
4. Actualizar `docs/ENTIDADES.md` (marcar las entidades implementadas), `docs/MANUAL_TECNICO.md` y `docs/MANUAL_USUARIO.md`.

## 10. Decisiones abiertas (con el valor por defecto que asume este plan)

| # | Pregunta | Por defecto |
|---|---|---|
| 1 | Datos del backfill: código y nombre de la asignatura, y nombre y fechas del periodo al que pertenecen hoy los grupos 1 y 2 | **Pendiente del usuario** (el script los recibe por parámetro) |
| 2 | La visibilidad por curso (`CourseTopic.visible`) sigue bloqueando el acceso, aunque `publishDate` no lo haga | Sí: conserva el comportamiento actual de G1/G2 |
| 3 | Nombre y apellido separados | Se agregan `firstName`/`lastName`; `name` se conserva y se sincroniza. Los usuarios existentes no se parten |
| 4 | Qué incluye "purgar" | Matrículas y datos del curso; se conservan la fila `Course` y las cuentas |
| 5 | Contraseña inicial de estudiantes nuevos | El documento de identidad (convención actual de `upload-csv`). Es débil; conviene forzar el cambio en el primer ingreso, fuera del alcance de este módulo |
| 6 | Reactivar un curso cuyo periodo ya terminó | Permitido; el cron no lo vuelve a finalizar (`reactivatedAt`) |
| 7 | Migrar las migraciones en el build (`prisma migrate deploy`) | Manual, antes de cada despliegue que traiga migraciones |
