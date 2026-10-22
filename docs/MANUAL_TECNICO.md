# Manual técnico — Curso de Modelos Estocásticos (plataforma web)

Este documento describe la arquitectura, el modelo de datos, las rutas de API y las convenciones del proyecto, para que otra persona pueda darle mantenimiento sin haber participado en su desarrollo original.

## 1. Visión general

Aplicación web construida con **Next.js 16 (App Router)** y **TypeScript**, que sirve como plataforma del curso "Modelos Estocásticos y Simulación en Computación y Comunicaciones" (Universidad Nacional de Colombia). Permite:

- Autenticación de usuarios (estudiantes, profesores, administradores).
- Publicación de contenido del curso organizado en temas (texto, video, material descargable, enlaces/tareas).
- Visibilidad de temas diferenciada por grupo de estudiantes (Grupo 1 / Grupo 2).
- Panel de administración para gestionar usuarios y contenido, incluida carga masiva de estudiantes vía CSV.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 + variables CSS propias (tema claro/oscuro) |
| ORM / BD | Prisma ORM sobre PostgreSQL |
| Autenticación | Tokens de sesión propios (no JWT firmado pese al nombre `JWT_SECRET`) + cookie `httpOnly` |
| Íconos | lucide-react |
| Fórmulas matemáticas | react-katex / KaTeX |
| CSV | csv-parse |
| Lint/format | Biome |

> Nota: el README describe el mecanismo de sesión como "JWT + Cookies", pero la implementación real (`src/app/api/auth/login/route.ts`) genera un token aleatorio opaco (`crypto.randomBytes`) y lo persiste en la tabla `Session`, no un JWT firmado. `jsonwebtoken` está en las dependencias pero no se usa actualmente en el código de autenticación.

## 2. Estructura de carpetas

```
curso_modelos_estocasticos/
├── prisma/
│   ├── schema.prisma            # Esquema de la base de datos
│   ├── migrations/               # Migraciones versionadas
│   └── seed.js                   # Crea un usuario admin de prueba
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing pública
│   │   ├── layout.tsx             # Layout raíz (fuente, ToastProvider)
│   │   ├── not-found.tsx          # Página 404
│   │   ├── globals.css            # Variables de tema (claro/oscuro) y estilos base
│   │   ├── login/page.tsx         # Formulario de inicio de sesión
│   │   ├── perfil/
│   │   │   ├── page.tsx           # Perfil del usuario + panel admin
│   │   │   └── tema/[id]/page.tsx # Editor de contenido de un tema (solo admin)
│   │   ├── temas/[slug]/page.tsx  # Página pública de un tema del curso
│   │   └── api/
│   │       ├── auth/              # login, logout, me (register deshabilitado)
│   │       ├── admin/             # create-user, delete-user, list-users, upload-csv,
│   │       │                      # topics (list/visibility), topics/create, topics/[id], topics/sync
│   │       └── topics/            # structure (árbol para el sidebar), visible (filtrado por grupo)
│   ├── components/
│   │   ├── Sidebar.tsx            # Navegación jerárquica (Partes → Secciones → Subtemas)
│   │   ├── ClassLayout.tsx        # Layout reutilizable (sin uso actualmente; ver sección 6.6)
│   │   ├── LatexContent.tsx       # Renderiza bloques TEXT: detecta $formula$/$$formula$$ y usa react-katex, resto como HTML
│   │   ├── Footer.tsx
│   │   └── Toast.tsx              # Sistema de notificaciones (contexto React)
│   ├── lib/
│   │   ├── prisma.ts              # Cliente Prisma singleton
│   │   ├── auth.ts                # Hash/verificación de contraseña, generación de token, validaciones
│   │   ├── session.ts             # Helper de autenticación para API/servidor: getUserFromToken, requireAdmin
│   │   ├── url.ts                 # Validación de URLs de video, material y enlaces
│   │   └── authUtils.ts           # Utilidades de cliente: limpiar sesión, verificar sesión
│   └── middleware.ts              # Protección de rutas por cookie de sesión
└── public/
    └── documents/                 # Materiales PDF servidos estáticamente
```

