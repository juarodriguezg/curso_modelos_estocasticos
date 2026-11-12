# Guía de despliegue del módulo 4.3 (cursos y usuarios)

Pasos para llevar a producción la rama `rf_modulo_cursos`. Todos los comandos se ejecutan desde la carpeta del proyecto (`curso_modelos_estocasticos/`), cuyo `.env` apunta a la base de producción.

Orden recomendado:

1. Respaldo de la base.
2. Crear `CRON_SECRET` en Vercel.
3. Aplicar la migración `add_courses`.
4. Fusionar el PR y desplegar.
5. Backfill: convertir los grupos actuales en cursos.
6. Verificar.

La migración va **antes** del despliegue porque el código nuevo consulta las tablas nuevas. Al revés no hay problema: la migración solo agrega tablas y columnas, y el código que está hoy en producción sigue funcionando con ellas.

---

## 1. Respaldo de la base

Carga la URL de la base en la terminal (se lee del `.env`, no hace falta copiarla a mano):

```bash
export DATABASE_URL=$(grep '^DATABASE_URL' .env | cut -d'"' -f2)
```

Haz el respaldo **fuera del repositorio**, porque contiene los hashes de contraseña de los usuarios:

```bash
pg_dump "$DATABASE_URL" -Fc -f ~/respaldo_curso_antes_4_3_$(date +%F).dump
```

Comprueba que el archivo no está vacío:

```bash
pg_restore --list ~/respaldo_curso_antes_4_3_*.dump | head
```

**Si `pg_dump` falla con `server version mismatch`:** el servidor de Aiven usa una versión de PostgreSQL más nueva que tu cliente (tienes la 16). Tienes dos opciones:

- Instalar el cliente de la versión del servidor desde el repositorio oficial de PostgreSQL (`postgresql-client-17`, por ejemplo).
- O usar los respaldos automáticos de Aiven: en la consola, el servicio de la base → pestaña **Backups**. Revisa que haya uno de hoy antes de seguir.

