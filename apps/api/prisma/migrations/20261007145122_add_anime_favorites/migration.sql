-- CreateTable
CREATE TABLE "AnimeFavorite" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimeFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimeFavorite_animeId_idx" ON "AnimeFavorite"("animeId");

-- CreateIndex
CREATE INDEX "AnimeFavorite_userId_createdAt_idx" ON "AnimeFavorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeFavorite_userId_animeId_key" ON "AnimeFavorite"("userId", "animeId");

-- AddForeignKey
ALTER TABLE "AnimeFavorite" ADD CONSTRAINT "AnimeFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeFavorite" ADD CONSTRAINT "AnimeFavorite_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
