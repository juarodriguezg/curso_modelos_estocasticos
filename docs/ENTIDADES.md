# Entidades del Sistema

**Proyecto:** Curso de Modelos Estocásticos y Simulación en Computación y Comunicaciones  
**Documento base:** `docs/REQUISITOS.md`  
**Versión:** 1.0  
**Estado:** Propuesta de modelo de datos

---

## 1. Convenciones

- Todos los identificadores son `String @id @default(cuid())`.
- Las entidades principales incluyen `createdAt` y `updatedAt`, salvo las tablas puente.
- Las fechas y plazos se interpretan en la zona horaria `America/Bogota`.
- `User` **no almacena contraseña**. La autenticación se realiza con Google Workspace.
- El rol **Profesor** no se crea como rol separado: comparte el rol `ADMIN`.
- **Monitor** no es un rol global: es una designación por curso mediante `CourseEnrollment.isMonitor`.
- `Asignatura` es la entidad padre. `Curso` es una asignatura ofrecida en un periodo y grupo.
- El curso **hereda las fechas del periodo académico**.

### 1.1 Equivalencias de nombres

| Término del dominio | Modelo en Prisma | Origen |
|---|---|---|
| Asignatura | `Subject` | Nueva |
| Tema | `Topic` | Existente |
| Contenido | `Content` | Existente |
| Curso | `Course` | Nueva |
| Periodo académico | `AcademicPeriod` | Nueva |

`Topic` **es el mismo concepto que Tema**; es el nombre técnico que ya utiliza el proyecto. No se crea un modelo `Tema` separado para no duplicar la entidad ni romper las consultas existentes como `prisma.topic`. De igual forma, `Content` es Contenido.

La jerarquía del temario queda así:

```text
Subject (Asignatura)
  └── Topic (Tema)
        └── Content (Contenido)
              └── ContentResource (recursos)
```

El esquema actual solo tiene `Topic` y `Content`; le falta el nivel padre `Subject`, que es lo que permite distinguir a qué asignatura pertenece cada tema.

---

## 2. Enumeraciones

```prisma
enum Role {
  ADMIN
  STUDENT
}

enum CourseStatus {
  ACTIVE
  FINALIZED
}

enum ResourceKind {
  LINK
  FILE
}

enum CandidateStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

enum ChapterProcessStatus {
  PUBLISHED
  OPEN
  ASSIGNED
  CLOSED
}

enum GradeSource {
  MANUAL
  TASK_AVERAGE
}

enum NotificationType {
  TASK_ENABLED
  READING_LIST
  READING_TURN
  READING_OPEN
}
```

---

## 3. Resumen de cambios frente al esquema actual

| Modelo actual | Destino |
|---|---|
| `User` | **Fase actual: sin cambios.** Objetivo futuro: sin `password`, con `firstName`, `lastName`, `documentId` y `role` como enum. |
| `Session` | Se conserva. |
| `Topic` | **Fase actual: aditiva** — se añade `subjectId` opcional; conserva `title`, `slug`, `parte`, `parentSlug`, `visibleGroup1/2`. Objetivo futuro: pertenecer a `Subject` de forma obligatoria y subtemas por FK. |
| `Content` | **Fase actual: sin cambios** (`type`/`content`). Objetivo futuro: `name`, `body` y recursos asociados. |
| `Link` | **Fase actual: sin cambios.** Objetivo futuro: reemplazar por `ContentResource` o `Material` + `MaterialTopic`. |
| `Subject` | **Nueva, implementada (fase 4.1).** |
| — | Las demás entidades (académicas, biblioteca, lecturas, tareas, evaluación, bonos, asistencia, notificaciones, auditoría) siguen siendo propuesta futura. |

### 3.1 Entidades existentes y nuevas

| Entidad | Origen |
|---|---|
| `User` | Existente, modificada |
| `Session` | Existente |
| `Topic` | Existente, modificada (aditivo: `subjectId`) en fase 4.1 |
| `Content` | Existente (sin cambios en fase 4.1) |
| `Subject` | Nueva, **implementada (fase 4.1)** |
| `AcademicPeriod` | Nueva |
| `Course` | Nueva |
| `CourseEnrollment` | Nueva |
| `ContentResource` | Nueva |
| `MaterialCategory` | Nueva |
| `Material` | Nueva |
| `MaterialTopic` | Nueva |
| `CourseReading` | Nueva |
| `Chapter` | Nueva |
| `ChapterProcess` | Nueva |
| `ChapterCandidate` | Nueva |
| `ChapterAssignment` | Nueva |
| `Task` | Nueva |
| `TaskOffering` | Nueva |
| `TaskAttachment` | Nueva |
| `TaskRange` | Nueva |
| `TaskRangeTask` | Nueva |
| `EvaluationItem` | Nueva |
| `EvaluationAssignment` | Nueva |
| `FinalGrade` | Nueva |
| `BonusConcept` | Nueva |
| `Bonus` | Nueva |
| `ClassSession` | Nueva |
| `ClassSessionContent` | Nueva |
| `Attendance` | Nueva |
| `Notification` | Nueva |
| `PushSubscription` | Nueva, opcional |
| `AuditLog` | Nueva |

