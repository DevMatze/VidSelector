import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { cacheSearch, findCachedMedia, getCachedSearch, purgeExpiredMediaCache } from "@/lib/media-cache";
import { isDemoMode, searchMedia } from "@/lib/tmdb";
import { enforceRateLimit } from "@/lib/request-security";
import { getBookmarkMap, getProfileLanguage } from "@/lib/data";
import type { MediaSummary } from "@/lib/types";

const querySchema = z.string().trim().min(2).max(200);

async function addBookmarks(results: MediaSummary[]) {
  const bookmarks = await getBookmarkMap(results);
  return results.map((media) => ({
    ...media,
    bookmarked: bookmarks.has(`${media.type}:${media.tmdbId}`),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const query = querySchema.parse(request.nextUrl.searchParams.get("q") ?? "");
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .default(1)
      .parse(request.nextUrl.searchParams.get("page") ?? "1");
    enforceRateLimit(request, "search", 60, 60_000);
    const language = await getProfileLanguage();
    const cachedQuery = await getCachedSearch(query, page);
    if (cachedQuery) {
      const results = await addBookmarks(cachedQuery.results);
      return NextResponse.json({ ...cachedQuery, results, page, demoMode: isDemoMode, cacheHit: true });
    }

    const localResults = page === 1 ? await findCachedMedia(query) : [];
    let remote;
    try {
      remote = await searchMedia(query, page, language);
    } catch (error) {
      if (localResults.length) {
        return NextResponse.json({
          results: await addBookmarks(localResults),
          page,
          totalPages: 1,
          demoMode: isDemoMode,
          cacheHit: true,
          partial: true,
        });
      }
      throw error;
    }
    const merged = new Map<string, (typeof remote.results)[number]>();
    for (const media of [...localResults, ...remote.results]) merged.set(`${media.type}:${media.tmdbId}`, media);
    const cacheableResults = [...merged.values()];
    await Promise.all([cacheSearch(query, page, cacheableResults, remote.totalPages), purgeExpiredMediaCache()]);
    const results = await addBookmarks(cacheableResults);
    return NextResponse.json({ results, page, totalPages: remote.totalPages, demoMode: isDemoMode, cacheHit: false });
  } catch (error) {
    return apiError(error, "Die Suche konnte nicht ausgeführt werden.");
  }
}