## 3. Modelo de datos (Prisma / PostgreSQL)

Archivo fuente: `prisma/schema.prisma`.

### `User`
| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | PK |
| email | String | único, se guarda en minúsculas |
| name | String? | |
| password | String | hash bcrypt |
| role | String | `"student"` \| `"teacher"` \| `"admin"` (sin enum, valor libre) |
| grupo | Int | `0` para no-estudiantes; `1` o `2` para estudiantes |
| sessions | Session[] | relación 1—N |

### `Session`
| Campo | Notas |
|---|---|
| token | único, string aleatorio de 32 bytes en hex |
| expiresAt | 7 días desde la creación |
| userId | FK a `User`, `onDelete: Cascade` |

### `Topic` (tema del curso)
| Campo | Notas |
|---|---|
| slug | único, usado en la URL `/temas/[slug]` |
| title | título mostrado |
| order | orden de aparición en el sidebar |
| parte | agrupación de alto nivel (p. ej. "Parte 1: Vectores Aleatorios"); `null` → se agrupa como "Otros" |
| parentSlug | slug del tema padre, para representar subtemas (jerarquía de 2 niveles: Parte → Sección → Subtema) |
| visibleGroup1 / visibleGroup2 | booleanos independientes; controlan si el tema aparece para cada grupo de estudiantes |
| contents | Content[] |
| links | Link[] |

### `Content` (bloque de contenido de un tema)
| Campo | Notas |
|---|---|
| type | `"TEXT"` \| `"VIDEO"` \| `"MATERIAL"` (string libre, sin enum) |
| content | texto HTML/plano con posibles delimitadores LaTeX `$...$`/`$$...$$` (TEXT, renderizado por `LatexContent.tsx` vía react-katex), URL de embed de YouTube o Google Drive `/preview` (VIDEO), o URL de archivo (MATERIAL) |
| order | orden dentro del tema |

### `Link` (enlace/tarea asociado a un tema)
`title`, `url`, `order`.

### Notas de diseño relevantes
- La jerarquía de temas es de **dos niveles** (`parentSlug` apunta siempre a un tema raíz, no hay anidamiento arbitrario).
- La visibilidad por grupo es un mecanismo simple de *feature flag* por fila, no un sistema de permisos genérico.
- No hay borrado lógico: `DELETE` en usuarios y recreación de `Content`/`Link` en cada `PUT` de tema son operaciones destructivas reales (ver sección 6).

## 4. Autenticación y autorización

### Flujo de login (`POST /api/auth/login`)
1. Busca el usuario por email (case-insensitive vía `.toLowerCase()`).
2. Verifica la contraseña con bcrypt (`src/lib/auth.ts`).
3. Genera un token aleatorio (`crypto.randomBytes(32).toString('hex')`) y crea una fila en `Session` con expiración a 7 días.
4. Devuelve el token en el body **y** lo fija como cookie `httpOnly` (`token`), `sameSite=lax`, `secure` solo en producción.

### Doble mecanismo cliente
El frontend usa **dos formas de portar la sesión simultáneamente**:
- **Cookie `httpOnly`** — la usa `middleware.ts` para proteger rutas de página (`/temas/*`, `/perfil/*`) a nivel de servidor, redirigiendo a `/login` si falta.
- **`localStorage` (`token`, `user`)** — lo usan los componentes cliente para llamar a las rutas de API, enviando `Authorization: Bearer <token>`.

Esto implica que **ambos deben mantenerse sincronizados** al hacer login/logout. El logout (`handleLogout` en `page.tsx` y `perfil/page.tsx`) limpia `localStorage`, borra cookies manualmente en JS y llama a `POST /api/auth/logout` (que también borra la cookie y la sesión en BD). Si se modifica este flujo, hay que actualizar los tres lugares a la vez.

