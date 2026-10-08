-- Achievement domain integrity constraints.

ALTER TABLE "Achievement"
ADD CONSTRAINT "Achievement_threshold_positive_check"
CHECK ("threshold" > 0);

ALTER TABLE "Achievement"
ADD CONSTRAINT "Achievement_sort_order_nonnegative_check"
CHECK ("sortOrder" >= 0);

ALTER TABLE "UserAchievement"
ADD CONSTRAINT "UserAchievement_showcase_position_check"
CHECK (
  "showcasePosition" IS NULL
  OR (
    "showcasePosition" >= 1
    AND "showcasePosition" <= 3
  )
);
