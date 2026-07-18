ALTER TABLE "MediaItem" ADD COLUMN "scopeId" TEXT NOT NULL DEFAULT 'local-user';
ALTER TABLE "SearchCache" ADD COLUMN "scopeId" TEXT NOT NULL DEFAULT 'local-user';

DROP INDEX "MediaItem_tmdbId_type_key";
DROP INDEX "MediaItem_type_idx";
DROP INDEX "SearchCache_query_page_key";
DROP INDEX "SearchCache_expiresAt_idx";

CREATE UNIQUE INDEX "MediaItem_tmdbId_type_scopeId_key" ON "MediaItem"("tmdbId", "type", "scopeId");
CREATE INDEX "MediaItem_scopeId_type_idx" ON "MediaItem"("scopeId", "type");
CREATE UNIQUE INDEX "SearchCache_query_page_scopeId_key" ON "SearchCache"("query", "page", "scopeId");
CREATE INDEX "SearchCache_scopeId_expiresAt_idx" ON "SearchCache"("scopeId", "expiresAt");