### Verificación de sesión en rutas de API
`src/lib/session.ts` centraliza la validación de sesión:
- `getUserFromToken(token)` — devuelve el usuario dueño de la sesión o `null`; si la sesión expiró, la elimina de la BD.
- `requireAdmin(req)` — lee el Bearer token y exige rol `admin`. Se usa en todas las rutas `/api/admin/*`:
```ts
const auth = await requireAdmin(req);
if ('error' in auth) return auth.error;
// auth.user es el administrador autenticado
```
- `getBearerToken(req)` — extrae el token del header `Authorization`.

Las rutas `topics/structure` y `topics/visible` usan `getUserFromToken` (por lo que ahora también invalidan sesiones expiradas). `auth/me` y `auth/logout` conservan su propia lógica. Las páginas de servidor (`temas/[slug]`) leen la cookie `token` y llaman a `getUserFromToken`.

### Roles
`student`, `teacher`, `admin` como strings libres (no hay `enum` de Prisma). Las rutas `/api/admin/*` exigen `role === 'admin'`. `teacher` solo se usa para ver todos los temas (tratado igual que admin) en `topics/structure` y `topics/visible`, **no** tiene acceso a las rutas `/api/admin/*`.

### Middleware (`src/middleware.ts`)
Protege por **presencia de cookie**, no valida el token contra la base de datos (eso ocurre después, en cada API o página server component). Rutas:
- Protegidas (requieren cookie): `/temas/:path*`, `/perfil/:path*`.
- Solo para no-autenticados: `/login` (si hay cookie, redirige a `/`).

## 5. API — referencia de endpoints

Todas las rutas devuelven JSON. Salvo indicación, requieren header `Authorization: Bearer <token>`.

### Auth (`/api/auth`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login, crea sesión, fija cookie |
| POST | `/api/auth/register` | — | **Deshabilitado**: responde 403. Las cuentas las crea un administrador (`/api/admin/create-user` o carga CSV) |
| POST | `/api/auth/logout` | Cookie o Bearer | Elimina sesión(es) con ese token y borra cookie |
| GET | `/api/auth/me` | Bearer | Devuelve datos del usuario autenticado |

### Administración de usuarios (`/api/admin`)
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/admin/create-user` | admin | Crea usuario con rol y grupo arbitrarios |
| DELETE | `/api/admin/delete-user?id=` | admin | Elimina usuario (no permite auto-eliminación) |
| GET | `/api/admin/list-users` | admin | Lista todos los usuarios |
| POST | `/api/admin/upload-csv` | admin | Carga masiva de estudiantes desde CSV (`multipart/form-data`, campo `file`) |

**Formato esperado del CSV** (columnas por nombre, ver `src/app/api/admin/upload-csv/route.ts`):
`No, Apellidos, Nombre, Documento, Correo, Grupo`. La contraseña inicial de cada estudiante creado es su **número de documento** (hasheado con bcrypt). Filas con email/documento faltante, grupo inválido, o email ya existente se omiten y se reportan en `errors`.

### Temas — administración (`/api/admin/topics`)
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/admin/topics` | admin | Lista todos los temas (sin filtrar por visibilidad) |
| POST | `/api/admin/topics` | admin | Actualiza `visibleGroup1` o `visibleGroup2` de un tema (`{ topicId, group, visible }`) |
| POST | `/api/admin/topics/create` | admin | Crea un tema nuevo (`{ title, slug, parte?, parentSlug? }`); `order` se autoasigna como `max(order) + 1` |
| GET | `/api/admin/topics/[id]` | admin | Detalle de un tema con sus `contents` y `links` |
| PUT | `/api/admin/topics/[id]` | admin | Actualiza título y **reemplaza completamente** `contents` y `links` (borra todos los existentes y los vuelve a crear con el orden del array recibido) |
| POST | `/api/admin/topics/sync` | admin | Sincroniza contra una lista fija de 121 temas hardcodeada en el propio archivo de ruta (crea los que faltan, actualiza título/orden de los existentes) |

