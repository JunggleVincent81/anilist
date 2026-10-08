-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('JOURNEY', 'COMPLETION', 'EPISODES', 'RATING', 'REWATCH', 'FAVORITES', 'GENRE');

-- CreateEnum
CREATE TYPE "AchievementMetric" AS ENUM ('TRACKED_ANIME', 'COMPLETED_ANIME', 'EPISODES_LOGGED', 'SCORED_ANIME', 'REWATCHES', 'FAVORITE_ANIME', 'GENRE_ANIME');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "equippedTitleAchievementId" UUID;

-- CreateTable
CREATE TABLE "Achievement" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "metric" "AchievementMetric" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "targetKey" VARCHAR(191),
    "iconKey" VARCHAR(64) NOT NULL,
    "titleReward" VARCHAR(80),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementId" UUID NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "showcasePosition" INTEGER,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE INDEX "Achievement_metric_idx" ON "Achievement"("metric");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE INDEX "Achievement_isActive_sortOrder_idx" ON "Achievement"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlockedAt_idx" ON "UserAchievement"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_showcasePosition_key" ON "UserAchievement"("userId", "showcasePosition");

-- CreateIndex
CREATE INDEX "User_equippedTitleAchievementId_idx" ON "User"("equippedTitleAchievementId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_equippedTitleAchievementId_fkey" FOREIGN KEY ("equippedTitleAchievementId") REFERENCES "Achievement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
