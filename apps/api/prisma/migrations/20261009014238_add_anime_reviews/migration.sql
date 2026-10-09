-- CreateTable
CREATE TABLE "AnimeReview" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "animeId" UUID NOT NULL,
    "title" VARCHAR(150),
    "body" VARCHAR(10000) NOT NULL,
    "score" DECIMAL(3,1),
    "isSpoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimeReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimeReview_animeId_createdAt_id_idx" ON "AnimeReview"("animeId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "AnimeReview_userId_createdAt_id_idx" ON "AnimeReview"("userId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AnimeReview_userId_animeId_key" ON "AnimeReview"("userId", "animeId");

-- AddForeignKey
ALTER TABLE "AnimeReview" ADD CONSTRAINT "AnimeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimeReview" ADD CONSTRAINT "AnimeReview_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AN-122: Review content integrity
ALTER TABLE "AnimeReview"
ADD CONSTRAINT "AnimeReview_body_nonempty"
CHECK (length(btrim("body")) > 0);

-- Optional title cannot be whitespace-only
ALTER TABLE "AnimeReview"
ADD CONSTRAINT "AnimeReview_title_nonempty"
CHECK (
  "title" IS NULL
  OR length(btrim("title")) > 0
);

-- Optional score: 1.0 to 10.0, increments of 0.5
ALTER TABLE "AnimeReview"
ADD CONSTRAINT "AnimeReview_score_valid"
CHECK (
  "score" IS NULL
  OR (
    "score" >= 1.0
    AND "score" <= 10.0
    AND mod("score" * 10, 5) = 0
  )
);