> **Importante para mantenimiento**: la lista de temas "canónica" del curso vive como un array TypeScript dentro de `src/app/api/admin/topics/sync/route.ts` (`allTopics`). Si se reestructura el temario, ese array es la fuente de verdad para el botón "Sincronizar" del panel de administración. No crea ni actualiza `parte`/`parentSlug` — eso se hizo una única vez con un script de backfill ya eliminado (`prisma/migrate-hierarchy.js`, ejecutado y borrado tras confirmar que todos los temas quedaron con `parte`/`parentSlug` asignados; ver sección 8 si hace falta reconstruirlo).

### Temas — consulta pública/autenticada (`/api/topics`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/topics/structure` | Opcional | Árbol jerárquico (Parte → Sección → Subtemas) usado por `Sidebar.tsx`. Sin token o con rol no-admin/teacher, filtra por `grupo` del usuario; sin usuario reconocible, muestra todo (fallback permisivo) |
| GET | `/api/topics/visible` | Bearer | Lista plana de slugs visibles según el grupo del usuario; sin token devuelve `{ topics: [] }` |

### Páginas relevantes (no API)
- `GET /temas/[slug]` (`src/app/temas/[slug]/page.tsx`): server component que trae el `Topic` por slug directo de Prisma (sin pasar por la API `/api/topics/*`) y renderiza sus `contents`/`links`. **No filtra por visibilidad de grupo** — cualquier usuario autenticado (protegido solo por el middleware) que conozca la URL puede ver el contenido aunque el sidebar no se lo muestre. Si se requiere ocultamiento estricto, hay que añadir esa verificación aquí.
- `GET /perfil/tema/[id]`: editor de contenido de un tema. Es una página cliente sin protección de rol en el propio componente — confía en que la API (`/api/admin/topics/[id]`) rechace a no-admins; no hay una comprobación visual que oculte el enlace a no-administradores más allá de que solo se muestra el botón "Contenido" dentro del panel admin de `/perfil`.

## 6. Puntos de fragilidad / riesgos conocidos

1. **`PUT /api/admin/topics/[id]` borra y recrea `contents` y `links`** en cada guardado, pero lo hace dentro de una única `prisma.$transaction` (con `createMany`): si algo falla, el tema conserva su contenido anterior. Antes de guardar se valida el tipo de bloque y las URLs.
2. **Autenticación centralizada** en `src/lib/session.ts` (ver sección 4). `auth/me` y `auth/logout` aún tienen lógica propia; si se modifica el manejo de sesiones, revisar ambas.
3. **`JWT_SECRET` no se usa** — es una variable de entorno heredada del nombre (ya se eliminó la constante con valor por defecto de `lib/auth.ts`); el mecanismo de sesión no la consume. No confundir con un sistema JWT real al depurar.
4. **Visibilidad por grupo aplicada también en `/temas/[slug]`**: la página valida la sesión contra la BD y responde 404 si el tema está oculto para el grupo del estudiante (admin/teacher ven todo). Criterio idéntico al de `topics/structure`: un usuario no admin con `grupo` distinto de 1 o 2 no se filtra.
5. **La lista de temas en `topics/sync/route.ts` está duplicada** respecto a la base de datos real; mantenerla sincronizada manualmente si cambia el temario.
6. **`ClassLayout.tsx`** existe pero no está siendo usado por `temas/[slug]/page.tsx` (que reimplementa un layout similar inline). Verificar si sigue en uso antes de modificarlo o eliminarlo.
7. Contraseñas de estudiantes cargados vía CSV son su número de documento en texto — comunicar esto a los estudiantes para que las cambien (no hay flujo de cambio de contraseña implementado actualmente).
8. ~~Enlace roto a `/calendario`~~ — eliminado del sidebar.
9. **Validación básica de URLs**: los videos deben ser `https://` y los materiales/enlaces `http(s)://` o rutas relativas del sitio (`src/lib/url.ts`), tanto al guardar (`PUT`, error 400) como al renderizar (los bloques inválidos preexistentes no se muestran). No hay whitelist de dominios: cualquier URL `https` embebible funciona (YouTube, Google Drive `/preview`, etc.). Los permisos de acceso (p. ej. un archivo de Drive privado) los maneja Google del lado del iframe.

## 7. Variables de entorno

