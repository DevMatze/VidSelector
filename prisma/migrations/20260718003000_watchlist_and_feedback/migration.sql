ALTER TABLE "Recommendation" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'discovery';
ALTER TABLE "Recommendation" ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Recommendation" ADD COLUMN "skipCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Recommendation" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Recommendation" ADD COLUMN "dismissedAt" DATETIME;

CREATE INDEX "Recommendation_userId_active_idx" ON "Recommendation"("userId", "active");

CREATE TABLE "WatchEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "mediaItemId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WatchEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WatchEntry_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WatchEntry_userId_mediaItemId_key" ON "WatchEntry"("userId", "mediaItemId");
CREATE INDEX "WatchEntry_userId_status_idx" ON "WatchEntry"("userId", "status");

CREATE TRIGGER "WatchEntry_status_insert_check"
BEFORE INSERT ON "WatchEntry"
WHEN NEW."status" NOT IN ('planned', 'watching', 'completed', 'dropped')
BEGIN
  SELECT RAISE(ABORT, 'invalid watch status');
END;

CREATE TRIGGER "WatchEntry_status_update_check"
BEFORE UPDATE OF "status" ON "WatchEntry"
WHEN NEW."status" NOT IN ('planned', 'watching', 'completed', 'dropped')
BEGIN
  SELECT RAISE(ABORT, 'invalid watch status');
END;
