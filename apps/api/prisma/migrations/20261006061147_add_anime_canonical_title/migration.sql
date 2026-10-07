/*
  Warnings:

  - Added the required column `title` to the `Anime` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Anime" ADD COLUMN     "title" VARCHAR(500) NOT NULL;

-- CreateIndex
CREATE INDEX "Anime_title_idx" ON "Anime"("title");