---

## 4. Entidades

### 4.1 Identidad y acceso

#### `User` — existente, modificado

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `email` | `String @unique` | Correo registrado por el administrador; se usa para el SSO. |
| `firstName` | `String` | Nombres. |
| `lastName` | `String` | Apellidos. |
| `documentId` | `String? @unique` | Documento de identificación. |
| `role` | `Role` | `ADMIN` o `STUDENT`. Profesor = ADMIN. |
| `image` | `String?` | Foto o avatar opcional. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Relaciones: sesiones, matrículas, notificaciones, suscripciones push, bonos creados, auditoría, calificaciones finales sobrescritas, candidaturas y asignaciones de lectura, asistencia y asignaciones de evaluación.

Regla: **no existe el campo `password`**.

#### `Session` — existente

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `userId` | `String` | Usuario autenticado. |
| `token` | `String @unique` | Token de sesión. |
| `expiresAt` | `DateTime` | Vencimiento. |
| `createdAt` | `DateTime` | Fecha de creación. |

Relación: `user` con `onDelete: Cascade`.

#### `Notification` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `userId` | `String` | Destinatario. |
| `type` | `NotificationType` | Tipo de notificación. |
| `title` | `String` | Título. |
| `body` | `String @db.Text` | Contenido. |
| `readAt` | `DateTime?` | Fecha de lectura. |
| `emailSentAt` | `DateTime?` | Fecha de envío por correo. |
| `createdAt` | `DateTime` | Fecha de creación. |

Tipos: tarea habilitada, lista de candidatos, turno de lectura y capítulo abierto. Las calificaciones no generan notificación.

#### `PushSubscription` — nueva, opcional

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `userId` | `String` | Usuario. |
| `endpoint` | `String @unique` | Endpoint de Web Push. |
| `p256dh` | `String` | Clave pública. |
| `auth` | `String` | Secreto de autenticación. |
| `createdAt` | `DateTime` | Fecha de creación. |

Se incluye porque Web Push podrá habilitarse como canal adicional.

---

### 4.2 Núcleo académico

#### `Subject` — nueva · **IMPLEMENTADA (fase aditiva 4.1)**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador. |
| `code` | `String @unique` | Código único de la asignatura. |
| `name` | `String` | Nombre. |
| `credits` | `Int @default(0)` | Créditos. |
| `objective` | `String @db.Text` | Objetivo general. |
| `specificObjectives` | `String[] @default([])` | Objetivos específicos (arreglo nativo de PostgreSQL). |
| `createdAt` | `DateTime @default(now())` | Fecha de creación. |
| `updatedAt` | `DateTime @updatedAt` | Fecha de actualización. |

Relaciones: `topics Topic[]` (implementada). A futuro: cursos, tareas e ítems de evaluación (aún no implementadas en esta fase).

Reglas:

- Se puede eliminar solo si no tiene cursos activos. Como el modelo `Course` aún no existe, esta condición se cumple trivialmente; al eliminar una asignatura, sus temas **no se borran**: se desasocian poniendo `Topic.subjectId = null` (gracias al `onDelete: SetNull` de la relación).
- La eliminación en cascada de cursos finalizados se aplicará cuando exista el módulo de Cursos (4.3).

> **Estado**: este modelo ya está en `prisma/schema.prisma` y aplicado por la migración `add_subject`. Es la única entidad nueva del rediseño implementada hasta ahora; el resto de esta sección 4 (Course, Material, Task, etc.) sigue siendo propuesta futura.

#### `AcademicPeriod` — nueva · **IMPLEMENTADA (módulo 4.3)**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `name` | `String @unique` | Nombre del periodo, por ejemplo `2026-1S`. |
| `startDate` | `DateTime @db.Date` | Fecha de inicio. |
| `endDate` | `DateTime @db.Date` | Fecha final. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Relación: cursos.

