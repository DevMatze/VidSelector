-- CreateTable
CREATE TABLE "SearchCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "page" INTEGER NOT NULL DEFAULT 1,
    "resultKeys" TEXT NOT NULL DEFAULT '[]',
    "totalPages" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tmdbId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "releaseDate" TEXT,
    "genres" TEXT NOT NULL DEFAULT '[]',
    "voteAverage" REAL NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "popularity" REAL NOT NULL DEFAULT 0,
    "originalLanguage" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detailsCachedAt" DATETIME,
    "detailsExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MediaItem" ("backdropPath", "createdAt", "genres", "id", "metadata", "originalLanguage", "originalTitle", "overview", "popularity", "posterPath", "releaseDate", "title", "tmdbId", "type", "updatedAt", "voteAverage") SELECT "backdropPath", "createdAt", "genres", "id", "metadata", "originalLanguage", "originalTitle", "overview", "popularity", "posterPath", "releaseDate", "title", "tmdbId", "type", "updatedAt", "voteAverage" FROM "MediaItem";
DROP TABLE "MediaItem";
ALTER TABLE "new_MediaItem" RENAME TO "MediaItem";
CREATE INDEX "MediaItem_type_idx" ON "MediaItem"("type");
CREATE UNIQUE INDEX "MediaItem_tmdbId_type_key" ON "MediaItem"("tmdbId", "type");
CREATE TABLE "new_Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Rating" ("createdAt", "id", "mediaItemId", "updatedAt", "userId", "value") SELECT "createdAt", "id", "mediaItemId", "updatedAt", "userId", "value" FROM "Rating";
DROP TABLE "Rating";
ALTER TABLE "new_Rating" RENAME TO "Rating";
CREATE INDEX "Rating_userId_value_idx" ON "Rating"("userId", "value");
CREATE UNIQUE INDEX "Rating_userId_mediaItemId_key" ON "Rating"("userId", "mediaItemId");
CREATE TABLE "new_Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "reasons" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastShownAt" DATETIME,
    "displayCount" INTEGER NOT NULL DEFAULT 0,
    "displayed" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "laterRated" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Recommendation" ("clicked", "createdAt", "displayed", "id", "laterRated", "mediaItemId", "reasons", "score", "userId") SELECT "clicked", "createdAt", "displayed", "id", "laterRated", "mediaItemId", "reasons", "score", "userId" FROM "Recommendation";
DROP TABLE "Recommendation";
ALTER TABLE "new_Recommendation" RENAME TO "Recommendation";
CREATE INDEX "Recommendation_userId_score_idx" ON "Recommendation"("userId", "score");
CREATE UNIQUE INDEX "Recommendation_userId_mediaItemId_key" ON "Recommendation"("userId", "mediaItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SearchCache_expiresAt_idx" ON "SearchCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SearchCache_query_page_key" ON "SearchCache"("query", "page");
