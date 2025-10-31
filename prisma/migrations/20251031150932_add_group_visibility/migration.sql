/*
  Warnings:

  - You are about to drop the column `visible` on the `Topic` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Topic_visible_idx";

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "visible",
ADD COLUMN     "visibleGroup1" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visibleGroup2" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Topic_visibleGroup1_idx" ON "Topic"("visibleGroup1");

-- CreateIndex
CREATE INDEX "Topic_visibleGroup2_idx" ON "Topic"("visibleGroup2");
