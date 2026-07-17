import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { cacheSearch, findCachedMedia, getCachedSearch, purgeExpiredMediaCache } from "@/lib/media-cache";
import { isDemoMode, searchMedia } from "@/lib/tmdb";
import { enforceRateLimit } from "@/lib/request-security";

const querySchema = z.string().trim().min(2).max(200);

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
    const cachedQuery = await getCachedSearch(query, page);
    if (cachedQuery) return NextResponse.json({ ...cachedQuery, page, demoMode: isDemoMode, cacheHit: true });

    const localResults = page === 1 ? await findCachedMedia(query) : [];
    let remote;
    try {
      remote = await searchMedia(query, page);
    } catch (error) {
      if (localResults.length) {
        return NextResponse.json({
          results: localResults,
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
    const results = [...merged.values()];
    await Promise.all([cacheSearch(query, page, results, remote.totalPages), purgeExpiredMediaCache()]);
    return NextResponse.json({ results, page, totalPages: remote.totalPages, demoMode: isDemoMode, cacheHit: false });
  } catch (error) {
    return apiError(error, "Die Suche konnte nicht ausgeführt werden.");
  }
}
