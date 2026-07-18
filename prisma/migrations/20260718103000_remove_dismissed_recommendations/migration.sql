UPDATE "Recommendation"
SET "active" = true
WHERE "dismissedAt" IS NOT NULL;

ALTER TABLE "Recommendation" DROP COLUMN "dismissedAt";
