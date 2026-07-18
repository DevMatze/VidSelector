-- Keep planned and currently watched titles as bookmarks. Completed and dropped
-- entries are deliberately removed because the simplified list no longer tracks
-- viewing progress.
CREATE TABLE "new_WatchEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchEntry_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_WatchEntry" ("id", "userId", "mediaItemId", "createdAt", "updatedAt")
SELECT "id", "userId", "mediaItemId", "createdAt", "updatedAt"
FROM "WatchEntry"
WHERE "status" IN ('planned', 'watching');

DROP TABLE "WatchEntry";
ALTER TABLE "new_WatchEntry" RENAME TO "WatchEntry";

CREATE UNIQUE INDEX "WatchEntry_userId_mediaItemId_key" ON "WatchEntry"("userId", "mediaItemId");
CREATE INDEX "WatchEntry_userId_updatedAt_idx" ON "WatchEntry"("userId", "updatedAt");