Regla: `startDate` debe ser anterior a `endDate`.

#### `Course` — nueva · **IMPLEMENTADA (módulo 4.3)**

Implementada con los campos de esta tabla más `reactivatedAt`, `exportedAt` y `purgedAt` (ver `docs/PLAN_MODULO_4_3.md`). El estado finalizado se llama `FINALIZED`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `subjectId` | `String` | Asignatura. |
| `periodId` | `String` | Periodo académico. |
| `group` | `String` | Grupo o sección. |
| `status` | `CourseStatus` | `ACTIVE` o `FINALIZED`. |
| `finalizedAt` | `DateTime?` | Fecha de finalización. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Restricción: `@@unique([subjectId, periodId, group])`.

Relaciones: asignatura, periodo, matrículas, tareas habilitadas, rangos de tareas, lectura, bonos, clases, asignaciones de evaluación y notas finales.

Reglas:

- No tiene fechas propias: las hereda del periodo.
- Se finaliza automáticamente al terminar el periodo, o manualmente por el administrador.
- Un curso finalizado queda en solo lectura.
- Se puede eliminar solo si no tiene estudiantes ni registros académicos.

#### `CourseEnrollment` — nueva · **IMPLEMENTADA (módulo 4.3)**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `courseId` | `String` | Curso. |
| `userId` | `String` | Estudiante. |
| `active` | `Boolean` | Matrícula activa. |
| `isMonitor` | `Boolean` | Designación como Monitor del curso. |
| `enrolledAt` | `DateTime` | Fecha de matrícula. |
| `deactivatedAt` | `DateTime?` | Fecha de desactivación. |

Restricción: `@@unique([courseId, userId])`.

Reglas:

- Un estudiante puede estar en varios cursos.
- No puede repetirse en el mismo curso.
- Desactivar la matrícula conserva la cuenta y el historial.
- `isMonitor` solo aplica al curso correspondiente.

---

#### `CourseTopic` — nueva · **IMPLEMENTADA (módulo 4.3)**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `courseId` | `String` | Curso. |
| `topicId` | `String` | Tema de la asignatura del curso. |
| `visible` | `Boolean @default(true)` | Visibilidad del tema para los estudiantes del curso. Reemplaza a `Topic.visibleGroup1/2`. |
| `publishDate` | `DateTime? @db.Date` | Fecha de publicación informativa (no restringe el acceso). |

Restricción: `@@unique([courseId, topicId])`. Sin fila, el tema es visible y no tiene fecha: el curso hereda el temario sin duplicarlo (RF-ASG-05).

### 4.3 Temario y contenidos

#### `Topic` — existente, **modificado de forma aditiva**

Estado real del esquema (`prisma/schema.prisma`). En la fase aditiva 4.1 se conservan todos los campos originales del proyecto y solo se añade `subjectId` opcional. No se renombró `title` a `name` ni se eliminó la jerarquía por strings (`parte`/`parentSlug`), para no romper el sidebar, la página de temas, el editor ni el endpoint de sincronización existentes.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador. |
| `slug` | `String @unique` | Identificador legible para URLs. |
| `title` | `String` | Título del tema (nombre). |
| `order` | `Int @default(0)` | Orden de presentación. |
| `parte` | `String?` | Agrupación de alto nivel (p. ej. "Parte 1: Vectores Aleatorios"). |
| `parentSlug` | `String?` | Slug del tema padre, para subtemas (jerarquía por string). |
| `subjectId` | `String?` | **Nuevo (aditivo).** Asignatura a la que pertenece. Opcional: los temas pueden existir sin asignatura. |
| `visibleGroup1` | `Boolean @default(true)` | Visibilidad para el grupo 1. |
| `visibleGroup2` | `Boolean @default(true)` | Visibilidad para el grupo 2. |
| `createdAt` | `DateTime @default(now())` | Fecha de creación. |
| `updatedAt` | `DateTime @updatedAt` | Fecha de actualización. |

Relaciones: `contents Content[]`, `links Link[]`, y `subject Subject?` (nueva, `onDelete: SetNull`).

Notas sobre el modelo objetivo (futuro, no implementado en esta fase):

- El diseño objetivo contemplaba `name` en lugar de `title`, `parentTopicId` (FK) en lugar de `parentSlug` (string), `@@unique([subjectId, slug])` y la eliminación de `visibleGroup1/2`. Esos cambios se difieren para no romper el código actual; migrar a ellos es trabajo de una fase posterior.

#### `Content` — existente, **sin cambios en la fase aditiva 4.1**

