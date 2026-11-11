-- Añade Subject.slug (único). Se hace en pasos para no violar el constraint
-- único con las filas existentes: 1) columna nullable, 2) backfill desde el
-- nombre normalizado (con el id como sufijo para garantizar unicidad),
-- 3) NOT NULL + índice único + índice de búsqueda.

-- 1) Columna nullable
ALTER TABLE "Subject" ADD COLUMN "slug" TEXT;

-- 2) Backfill: slug a partir del nombre en minúsculas, con guiones. No se usa
--    unaccent (evita depender de extensiones); los caracteres no alfanuméricos
--    (incluidos acentos) se colapsan en guiones. Se añade un sufijo corto del id
--    para garantizar unicidad aunque dos nombres normalicen igual.
UPDATE "Subject"
SET "slug" = trim(both '-' from
  regexp_replace(
    lower("name"),
    '[^a-z0-9]+', '-', 'g'
  )
) || '-' || substr("id", 1, 6)
WHERE "slug" IS NULL;

-- 3) Restricciones e índices
ALTER TABLE "Subject" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");
CREATE INDEX "Subject_slug_idx" ON "Subject"("slug");