**Restaurar el respaldo** (solo si algo sale mal; borra lo que haya y repone lo del respaldo):

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" ~/respaldo_curso_antes_4_3_AAAA-MM-DD.dump
```

---

## 2. Crear `CRON_SECRET` en Vercel

El cron diario que finaliza los cursos necesita un secreto. Sin él, `/api/cron/finalize-courses` responde 401 y los cursos nunca se finalizan solos.

1. Genera un valor aleatorio:

   ```bash
   openssl rand -hex 32
   ```

2. En Vercel: proyecto → **Settings** → **Environment Variables** → **Add**.
   - Nombre: `CRON_SECRET`
   - Valor: el que generaste.
   - Entorno: **Production** (no hace falta en Preview ni Development, porque Vercel solo ejecuta crons en producción).
3. Guarda el valor en un lugar seguro; lo usarás en el paso 6 para probar el cron.

Hazlo antes de fusionar el PR: las variables de entorno se aplican en el siguiente despliegue.

---

## 3. Aplicar la migración

Primero mira qué falta por aplicar:

```bash
npx prisma migrate status
```

Debe aparecer `20261111000000_add_courses` como pendiente y nada más. Si aparece otra migración pendiente que no esperabas, detente y revísala antes de seguir.

Aplica:

```bash
npx prisma migrate deploy
```

Vuelve a correr `npx prisma migrate status`; debe decir `Database schema is up to date!`.

---

## 4. Fusionar el PR y desplegar

1. Abre el PR de `rf_modulo_cursos` hacia `main` (contiene solo los 3 commits del módulo 4.3) y fusiónalo.
2. Vercel despliega `main` automáticamente. El `build` ejecuta `prisma generate` antes de `next build`, así que el cliente de Prisma incluye los modelos nuevos.
3. Espera a que el despliegue quede en **Ready**.

Hasta que corras el backfill, los estudiantes no tienen matrícula y siguen viendo los temas con la regla anterior por grupo; no notan ningún cambio.

> Nota: si Vercel hizo un despliegue de vista previa de la rama antes de migrar, ese preview pudo mostrar errores al consultar tablas que aún no existían. No afecta a producción.

---

## 5. Backfill: convertir los grupos actuales en cursos

El script `prisma/backfill-courses.js` hace, en una sola transacción:

- Asocia **todos los temas sin asignatura** a la asignatura indicada (el temario actual es de Modelos Estocásticos).
- Crea el periodo, si no existe.
- Crea un curso por cada valor de `User.grupo` mayor que 0 que tengan los estudiantes (grupo 1 → curso «Grupo 1», etc.).
- Matricula a cada estudiante en el curso de su grupo.
- Copia la visibilidad: cada tema con `visibleGroup1 = false` queda oculto en el curso del grupo 1, y lo mismo con el grupo 2.

Es idempotente: si lo ejecutas dos veces no duplica nada.

### 5.1 Datos que necesitas

| Variable | Qué es | Ejemplo |
|---|---|---|
| `SUBJECT_CODE` | Código de la asignatura. Si ya la creaste en el panel de Asignaturas, usa **ese mismo código**; si no existe, el script la crea. | `2016701` |
| `SUBJECT_NAME` | Nombre de la asignatura. Solo se usa si hay que crearla. | `Modelos Estocásticos` |
| `PERIOD_NAME` | Nombre del periodo actual. | `2026-2S` |
| `PERIOD_START` | Primer día de clases, formato `AAAA-MM-DD`. | `2026-08-03` |
| `PERIOD_END` | Último día del periodo, formato `AAAA-MM-DD`. | `2026-11-28` |

Para ver si la asignatura ya existe y con qué código:

```bash
psql "$DATABASE_URL" -c 'select code, name from "Subject";'
```

**Cuidado con `PERIOD_END`:** el cron finaliza los cursos el día siguiente a esa fecha (hora de Bogotá). Si pones una fecha que ya pasó, los cursos quedarán finalizados, y en solo lectura, en la siguiente ejecución del cron. Usa la fecha real de cierre del semestre; si después necesitas cambiarla, puedes editar el periodo desde **Periodos** en el panel.

### 5.2 Simulación

Reemplaza los valores de ejemplo por los reales:

```bash
SUBJECT_CODE=2016701 SUBJECT_NAME="Modelos Estocásticos" PERIOD_NAME=2026-2S PERIOD_START=2026-08-03 PERIOD_END=2026-11-28 node prisma/backfill-courses.js --dry-run
```

No guarda nada. Imprime un resumen como este:

```text
Simulación (--dry-run), no se guardó nada: {
  asignatura: '2016701 — Modelos Estocásticos',
  periodo: '2026-2S',
  temasAsociados: 120,
  cursos: [ 'Grupo 1', 'Grupo 2' ],
  matriculasNuevas: 58,
  temasOcultos: 7
}
```

Revisa que:

- `cursos` tenga los grupos que esperas.
- `matriculasNuevas` coincida con el número de estudiantes con grupo asignado. Puedes contarlos así:

  ```bash
  psql "$DATABASE_URL" -c "select grupo, count(*) from \"User\" where role = 'student' group by grupo order by grupo;"
  ```

  Los estudiantes con `grupo = 0` **no** se matriculan; tendrás que matricularlos a mano desde el curso.
- `temasOcultos` cuadre con los temas que hoy tienes ocultos para algún grupo.

### 5.3 Ejecución real

El mismo comando sin `--dry-run`:

```bash
SUBJECT_CODE=2016701 SUBJECT_NAME="Modelos Estocásticos" PERIOD_NAME=2026-2S PERIOD_START=2026-08-03 PERIOD_END=2026-11-28 node prisma/backfill-courses.js
```

Debe terminar con `Migración aplicada:` y el mismo resumen que la simulación.

Desde este momento la visibilidad de los temas se decide por curso.

---

## 6. Verificación

En el panel de administración (inicia sesión como administrador):

1. **Cursos:** aparecen los cursos del periodo, activos, con su número de estudiantes.
2. **Detalle de un curso → Temas:** los temas que estaban ocultos para ese grupo aparecen ocultos.
3. **/perfil → Visibilidad:** hay un botón por curso en lugar de G1/G2.

Como estudiante (con una cuenta de prueba o pidiéndoselo a alguien): el temario se ve igual que antes del despliegue.

Prueba el cron a mano. Debe responder `{"finalized":[]}` mientras el periodo no haya terminado:

```bash
curl -H "Authorization: Bearer EL_VALOR_DE_CRON_SECRET" https://TU_DOMINIO/api/cron/finalize-courses
```

Sin el encabezado debe responder 401. En Vercel, **Settings → Cron Jobs** debe mostrar `/api/cron/finalize-courses` con horario `30 5 * * *` (00:30 en Bogotá). En el plan Hobby, Vercel puede ejecutarlo en cualquier momento dentro de esa hora.

---

## Cambios que notarán los administradores

- Los estudiantes nuevos ya no se cargan desde «Cargar CSV» en `/perfil`; esa pestaña remite a **Cursos**. La carga CSV se hace dentro de cada curso, con las columnas `Correo`, `Documento`, `Nombre` y `Apellidos`.
- Un estudiante nuevo entra con su número de documento como contraseña inicial.
- No se puede eliminar un usuario con matrículas: se desactiva su matrícula en el curso.
- No se puede eliminar una asignatura con cursos activos.

## Fase posterior (no incluida)

Cuando el backfill esté confirmado en producción y haya pasado un tiempo sin problemas, se pueden eliminar `User.grupo` y `Topic.visibleGroup1/2` (fase 8 de `docs/PLAN_MODULO_4_3.md`). Hasta entonces se mantienen sincronizados como respaldo.
