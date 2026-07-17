import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { getCachedCandidatePeople, getRatings, markRecommendationEvents, saveRecommendationHistory } from "@/lib/data";
import { candidatesFromRatings, scoreRecommendations } from "@/lib/recommendations/engine";
import { getCandidatePool, isDemoMode } from "@/lib/tmdb";
import { cacheMediaSummaries, cacheSearch, getCachedSearch } from "@/lib/media-cache";
import { assertSameOrigin, enforceRateLimit } from "@/lib/request-security";

export async function GET(request: NextRequest) {
  try {
    enforceRateLimit(request, "recommendations", 20, 60_000);
    const fresh = request.nextUrl.searchParams.get("refresh") === "1";
    const [ratings, cachedPopular, cachedDiscovery] = await Promise.all([
      getRatings(),
      fresh ? null : getCachedSearch("__recommendations_popular__", 1),
      fresh ? null : getCachedSearch("__recommendations_discovery__", 1),
    ]);
    const genericCandidates =
      cachedPopular && cachedDiscovery
        ? [
            ...cachedPopular.results.map((media) => ({ media, source: "popular" as const })),
            ...cachedDiscovery.results.map((media) => ({ media, source: "discovery" as const })),
          ]
        : await getCandidatePool(fresh);
    if (!cachedPopular || !cachedDiscovery || fresh) {
      await Promise.all([
        cacheSearch(
          "__recommendations_popular__",
          1,
          genericCandidates.filter(({ source }) => source === "popular").map(({ media }) => media),
          1,
        ),
        cacheSearch(
          "__recommendations_discovery__",
          1,
          genericCandidates.filter(({ source }) => source === "discovery").map(({ media }) => media),
          1,
        ),
      ]);
    }
    await cacheMediaSummaries(genericCandidates.map(({ media }) => media));
    const candidates = [
      ...candidatesFromRatings(ratings),
      ...genericCandidates.map(({ media, source }) => ({ media, source })),
    ];
    const people = await getCachedCandidatePeople(candidates.map(({ media }) => media));
    const result = scoreRecommendations(
      ratings,
      candidates.map((candidate) => ({
        ...candidate,
        people: people.get(`${candidate.media.type}:${candidate.media.tmdbId}`) ?? [],
      })),
    );
    await saveRecommendationHistory(result.recommendations);
    return NextResponse.json({ ...result, demoMode: isDemoMode });
  } catch (error) {
    return apiError(error, "Empfehlungen konnten gerade nicht berechnet werden.");
  }
}

const eventSchema = z.object({
  event: z.enum(["displayed", "clicked"]),
  items: z
    .array(z.object({ type: z.enum(["movie", "tv"]), tmdbId: z.number().int().positive() }))
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = eventSchema.parse(await request.json());
    await markRecommendationEvents(body.items, body.event);
    return NextResponse.json({ tracked: true });
  } catch (error) {
    return apiError(error, "Das Empfehlungsereignis konnte nicht gespeichert werden.");
  }
}