Definidas en `.env` (no versionado). Claves usadas:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL para Prisma |
| `JWT_SECRET` | Definida pero no utilizada por el código de autenticación actual (ver sección 6.3) |
| `NODE_ENV` | Controla `secure` de la cookie y nivel de logging de Prisma |

## 8. Comandos y flujo de trabajo

```bash
cd "CursoModelosEstocásticos/curso_modelos_estocasticos"
npm install
npm run dev          # servidor de desarrollo con Turbopack
npm run build         # build de producción
npm start              # servir build de producción
npm run lint            # Biome check
npm run format           # Biome format --write
npm run seed              # crea usuario admin (admin1@example.com / clave123) vía prisma/seed.js
```

### Migraciones de base de datos
```bash
npx prisma migrate dev --name <nombre>   # crear y aplicar una migración en desarrollo
npx prisma migrate deploy                 # aplicar migraciones pendientes en producción
npx prisma studio                          # explorador visual de datos
```

Migraciones existentes (`prisma/migrations/`): esquema inicial, relación sesión-usuario, campo `grupo`, modelo `Topic`, visibilidad por grupo, `parentSlug`/`parte`/editor de temas (`add_topic_editor`).

### Backfill de jerarquía (histórico, ya no está en el repo)
La asignación de `parte` y `parentSlug` a los temas ya existentes se hizo con un script puntual (`prisma/migrate-hierarchy.js`), ejecutado una sola vez (`node prisma/migrate-hierarchy.js`) y borrado del repositorio tras confirmar que los 122 temas quedaron correctamente etiquetados (121 con `parte`, 84 con `parentSlug` — los que no tienen `parentSlug` son los temas raíz). El script asignaba `parte` según rangos de `order` y `parentSlug` según un mapa fijo `childSlug → parentSlug` codificado en el propio archivo. Si se necesita reconstruir la jerarquía desde cero (p. ej. tras un reseed completo), habría que recrear un script equivalente basándose en este historial.

## 9. Convenciones de estilo

- Formateo/lint gestionado por **Biome** (`biome.json`), no ESLint/Prettier.
- Estilos con Tailwind CSS 4 + variables CSS personalizadas definidas en `globals.css` (`--color-background`, `--color-header`, `--color-accent`, etc.), con soporte de tema oscuro vía atributo `data-theme` en `<html>` y persistencia en `localStorage('theme')`.
- Componentes de página bajo `src/app/**/page.tsx` siguen la convención de App Router de Next.js; los que usan hooks de React llevan la directiva `"use client"` al inicio del archivo.

## 10. Cómo extender el proyecto (guía rápida)

- **Añadir un nuevo tipo de contenido** (además de TEXT/VIDEO/MATERIAL): actualizar el `union type` en `perfil/tema/[id]/page.tsx`, el `switch`/if-chain de renderizado en `temas/[slug]/page.tsx`, y considerar si `Content.type` debería pasar a ser un `enum` en `schema.prisma` (actualmente es `String` libre).
- **Añadir un nuevo rol**: no hay enum que actualizar en Prisma (es `String`), pero sí revisar todas las comprobaciones `role === 'admin'` / `role === 'teacher'` dispersas en las rutas API y en `Sidebar.tsx`/`perfil/page.tsx`.
- **Cambiar la duración de la sesión**: `getTokenExpiration()` en `src/lib/auth.ts` (actualmente 7 días) y el `maxAge` de la cookie en `login` deben modificarse juntos.
- **Reestructurar el temario**: actualizar el array `allTopics` en `src/app/api/admin/topics/sync/route.ts` y volver a ejecutar "Sincronizar" desde el panel de administración; si cambian relaciones padre-hijo a gran escala, considerar un script de backfill puntual (ver sección 8) en vez de editarlas una por una desde la pestaña "Visibilidad".
- **Agregar soporte para otro formato de fórmulas o de video**: la lógica de parseo LaTeX vive en `src/components/LatexContent.tsx` (regex para `$$...$$` y `$...$`); la lógica de reproducción de video vive directo en el `<iframe>` de `temas/[slug]/page.tsx`, sin capa de validación intermedia.
