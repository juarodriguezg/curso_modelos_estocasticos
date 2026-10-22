-- Agrega la jerarquía de temas (parte / parentSlug) que existía en schema.prisma
-- pero no estaba en ninguna migración. Es idempotente: en bases que ya tienen
-- estas columnas (creadas con `prisma db push`) no hace nada.

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "parentSlug" TEXT,
ADD COLUMN IF NOT EXISTS "parte" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Topic_parte_idx" ON "Topic"("parte");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Topic_parentSlug_idx" ON "Topic"("parentSlug");
