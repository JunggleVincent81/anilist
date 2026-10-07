-- Canonical display title replaces the old typed-title requirement.
ALTER TABLE "Anime"
DROP CONSTRAINT "Anime_has_canonical_title_check";

-- Canonical anime titles cannot be empty or whitespace-only.
ALTER TABLE "Anime"
ADD CONSTRAINT "Anime_title_not_empty_check"
CHECK (
  length(btrim("title")) > 0
);
