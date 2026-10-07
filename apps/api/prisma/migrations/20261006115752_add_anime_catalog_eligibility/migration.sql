-- CreateEnum
CREATE TYPE "AnimeCatalogStatus" AS ENUM ('INCLUDED', 'REVIEW', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "AnimeCatalogDecisionSource" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable
ALTER TABLE "Anime" ADD COLUMN     "catalogDecisionSource" "AnimeCatalogDecisionSource" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "catalogReason" VARCHAR(191),
ADD COLUMN     "catalogRuleVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "catalogStatus" "AnimeCatalogStatus" NOT NULL DEFAULT 'REVIEW';

-- CreateIndex
CREATE INDEX "Anime_catalogStatus_idx" ON "Anime"("catalogStatus");
