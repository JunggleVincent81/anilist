-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TEXT', 'ANIME_STATUS', 'ANIME_PROGRESS', 'ACHIEVEMENT_UNLOCKED', 'REVIEW_PUBLISHED');

-- CreateEnum
CREATE TYPE "ActivityVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE');

-- CreateTable
CREATE TABLE "UserSocialSettings" (
    "userId" UUID NOT NULL,
    "autoActivityEnabled" BOOLEAN NOT NULL DEFAULT false,
    "activityVisibility" "ActivityVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSocialSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ActivityType" NOT NULL,
    "text" VARCHAR(500),
    "animeId" UUID,
    "animeStatus" "AnimeListStatus",
    "progressEpisodes" INTEGER,
    "achievementId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_type_createdAt_idx" ON "Activity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_animeId_createdAt_idx" ON "Activity"("animeId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_achievementId_createdAt_idx" ON "Activity"("achievementId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserSocialSettings" ADD CONSTRAINT "UserSocialSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Episode progress recorded by an activity cannot be negative.
ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_progressEpisodes_nonnegative"
CHECK (
  "progressEpisodes" IS NULL
  OR "progressEpisodes" >= 0
);

-- TEXT activities must contain non-empty text.
ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_text_required_for_text_type"
CHECK (
  "type" <> 'TEXT'
  OR (
    "text" IS NOT NULL
    AND LENGTH(BTRIM("text")) > 0
  )
);