Estado real del esquema (`prisma/schema.prisma`). El módulo 4.1 no modifica `Content`; se documenta aquí tal como existe hoy.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String @id @default(cuid())` | Identificador. |
| `topicId` | `String` | Tema. |
| `type` | `String` | Tipo de contenido: `"TEXT"`, `"VIDEO"` o `"MATERIAL"` (string libre, sin enum). |
| `content` | `String @db.Text` | Texto (con posibles delimitadores LaTeX), URL de video o URL de material según el `type`. |
| `order` | `Int @default(0)` | Orden dentro del tema. |

Relación: `topic Topic` con `onDelete: Cascade`.

Notas sobre el modelo objetivo (futuro, no implementado en esta fase):

- El diseño objetivo contemplaba renombrar a `name`/`body`, añadir `createdAt`/`updatedAt` y mover los recursos a un modelo `ContentResource` (reemplazando `Link`). Esos cambios se difieren a una fase posterior; hoy los enlaces siguen viviendo en el modelo `Link` y los recursos de contenido en el propio campo `content`.

#### `ContentResource` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `contentId` | `String` | Contenido. |
| `kind` | `ResourceKind` | Enlace o archivo. |
| `title` | `String` | Título del recurso. |
| `url` | `String?` | URL externa. |
| `filePath` | `String?` | Ruta del archivo subido. |
| `order` | `Int` | Orden. |

Regla: debe tener `url` o `filePath`, al menos uno.

---

### 4.4 Biblioteca digital

#### `MaterialCategory` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `name` | `String @unique` | Nombre de la categoría. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Catálogo global reutilizable por todos los cursos.

#### `Material` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `name` | `String` | Nombre del material. |
| `author` | `String` | Autor. |
| `categoryId` | `String` | Categoría. |
| `url` | `String?` | Enlace externo. |
| `filePath` | `String?` | Archivo subido. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Regla: debe tener `url` o `filePath`, al menos uno.

Relaciones: categoría, temas asociados, tareas que lo enlazan y lecturas de curso.

#### `MaterialTopic` — nueva, tabla puente

| Campo | Tipo | Descripción |
|---|---|---|
| `materialId` | `String` | Material. |
| `topicId` | `String` | Tema. |

Restricción: `@@id([materialId, topicId])`.

Un material puede asociarse a varios temas.

---

### 4.5 Lecturas

#### `CourseReading` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `courseId` | `String @unique` | Curso. |
| `materialId` | `String` | Libro de la biblioteca. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Regla: cada curso tiene **una única lectura**.

#### `Chapter` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `materialId` | `String` | Libro al que pertenece. |
| `name` | `String` | Nombre del capítulo. |
| `startPage` | `Int` | Página inicial. |
| `endPage` | `Int` | Página final. |
| `order` | `Int` | Orden. |

Restricción: `@@unique([materialId, name])`.

Los capítulos pertenecen al libro y se reutilizan en todos los cursos donde se asigne.

#### `ChapterProcess` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `chapterId` | `String` | Capítulo. |
| `courseId` | `String` | Curso. |
| `roundNumber` | `Int` | Número de ronda. |
| `status` | `ChapterProcessStatus` | Estado del proceso. |
| `publishedAt` | `DateTime?` | Fecha de publicación de la lista. |
| `openUntil` | `DateTime?` | Fin de la apertura de 24 horas. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Restricción: `@@unique([chapterId, courseId, roundNumber])`.

Estados:

- `PUBLISHED`: lista de candidatos publicada.
- `OPEN`: capítulo vacante abierto durante 24 horas.
- `ASSIGNED`: capítulo asignado.
- `CLOSED`: cerrado sin asignación.

#### `ChapterCandidate` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `processId` | `String` | Proceso del capítulo. |
| `studentId` | `String` | Estudiante candidato. |
| `position` | `Int` | Posición 1, 2 o 3. |
| `status` | `CandidateStatus` | Estado del turno. |
| `turnExpiresAt` | `DateTime?` | Vencimiento del turno. |
| `respondedAt` | `DateTime?` | Fecha de respuesta. |

Restricciones:

- `@@unique([processId, position])`
- `@@unique([processId, studentId])`

Reglas:

- Solo el candidato en primera posición puede aceptar.
- Si rechaza o vence, pasa el siguiente.
- La primera posición vence a las 23:59 del día de publicación.
- La segunda, a las 12:00 del día siguiente.
- La tercera, a las 18:00 del día siguiente a ese.

#### `ChapterAssignment` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `processId` | `String @unique` | Proceso. |
| `studentId` | `String` | Estudiante asignado. |
| `acceptedAt` | `DateTime` | Fecha de aceptación. |

Se crea cuando un candidato o un estudiante acepta el capítulo.

---

### 4.6 Tareas

#### `Task` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `subjectId` | `String` | Asignatura. |
| `name` | `String` | Nombre de la tarea. |
| `statement` | `String @db.Text` | Enunciado. |
| `materialId` | `String?` | Material de la biblioteca enlazado. |
| `topicId` | `String?` | Tema del temario. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

La tarea se define en la asignatura y se habilita en los cursos mediante `TaskOffering`.

#### `TaskOffering` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `taskId` | `String` | Tarea. |
| `courseId` | `String` | Curso. |
| `publicationDate` | `DateTime?` | Fecha informativa de publicación. |
| `unlockAt` | `DateTime` | Fecha de desbloqueo. |
| `dueAt` | `DateTime` | Fecha de vencimiento. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Restricción: `@@unique([taskId, courseId])`.

Reglas:

- Antes de `unlockAt` la tarea no es visible para el estudiante.
- Entre `unlockAt` y `dueAt` está vigente.
- Después de `dueAt` sigue visible, marcada como vencida.

#### `TaskAttachment` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `taskOfferingId` | `String` | Tarea habilitada. |
| `kind` | `ResourceKind` | Enlace o archivo. |
| `title` | `String` | Título. |
| `url` | `String?` | URL externa. |
| `filePath` | `String?` | Archivo subido. |
| `order` | `Int` | Orden. |

Regla: debe tener `url` o `filePath`, al menos uno.

#### `TaskRange` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `courseId` | `String` | Curso. |
| `name` | `String` | Nombre del rango o corte. |
| `startDate` | `DateTime` | Inicio del rango de publicación. |
| `endDate` | `DateTime` | Fin del rango de vencimiento. |
| `evaluationItemId` | `String?` | Ítem de evaluación asociado o creado. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

#### `TaskRangeTask` — nueva, tabla puente

| Campo | Tipo | Descripción |
|---|---|---|
| `taskRangeId` | `String` | Rango. |
| `taskOfferingId` | `String` | Tarea habilitada. |

Restricción: `@@id([taskRangeId, taskOfferingId])`.

El promedio aritmético simple de estas n tareas se registra como calificación del ítem de evaluación asociado. Las tareas sin calificación cuentan como cero.

---

### 4.7 Evaluación

#### `EvaluationItem` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `subjectId` | `String` | Asignatura. |
| `name` | `String` | Nombre del ítem. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Restricción: `@@unique([subjectId, name])`.

El ítem se define en la asignatura y se aplica en los cursos.

#### `EvaluationAssignment` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `courseId` | `String` | Curso. |
| `evaluationItemId` | `String` | Ítem. |
| `studentId` | `String` | Estudiante. |
| `percentage` | `Decimal @db.Decimal(5,2)` | Porcentaje individual. |
| `grade` | `Decimal? @db.Decimal(3,2)` | Calificación del ítem. |
| `gradeSource` | `GradeSource?` | Manual o promedio de tareas. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Restricción: `@@unique([courseId, evaluationItemId, studentId])`.

Reglas:

- El porcentaje puede variar por estudiante.
- La suma distinta de 100% solo genera advertencia.
- La calificación va de 0.00 a 5.00.

#### `FinalGrade` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `courseId` | `String` | Curso. |
| `studentId` | `String` | Estudiante. |
| `calculated` | `Decimal @db.Decimal(3,2)` | Nota calculada. |
| `override` | `Decimal? @db.Decimal(3,2)` | Nota sobrescrita. |
| `overrideReason` | `String?` | Justificación. |
| `overriddenById` | `String?` | Usuario que sobrescribió. |
| `calculatedAt` | `DateTime` | Fecha de cálculo. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Restricción: `@@unique([courseId, studentId])`.

La nota final es `override ?? calculated`, con dos decimales y redondeo estándar.

---

### 4.8 Bolsa de bonos

#### `BonusConcept` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `name` | `String @unique` | Nombre del concepto. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Catálogo global. No tiene límite fijo de diez conceptos.

#### `Bonus` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `courseId` | `String` | Curso. |
| `studentId` | `String` | Estudiante. |
| `conceptId` | `String?` | Concepto; nulo cuando es «Otro». |
| `description` | `String?` | Descripción libre para «Otro». |
| `points` | `Int` | Puntos. |
| `date` | `DateTime` | Fecha de los puntos. |
| `createdById` | `String` | Usuario que registró. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Reglas:

- `points` debe ser entero positivo.
- El total por estudiante y curso no puede superar 10 puntos.
- Máximo 4 bonos por estudiante y curso con concepto «Examen Lectura».
- Si `conceptId` es nulo, `description` es obligatoria.
- Monitor y Administrador pueden editar o eliminar con trazabilidad.

---

### 4.9 Asistencia

#### `ClassSession` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `courseId` | `String` | Curso. |
| `startsAt` | `DateTime` | Fecha y hora de realización. |
| `endsAt` | `DateTime?` | Hora de finalización opcional. |
| `topicId` | `String?` | Tema asociado. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de actualización. |

Relaciones: curso, tema, contenidos y asistencias. No se validan solapamientos.

#### `ClassSessionContent` — nueva, tabla puente

| Campo | Tipo | Descripción |
|---|---|---|
| `classSessionId` | `String` | Clase. |
| `contentId` | `String` | Contenido. |

Restricción: `@@id([classSessionId, contentId])`.

#### `Attendance` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `classSessionId` | `String` | Clase. |
| `studentId` | `String` | Estudiante. |
| `present` | `Boolean` | Presente o ausente. |

Restricción: `@@unique([classSessionId, studentId])`.

Se registra un registro por estudiante matriculado; los no seleccionados quedan como ausentes.

---

### 4.10 Auditoría

#### `AuditLog` — nueva

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `String` | Identificador. |
| `actorId` | `String?` | Usuario que realizó el cambio. |
| `action` | `String` | Crear, editar o eliminar. |
| `entity` | `String` | Entidad afectada. |
| `entityId` | `String` | Identificador del registro. |
| `oldValues` | `Json?` | Valores anteriores. |
| `newValues` | `Json?` | Valores nuevos. |
| `createdAt` | `DateTime` | Fecha del cambio. |

Se usa para calificaciones, bonos y asistencia.

---

## 5. Migración desde el esquema actual

### 5.1 Fase actual — migración aditiva 4.1 (implementada)

La implementación del módulo 4.1 se hizo de forma **aditiva y no destructiva**, sin borrar datos ni romper el código existente. Lo aplicado:

1. **Asignaturas:** se añadió la tabla `Subject` y la columna opcional `Topic.subjectId` (nullable, `ON DELETE SET NULL`). Migración `add_subject`. Los temas existentes quedan sin asignatura hasta que un administrador los asocie.
2. **Autenticación y usuarios:** **sin cambios.** Se conserva el login por contraseña (`User.password`), `role` como `String` (`admin`/`teacher`/`student`) y `User.grupo`. El SSO de Google queda fuera de alcance por ahora.
3. **Temas y contenidos:** **sin cambios destructivos.** `Topic` conserva `title`, `slug`, `parte`, `parentSlug`, `visibleGroup1/2`; `Content` conserva `type`/`content`; `Link` se mantiene.
4. **Datos existentes:** preservados. La migración solo agrega estructura; no reescribe ni elimina filas.

### 5.2 Fase futura — migración al modelo objetivo completo (propuesta, no implementada)

Cuando se aborde el rediseño completo (resto de módulos), los pasos serían:

1. **Usuarios:** eliminar `password`; dividir `name` en `firstName` y `lastName`; mapear `role`: `admin` y `teacher` a `ADMIN`, `student` a `STUDENT`.
2. **Grupos:** reemplazar `User.grupo` por `Course.group` y `CourseEnrollment`. Crear cursos para los grupos 1 y 2 existentes.
3. **Temas:** asociar los `Topic` actuales a sus `Subject`; convertir `parentSlug` en `parentTopicId` y `title` en `name`.
4. **Contenidos:** mover `Content.content` a `Content.body`; convertir `type` y `Link` en `ContentResource` o `Material`.
5. **Enlaces:** migrar `Link` a `Material` con categoría «Enlaces» y `MaterialTopic`, o a `ContentResource` si pertenece a un contenido.
6. **Visibilidad por grupo:** `visibleGroup1` y `visibleGroup2` no forman parte del modelo objetivo; se reemplazan por matrícula en curso y reglas de publicación.
7. **Sesiones:** conservar `Session`; el token se crea después del inicio de sesión con Google.
8. **Datos existentes:** si la base no tiene información relevante, reescribir el esquema con una migración limpia; si tiene datos, hacer migración incremental con respaldo previo.
